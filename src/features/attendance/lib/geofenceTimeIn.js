const DEFAULT_MAX_ACCURACY_METERS = 50;
const DEFAULT_THRESHOLD_METERS = 50;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function localDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function createLocalStorageStore(prefix = "geofence_timein") {
  return {
    getItem(key) {
      return window?.localStorage?.getItem(`${prefix}:${key}`) ?? null;
    },
    setItem(key, value) {
      window?.localStorage?.setItem(`${prefix}:${key}`, value);
    },
    removeItem(key) {
      window?.localStorage?.removeItem(`${prefix}:${key}`);
    },
  };
}

function normalizeStore(store) {
  if (!store) return null;
  return {
    getItem: (k) => Promise.resolve(store.getItem(k)),
    setItem: (k, v) => Promise.resolve(store.setItem(k, v)),
    removeItem: (k) => Promise.resolve(store.removeItem(k)),
  };
}

function isValidNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function validateTarget(target) {
  return (
    target &&
    isValidNumber(target.lat) &&
    isValidNumber(target.lon) &&
    target.lat >= -90 &&
    target.lat <= 90 &&
    target.lon >= -180 &&
    target.lon <= 180
  );
}

/**
 * Geofence watcher that triggers a single-use Time-In per calendar day.
 *
 * - Uses navigator.geolocation.watchPosition with enableHighAccuracy=true
 * - Ignores low-quality points (accuracy > maxAccuracyMeters)
 * - Uses Haversine distance in meters
 * - Calls onTimeIn exactly once per local calendar day when within threshold
 *
 * Storage contract (pluggable for offline-first): { getItem, setItem, removeItem }
 * - Can be backed by localStorage (sync) or IndexedDB wrappers (async)
 */
export function createGeofenceTimeInWatcher({
  target,
  thresholdMeters = DEFAULT_THRESHOLD_METERS,
  maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS,
  store = createLocalStorageStore(),
  now = () => new Date(),
  onTimeIn,
  onUpdate,
  watchOptions,
} = {}) {
  if (!validateTarget(target)) {
    throw new Error(
      "Invalid geofence target. Provide { lat, lon } as finite numbers.",
    );
  }
  if (!isValidNumber(thresholdMeters) || thresholdMeters <= 0) {
    throw new Error("thresholdMeters must be a positive number.");
  }
  if (!isValidNumber(maxAccuracyMeters) || maxAccuracyMeters <= 0) {
    throw new Error("maxAccuracyMeters must be a positive number.");
  }
  if (typeof onTimeIn !== "function") {
    throw new Error("onTimeIn callback is required.");
  }

  const kv = normalizeStore(store);
  if (!kv) {
    throw new Error("A key-value store is required.");
  }

  const keys = {
    lastDay: "last_timein_day",
    lastPayload: "last_timein_payload",
  };

  let watchId = null;
  let inFlight = false;

  const getLastDay = async () => (await kv.getItem(keys.lastDay)) || null;
  const setLastDay = async (dayKey) => kv.setItem(keys.lastDay, dayKey);
  const setLastPayload = async (payload) =>
    kv.setItem(keys.lastPayload, JSON.stringify(payload));

  const shouldTriggerToday = async (dayKey) => {
    const last = await getLastDay();
    return last !== dayKey;
  };

  const handlePosition = async (pos) => {
    if (inFlight) return;
    inFlight = true;
    try {
      const accuracyMeters = pos?.coords?.accuracy;
      const lat = pos?.coords?.latitude;
      const lon = pos?.coords?.longitude;
      const timestampMs = pos?.timestamp;

      if (!isValidNumber(accuracyMeters) || accuracyMeters > maxAccuracyMeters) {
        onUpdate?.({
          ok: false,
          ignored: true,
          reason: "low_accuracy",
          accuracyMeters: isValidNumber(accuracyMeters) ? accuracyMeters : null,
        });
        return;
      }
      if (!isValidNumber(lat) || !isValidNumber(lon)) {
        onUpdate?.({ ok: false, ignored: true, reason: "missing_coords" });
        return;
      }

      const user = { lat, lon };
      const distanceMeters = haversineMeters(target, user);

      onUpdate?.({
        ok: true,
        ignored: false,
        accuracyMeters,
        distanceMeters,
        withinThreshold: distanceMeters <= thresholdMeters,
        coords: user,
      });

      if (distanceMeters > thresholdMeters) return;

      const dayKey = localDayKey(now());
      const canTrigger = await shouldTriggerToday(dayKey);
      if (!canTrigger) return;

      // Lock BEFORE calling onTimeIn to prevent double-trigger.
      await setLastDay(dayKey);

      const payload = {
        type: "time_in",
        dayKey,
        triggeredAt: new Date(timestampMs ?? Date.now()).toISOString(),
        coords: user,
        accuracyMeters,
        distanceMeters,
        thresholdMeters,
        target,
      };
      await setLastPayload(payload);

      await onTimeIn(payload);
    } finally {
      inFlight = false;
    }
  };

  const handleError = (err) => {
    onUpdate?.({ ok: false, ignored: false, reason: "geolocation_error", err });
  };

  return {
    start() {
      if (watchId != null) return;
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser.");
      }
      watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
        ...watchOptions,
      });
    },
    stop() {
      if (watchId == null) return;
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    },
    async reset() {
      await kv.removeItem(keys.lastDay);
      await kv.removeItem(keys.lastPayload);
    },
    async getLastTrigger() {
      const raw = await kv.getItem(keys.lastPayload);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  };
}

