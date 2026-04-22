import { useEffect, useRef, useState } from "react";
import { supabase } from "@/api/base44Client"; // <-- Clean Supabase import
import { Plus, X, Clock, MapPin, AlertCircle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

function getGeofenceConfig() {
  const envLat = Number(import.meta.env.VITE_GEOFENCE_LAT);
  const envLon = Number(import.meta.env.VITE_GEOFENCE_LON);
  const envRadius = Number(import.meta.env.VITE_GEOFENCE_RADIUS_METERS ?? 0);
  const envOk =
    Number.isFinite(envLat) &&
    Number.isFinite(envLon) &&
    Number.isFinite(envRadius) &&
    envRadius > 0;
  if (envOk) {
    return { lat: envLat, lon: envLon, radiusMeters: envRadius, source: "env" };
  }
  return null;
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

// --- THE MODAL (CREATE LOG) ---
function LogModal({ onClose, onSaved }) {
  const { user } = useAuth();
  const employeeId = user?.id || null;

  const [form, setForm] = useState({
    type: "time_in",
    log_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [geofence, setGeofence] = useState(() => getGeofenceConfig());
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [withinGeofence, setWithinGeofence] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [cameraError, setCameraError] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const checkLocation = async () => {
    setGeoStatus("loading");
    setWithinGeofence(null);
    setDistanceMeters(null);
    try {
      const gf = getGeofenceConfig();
      setGeofence(gf);
      const c = await getCurrentCoords();
      setCoords(c);
      setGeoStatus("ok");
      if (!gf) {
        setWithinGeofence(null);
      } else {
        const distance = haversineMeters(
          { lat: gf.lat, lon: gf.lon },
          { lat: c.lat, lon: c.lon },
        );
        setDistanceMeters(distance);
        setWithinGeofence(distance <= gf.radiusMeters);
      }
    } catch (e) {
      setGeoStatus("error");
      setCoords(null);
      setDistanceMeters(null);
      setWithinGeofence(false);
    }
  };


  useEffect(() => {
    checkLocation();
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraStatus("loading");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }
      // Stop any previous stream first
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop();
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
      setCameraStatus("ready");
    } catch (e) {
      setCameraStatus("error");
      setCameraError(e?.message || "Camera permission required.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) v.srcObject = null;
    setCameraStatus("idle");
  };

  const capturePhoto = async () => {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      setCameraError("Failed to capture photo.");
      return;
    }
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoBlob(blob);
    setPhotoPreviewUrl(URL.createObjectURL(blob));
  };

  const clearPhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
  };

  const save = async () => {
    setSaving(true);
    let uploadedPath = null;
    try {
      // Create accurate timestamps for the database
      const timestamp = new Date().toISOString();

      if (!employeeId) {
        throw new Error("No current user found. Please log in again.");
      }

      const gf = getGeofenceConfig();
      setGeofence(gf);

      if (!gf) {
        throw new Error(
          "Geofence is not configured. Set it in .env (VITE_GEOFENCE_LAT/LON) or use 'Set geofence here'.",
        );
      }
      if (geoStatus !== "ok" || !coords) {
        throw new Error("GPS location is required to log attendance.");
      }
      if (withinGeofence !== true) {
        throw new Error(
          "You must be within the configured geofence to log attendance.",
        );
      }
      if (!photoBlob) {
        throw new Error("A camera photo is required as proof of attendance.");
      }

      const bucket =
        import.meta.env.VITE_ATTENDANCE_PROOFS_BUCKET || "attendance-proofs";
      const fileExt = photoBlob.type?.split("/").pop() || "jpg";
      const safeName = `${timestamp.replaceAll(":", "-")}_${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      uploadedPath = `${employeeId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uploadedPath, photoBlob, {
          contentType: photoBlob.type || "image/jpeg",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(uploadedPath);

      // Supabase Insert
      const { error } = await supabase.from("attendance_logs").insert([
        {
          employee_id: employeeId,
          type: form.type, // Maps perfectly to the 'attendance_type' ENUM in SQL
          log_date: form.log_date,
          device_timestamp: timestamp,
          calculated_server_time: timestamp,
          latitude: coords.lat,
          longitude: coords.lon,
          is_within_geofence: true,
          proof_photo_url: publicUrl,
        },
      ]);

      if (error) throw error;
      onSaved();
    } catch (error) {
      console.error("Error saving log:", error.message);
      alert("Failed to save: " + error.message);
      if (uploadedPath) {
        const bucket =
          import.meta.env.VITE_ATTENDANCE_PROOFS_BUCKET || "attendance-proofs";
        await supabase.storage.from(bucket).remove([uploadedPath]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Add Attendance Log</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-700">
                  Location / Geofence
                </div>
                {!geofence ? (
                  <div className="text-xs text-red-600 mt-0.5">
                    Geofence not configured. Set VITE_GEOFENCE_LAT/LON.
                  </div>
                ) : geoStatus === "loading" ? (
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking GPS…
                  </div>
                ) : geoStatus === "ok" ? (
                  <div className="text-xs text-slate-600 mt-0.5">
                    {withinGeofence ? (
                      <span className="text-green-700">Within geofence</span>
                    ) : (
                      <span className="text-red-600">Outside geofence</span>
                    )}
                    {geofence ? (
                      <span className="text-slate-500">
                        {" "}
                        · Radius {Math.round(geofence.radiusMeters)}m
                      </span>
                    ) : null}
                    {Number.isFinite(distanceMeters) ? (
                      <span className="text-slate-500">
                        {" "}
                        · Distance {Math.round(distanceMeters)}m
                      </span>
                    ) : null}
                    {coords ? (
                      <span className="text-slate-500">
                        {" "}
                        ({coords.lat.toFixed(5)}, {coords.lon.toFixed(5)})
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs text-red-600 mt-0.5">
                    GPS permission required.
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-8"
                onClick={checkLocation}
              >
                Re-check
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Proof Photo (Camera Only)
            </label>
            <div className="mt-2 space-y-3">
              {cameraError ? (
                <div className="text-xs text-red-600">{cameraError}</div>
              ) : null}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 gap-2"
                  onClick={startCamera}
                  disabled={cameraStatus === "loading"}
                >
                  <Camera className="w-4 h-4" />
                  {cameraStatus === "ready" ? "Camera on" : "Start camera"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8"
                  onClick={stopCamera}
                  disabled={cameraStatus !== "ready"}
                >
                  Stop
                </Button>
                <Button
                  type="button"
                  className="h-8"
                  onClick={capturePhoto}
                  disabled={cameraStatus !== "ready"}
                >
                  Capture
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8"
                  onClick={clearPhoto}
                  disabled={!photoBlob}
                >
                  Clear
                </Button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-black/5">
                <video
                  ref={videoRef}
                  className="w-full max-h-56 object-cover"
                  playsInline
                  muted
                />
              </div>
            </div>
            {photoPreviewUrl ? (
              <div className="mt-3">
                <img
                  src={photoPreviewUrl}
                  alt="Attendance proof"
                  className="w-full max-h-56 object-cover rounded-xl border border-slate-200"
                />
              </div>
            ) : null}
          </div>

          <div>
            {/* Employee is derived from the currently logged-in user */}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="time_in">Time In</option>
              <option value="time_out">Time Out</option>
            </select>
          </div>
          {/* Note: The UI lets you pick a date, but our DB records exact timestamps. 
              In a real app, you'd combine this date with a time input. */}
          <div>
            <label className="text-xs font-medium text-slate-600">
              Date (Used for UI sorting)
            </label>
            <Input
              className="mt-1"
              type="date"
              value={form.log_date}
              onChange={(e) => set("log_date", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Notes (Requires DB Column)
            </label>
            <Input
              className="mt-1"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={
              saving ||
              !employeeId ||
              !photoBlob ||
              geoStatus === "loading" ||
              !geofence ||
              withinGeofence !== true
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- THE MAIN PAGE (READ & FILTER) ---
export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );

  const load = async () => {
    try {
      setLoading(true);

      // Start building the Supabase query
      let query = supabase
        .from("attendance_logs")
        .select("*")
        .order("calculated_server_time", { ascending: false })
        .limit(200);

      // If a date is selected, filter by a timestamp range for that specific day
      if (dateFilter) {
        // Creates a range from 00:00:00 to 23:59:59 for the selected date
        const startOfDay = new Date(`${dateFilter}T00:00:00`).toISOString();
        const endOfDay = new Date(`${dateFilter}T23:59:59.999`).toISOString();
        query = query
          .gte("calculated_server_time", startOfDay)
          .lte("calculated_server_time", endOfDay);
      }

      const { data, error } = await query;
      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error("Failed to load attendance logs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dateFilter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Time Logs</h1>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Log
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Filter Date:
        </label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40 h-8 text-sm"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium px-2"
          >
            Show All Logs
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  "Employee ID",
                  "Type",
                  "Date",
                  "Time",
                  "Geofence",
                  "Late",
                  "Proof",
                  "Notes",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No logs found for this date.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td
                      className="px-4 py-3 text-sm font-medium text-slate-900"
                      title={l.employee_id}
                    >
                      {l.employee_id
                        ? l.employee_id.substring(0, 8) + "..."
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.type === "time_in" ? "bg-green-100 text-green-700 border border-green-200" : "bg-orange-100 text-orange-700 border border-orange-200"}`}
                      >
                        {l.type === "time_in" ? "Time In" : "Time Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {/* Extracting just the date from the timestamp */}
                      {new Date(l.calculated_server_time).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {new Date(l.device_timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {l.is_within_geofence === true ? (
                        <span className="text-green-600 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Within
                        </span>
                      ) : l.is_within_geofence === false ? (
                        <span className="text-red-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Outside
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* The SQL doesn't track 'is_late', this is usually calculated via a function later */}
                      {l.is_late ? (
                        <span className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />{" "}
                          {l.minutes_late}m
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {l.proof_photo_url ? (
                        <a
                          href={l.proof_photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {l.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <LogModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
