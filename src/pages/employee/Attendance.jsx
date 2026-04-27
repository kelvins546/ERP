import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Clock,
  Camera,
  CheckCircle2,
  History,
  MapPin,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ESSAttendance() {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Camera State
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) fetchLogs();

    // Cleanup camera on unmount
    return () => stopCamera();
  }, [user]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("employee_id", user.id)
        .order("device_timestamp", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setCapturedPhoto(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert(
        "Could not access the camera. Please check your browser permissions.",
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      // Set canvas size to match video feed
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );

      // Convert to Base64 (low quality JPEG to save DB space)
      const imageDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.5);
      setCapturedPhoto(imageDataUrl);
      stopCamera();
    }
  };

  const retakeSelfie = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // --- SUBMIT ATTENDANCE ---
  const handleTimeLog = async (type) => {
    if (!capturedPhoto)
      return alert("Please capture a selfie to record your attendance.");

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("attendance_logs").insert([
        {
          employee_id: user.id,
          type: type, // 'time_in' or 'time_out'
          device_timestamp: now,
          calculated_server_time: now,
          photo_url: capturedPhoto, // Storing base64 directly into the text column
          notes: "Logged via Portal",
        },
      ]);

      if (error) throw error;

      setCapturedPhoto(null);
      fetchLogs();
      alert(`Successfully logged ${type.replace("_", " ")}!`);
    } catch (error) {
      alert("Failed to submit attendance: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Attendance
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Record your daily time logs and view your history.
          </p>
        </div>

        {/* Roadmap Feature: Quick Access to Leaves & OT */}
        <div className="flex items-center gap-3">
          <Link to="/portal/requests">
            <Button
              variant="outline"
              className="text-slate-600 border-slate-300 gap-2 hover:bg-slate-50"
            >
              <CalendarDays className="w-4 h-4" /> File Leave
            </Button>
          </Link>
          <Link to="/portal/requests">
            <Button
              variant="outline"
              className="text-slate-600 border-slate-300 gap-2 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" /> Request OT
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Time Clock & Camera */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2E6F40]" /> Time Clock
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
              {/* Camera Feed or Captured Photo */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center mb-4 border border-slate-300">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover"
                  />
                ) : isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Camera is off</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Controls */}
              {!isCameraActive && !capturedPhoto && (
                <Button
                  onClick={startCamera}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" /> Open Camera for Selfie
                </Button>
              )}

              {isCameraActive && (
                <div className="flex gap-2">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={captureSelfie}
                    className="flex-1 bg-[#2E6F40] hover:bg-[#235330] text-white"
                  >
                    Snap Photo
                  </Button>
                </div>
              )}

              {capturedPhoto && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleTimeLog("time_in")}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#2E6F40] hover:bg-[#235330] text-white h-12 text-lg"
                    >
                      Time In
                    </Button>
                    <Button
                      onClick={() => handleTimeLog("time_out")}
                      disabled={isSubmitting}
                      variant="outline"
                      className="flex-1 border-[#2E6F40] text-[#2E6F40] hover:bg-[#2E6F40]/10 h-12 text-lg"
                    >
                      Time Out
                    </Button>
                  </div>
                  <Button
                    onClick={retakeSelfie}
                    variant="ghost"
                    className="w-full text-slate-500"
                  >
                    Retake Photo
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> GPS Location is recorded
              automatically
            </p>
          </div>
        </div>

        {/* Right Column: Attendance History */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-[#2E6F40]" /> Recent Logs
            </h3>

            <div className="space-y-3">
              {loadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#2E6F40]/30 border-t-[#2E6F40] rounded-full animate-spin"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    No attendance logs found.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:border-[#2E6F40]/30 transition-colors"
                  >
                    {/* Selfie Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                      {log.photo_url ? (
                        <img
                          src={log.photo_url}
                          alt="Log selfie"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                          {log.type.replace("_", " ")}
                        </p>
                        {log.is_within_geofence && (
                          <span className="text-[10px] font-bold text-[#2E6F40] bg-[#2E6F40]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Valid Location
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {new Date(log.device_timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.device_timestamp).toLocaleDateString(
                          undefined,
                          { weekday: "long", month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
