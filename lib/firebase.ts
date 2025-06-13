"use client"

import { initializeApp, getApps } from "firebase/app"
import { getDatabase, ref, onValue, off, query, limitToLast, get, set } from "firebase/database"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { firebaseConfig } from "./config" 
import type { DeviceData, HistoricalData, SafetyData } from "./types"

let app: any = null
let database: any = null
let auth: any = null

try {
    const existingApps = getApps()
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = existingApps[0]
    }
    database = getDatabase(app)
    auth = getAuth(app)
    console.log("✅ Firebase: Initialized successfully")
} catch(error) {
    console.error("❌ Firebase initialization error", error);
}

export { app, database, auth }

// Other functions like subscribeToCurrentData, getFilteredSafetyData, signIn, etc. remain unchanged...
export const subscribeToCurrentData = (deviceId: string, callback: (data: DeviceData | null) => void): (() => void) => {
    if (!database) return () => {};
    const currentDataRef = ref(database, `devices/${deviceId}/current_data`);
    const listener = onValue(currentDataRef, (snapshot) => {
        callback(snapshot.val());
    }, (error) => {
        console.error(`Error subscribing to current data for ${deviceId}:`, error);
        callback(null);
    });
    return () => off(currentDataRef, 'value', listener);
};

export const getFilteredSafetyData = async (
  deviceId: string,
  startDate: string | Date,
  endDate: string | Date
): Promise<SafetyData | null> => {
    if (!database) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const alertsRef = ref(database, 'alerts');
    const historyRef = ref(database, `devices/${deviceId}/history`);

    try {
        const [alertsSnapshot, historySnapshot] = await Promise.all([get(alertsRef), get(historyRef)]);

        const allAlerts = alertsSnapshot.exists() ? Object.values(alertsSnapshot.val()) : [];
        const deviceAlerts = allAlerts.filter((alert: any) => 
            alert.device_id === deviceId &&
            new Date(alert.timestamp).getTime() >= start &&
            new Date(alert.timestamp).getTime() <= end
        );

        const allHistory = historySnapshot.exists() ? Object.values(historySnapshot.val()) : [];
        const deviceHistory = allHistory.filter((entry: any) => {
            const entryTime = new Date(entry.timestamp).getTime();
            return entryTime >= start && entryTime <= end;
        });

        const yawnEvents = deviceAlerts.filter(a => a.alert_type === 'yawn_detected').length;
        const fatigueEvents = deviceAlerts.filter(a => a.alert_type === 'drowsiness_detected').length;
        const criticalEvents = deviceAlerts.filter(a => a.alert_type === 'critical_drowsiness').length;

        const earValues = deviceHistory.map((h: any) => h.ear).filter(ear => ear > 0);
        const averageEAR = earValues.length > 0 ? earValues.reduce((a, b) => a + b, 0) / earValues.length : 0;

        let safetyScore = 100;
        safetyScore -= Math.min(yawnEvents * 2, 30);
        safetyScore -= Math.min(fatigueEvents * 5, 40);
        safetyScore -= Math.min(criticalEvents * 10, 50);
        if (averageEAR > 0 && averageEAR < 0.25) safetyScore -= 20;
        else if (averageEAR > 0 && averageEAR < 0.3) safetyScore -= 10;

        return {
            deviceId,
            events: deviceAlerts.map((a: any) => ({ ...a, id: a.timestamp })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
            safetyScore: Math.max(0, Math.round(safetyScore)),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            stats: { yawnEvents, fatigueEvents, criticalEvents, averageEAR }
        };
    } catch (error) {
        console.error("Error in getFilteredSafetyData:", error);
        return null;
    }
};

export const signIn = async (email: string, password: string) => {
  if (!auth) throw new Error("Auth not initialized");
  return await signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => ({ success: true, user: userCredential.user }))
    .catch(error => ({ success: false, error: error.message }));
};

export const registerUser = async (userData: any) => {
  if (!auth || !database) throw new Error("Firebase not initialized");
  const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
  const userProfile = { uid: userCredential.user.uid, ...userData };
  delete userProfile.password;
  await set(ref(database, `users/${userCredential.user.uid}`), userProfile);
  return { success: true, user: userCredential.user };
};

export const signOut = async () => {
  if (!auth) throw new Error("Auth not initialized");
  return await firebaseSignOut(auth);
};

export const getUsedDeviceIds = async (): Promise<string[]> => {
    if (!database) return [];
    try {
        const usersRef = ref(database, "users");
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const users = snapshot.val();
            return Object.values(users).map((user: any) => user.deviceId).filter(Boolean);
        }
        return [];
    } catch (error) {
        console.error("Permission denied to get used device IDs for unauthenticated user. This is expected.", error);
        return [];
    }
};


// --- REVISED FUNCTIONS ---

/**
 * Gets the total device count from the public stats node.
 * This is fast, secure, and available to everyone.
 */
export const getDeviceCount = async (): Promise<number> => {
  if (!database) return 0;
  try {
    const countRef = ref(database, "publicStats/totalDeviceCount");
    const snapshot = await get(countRef);
    // If the public stat doesn't exist yet, return a sensible default.
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error("Error getting public device count:", error);
    return 0; // Return 0 on error
  }
}

/**
 * Gets the active device count from the public stats node.
 */
export const getActiveDeviceCount = async (): Promise<number> => {
  if (!database) return 0;
  try {
    const countRef = ref(database, "publicStats/activeDeviceCount");
    const snapshot = await get(countRef);
    return snapshot.exists() ? snapshot.val() : 0;
  } catch (error) {
    console.error("Error getting public active device count:", error);
    return 0; // Return 0 on error
  }
}
