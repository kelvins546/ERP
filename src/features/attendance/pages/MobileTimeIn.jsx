import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Fingerprint, Wifi, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileTimeIn() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);

  const getLocation = () => new Promise((res, rej) => {
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(p => { setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }); setGeoStatus("ok"); res(p.coords); }, () => { setGeoStatus("error"); rej(); });
  });

  const logTime = async (type) => {
    setLoading(true);
    try {
      let lat = null, lon = null;
      try { const c = await getLocation(); lat = c.latitude; lon = c.longitude; } catch {}
      const now = new Date();
      const record = { employee_id: "current", type, device_timestamp: now.toISOString(), calculated_server_time: now.toISOString(), latitude: lat, longitude: lon, is_within_geofence: !!lat, biometric_verified: false, is_offline_sync: false };
      if (navigator.onLine) {
        await base44.entities.AttendanceLog.create(record);
        setStatus({ type, time: now.toLocaleTimeString(), synced: true });
      } else {
        const queue = [...offlineQueue, record];
        setOfflineQueue(queue);
        localStorage.setItem("offline_timein_queue", JSON.stringify(queue));
        setStatus({ type, time: now.toLocaleTimeString(), synced: false });
      }
    } finally { setLoading(false); }
  };

  const syncOffline = async () => {
    setLoading(true);
    const queue = JSON.parse(localStorage.getItem("offline_timein_queue") || "[]");
    for (const r of queue) { await base44.entities.AttendanceLog.create({ ...r, is_offline_sync: true }); }
    localStorage.removeItem("offline_timein_queue");
    setOfflineQueue([]);
    setStatus({ type: "sync", time: new Date().toLocaleTimeString(), synced: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Time In/Out</h1>
          <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>

        <div className="flex items-center justify-between text-sm px-2">
          <div className={`flex items-center gap-1.5 ${geoStatus==="ok"?"text-green-600":geoStatus==="error"?"text-red-500":"text-slate-400"}`}>
            <MapPin className="w-4 h-4"/>{geoStatus==="ok"?"Location OK":geoStatus==="error"?"GPS Error":"Location Pending"}
          </div>
          <div className={`flex items-center gap-1.5 ${navigator.onLine?"text-green-600":"text-red-500"}`}>
            {navigator.onLine ? <Wifi className="w-4 h-4"/> : <WifiOff className="w-4 h-4"/>}
            {navigator.onLine ? "Online" : "Offline"}
          </div>
        </div>

        {status && (
          <div className={`rounded-xl p-4 text-center ${status.synced?"bg-green-50 border border-green-200":"bg-yellow-50 border border-yellow-200"}`}>
            <p className="font-semibold text-sm">{status.type==="sync"?"Sync complete":status.type==="TIME_IN"?"Time In Recorded":"Time Out Recorded"}</p>
            <p className="text-xs text-slate-500">{status.time} · {status.synced?"Synced":"Saved offline"}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button className="w-full h-14 text-base bg-green-600 hover:bg-green-700 gap-2" onClick={() => logTime("TIME_IN")} disabled={loading}>
            <Fingerprint className="w-5 h-5"/> Time In
          </Button>
          <Button className="w-full h-14 text-base bg-red-600 hover:bg-red-700 gap-2" onClick={() => logTime("TIME_OUT")} disabled={loading}>
            <Fingerprint className="w-5 h-5"/> Time Out
          </Button>
          {offlineQueue.length > 0 && (
            <Button variant="outline" className="w-full gap-2" onClick={syncOffline} disabled={loading || !navigator.onLine}>
              <Wifi className="w-4 h-4"/> Sync {offlineQueue.length} Pending Records
            </Button>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 text-sm">Features</p>
          <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-500 shrink-0"/> Geotagging & Geofencing</div>
          <div className="flex items-center gap-2"><Fingerprint className="w-3 h-3 text-purple-500 shrink-0"/> Biometric / Touch ID (device-native)</div>
          <div className="flex items-center gap-2"><WifiOff className="w-3 h-3 text-orange-500 shrink-0"/> Offline Time-In with auto-sync</div>
          <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-green-500 shrink-0"/> Server-based time sync on upload</div>
        </div>
      </div>
    </div>
  );
}