/**
 * Geofence watcher that can trigger BOTH Time-In (on enter) and Time-Out (on exit)
 * at most once per local calendar day.
 *
 * - Enter event: transition outside -> inside threshold
 * - Exit event: transition inside -> outside threshold
 * - Ignores low-quality points (accuracy > maxAccuracyMeters)
 * - Uses Haversine distance in meters
 */
export function createGeofenceInOutWatcher({
  target,
  thresholdMeters = DEFAULT_THRESHOLD_METERS,
  maxAccuracyMeters = DEFAULT_MAX_ACCURACY_METERS,
  store = createLocalStorageStore(),
  now = () => new Date(),
  onTimeIn,
  onTimeOut,
  requireTimeInBeforeTimeOut = true,
  onUpdate,
  watchOptions,
} = {}) {
  if (!validateTarget(target)) {
    throw new Error(
      "Invalid geofence target. Provide { lat, lon } as finite numbers.",
    );
  }
  if (!isValidNumber(thresholdMeters) || thresholdMeters <= 0) {
    throw new Error("thresholdMeters must be a positive number.");
  }
  if (!isValidNumber(maxAccuracyMeters) || maxAccuracyMeters <= 0) {
    throw new Error("maxAccuracyMeters must be a positive number.");
  }
  if (typeof onTimeIn !== "function" && typeof onTimeOut !== "function") {
    throw new Error("Provide at least one of onTimeIn / onTimeOut callbacks.");
  }

  const kv = normalizeStore(store);
  if (!kv) {
    throw new Error("A key-value store is required.");
  }

  const keys = {
    lastInDay: "last_timein_day",
    lastOutDay: "last_timeout_day",
    lastInPayload: "last_timein_payload",
    lastOutPayload: "last_timeout_payload",
    lastWithin: "last_within_geofence",
  };

  let watchId = null;
  let inFlight = false;

  const getLastInDay = async () => (await kv.getItem(keys.lastInDay)) || null;
  const getLastOutDay = async () => (await kv.getItem(keys.lastOutDay)) || null;

  const setLastInDay = async (dayKey) => kv.setItem(keys.lastInDay, dayKey);
  const setLastOutDay = async (dayKey) => kv.setItem(keys.lastOutDay, dayKey);

  const setLastInPayload = async (payload) =>
    kv.setItem(keys.lastInPayload, JSON.stringify(payload));
  const setLastOutPayload = async (payload) =>
    kv.setItem(keys.lastOutPayload, JSON.stringify(payload));

  const getLastWithin = async () => {
    const raw = await kv.getItem(keys.lastWithin);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  };

  const setLastWithin = async (within) =>
    kv.setItem(keys.lastWithin, within ? "true" : "false");

  const canTriggerInToday = async (dayKey) => (await getLastInDay()) !== dayKey;
  const canTriggerOutToday = async (dayKey) => (await getLastOutDay()) !== dayKey;

  const handlePosition = async (pos) => {
    if (inFlight) return;
    inFlight = true;
    try {
      const accuracyMeters = pos?.coords?.accuracy;
      const lat = pos?.coords?.latitude;
      const lon = pos?.coords?.longitude;
      const timestampMs = pos?.timestamp;

      if (!isValidNumber(accuracyMeters) || accuracyMeters > maxAccuracyMeters) {
        onUpdate?.({
          ok: false,
          ignored: true,
          reason: "low_accuracy",
          accuracyMeters: isValidNumber(accuracyMeters) ? accuracyMeters : null,
        });
        return;
      }
      if (!isValidNumber(lat) || !isValidNumber(lon)) {
        onUpdate?.({ ok: false, ignored: true, reason: "missing_coords" });
        return;
      }

      const user = { lat, lon };
      const distanceMeters = haversineMeters(target, user);
      const withinThreshold = distanceMeters <= thresholdMeters;

      onUpdate?.({
        ok: true,
        ignored: false,
        accuracyMeters,
        distanceMeters,
        withinThreshold,
        coords: user,
      });

      const prevWithin = await getLastWithin();
      await setLastWithin(withinThreshold);

      // Only treat as enter/exit if we have a previous state.
      if (prevWithin === null) return;

      const dayKey = localDayKey(now());
      const triggeredAt = new Date(timestampMs ?? Date.now()).toISOString();

      // Enter: outside -> inside
      if (prevWithin === false && withinThreshold === true && onTimeIn) {
        const canTrigger = await canTriggerInToday(dayKey);
        if (!canTrigger) return;

        await setLastInDay(dayKey);
        const payload = {
          type: "time_in",
          dayKey,
          triggeredAt,
          coords: user,
          accuracyMeters,
          distanceMeters,
          thresholdMeters,
          target,
        };
        await setLastInPayload(payload);
        await onTimeIn(payload);
        return;
      }

      // Exit: inside -> outside
      if (prevWithin === true && withinThreshold === false && onTimeOut) {
        if (requireTimeInBeforeTimeOut) {
          const lastInDay = await getLastInDay();
          if (lastInDay !== dayKey) return;
        }
        const canTrigger = await canTriggerOutToday(dayKey);
        if (!canTrigger) return;

        await setLastOutDay(dayKey);
        const payload = {
          type: "time_out",
          dayKey,
          triggeredAt,
          coords: user,
          accuracyMeters,
          distanceMeters,
          thresholdMeters,
          target,
        };
        await setLastOutPayload(payload);
        await onTimeOut(payload);
      }
    } finally {
      inFlight = false;
    }
  };

  const handleError = (err) => {
    onUpdate?.({ ok: false, ignored: false, reason: "geolocation_error", err });
  };

  return {
    start() {
      if (watchId != null) return;
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser.");
      }
      watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
        ...watchOptions,
      });
    },
    stop() {
      if (watchId == null) return;
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    },
    async reset() {
      await kv.removeItem(keys.lastInDay);
      await kv.removeItem(keys.lastOutDay);
      await kv.removeItem(keys.lastInPayload);
      await kv.removeItem(keys.lastOutPayload);
      await kv.removeItem(keys.lastWithin);
    },
    async getLastTriggers() {
      const rawIn = await kv.getItem(keys.lastInPayload);
      const rawOut = await kv.getItem(keys.lastOutPayload);
      const safeParse = (raw) => {
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };
      return { timeIn: safeParse(rawIn), timeOut: safeParse(rawOut) };
    },
  };
}
