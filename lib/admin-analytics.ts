import { get, query, ref, orderByChild, startAt, endAt } from "firebase/database";
import { database } from "./firebase";
import { calculateAdvancedStats } from './data-analyzer';
import type { SafetyData, HistoricalData, AlertData, UserProfile } from "./types";

/**
 * Fetches and analyzes safety data for a specific user within a date range.
 * This function is intended for admin use.
 */
export const getSafetyDataForUser = async (
  uid: string,
  startDate: string,
  endDate: string
): Promise<SafetyData | null> => {
  try {
    // 1. Get user profile to find their assigned device ID
    const userRef = ref(database, `users/${uid}`);
    const userSnap = await get(userRef);
    if (!userSnap.exists()) {
      console.error(`Admin Analytics: User with UID ${uid} not found.`);
      return null;
    }
    const userProfile = userSnap.val() as UserProfile;
    const deviceId = userProfile.deviceId;

    if (!deviceId) {
      console.error(`Admin Analytics: No device assigned to user ${uid}.`);
      return null;
    }

    // 2. Create queries for both history and alerts data
    const historyQuery = query(
      ref(database, `devices/${deviceId}/history`),
      orderByChild("timestamp"),
      startAt(startDate),
      endAt(endDate)
    );
    const alertsQuery = query(
      ref(database, "alerts"),
      orderByChild("device_id"),
      startAt(deviceId),
      endAt(deviceId)
    );
    
    // 3. Fetch both data snapshots concurrently
    const [historySnapshot, alertsSnapshot] = await Promise.all([
      get(historyQuery),
      get(alertsQuery),
    ]);

    // --- จุดแก้ไขสำคัญ ---
    // 4. สร้าง Array ก้อนเดียวที่ชื่อ events และรวมข้อมูลทั้งสองแหล่งเข้าไป
    const events: (HistoricalData | AlertData)[] = [];

    // เพิ่มข้อมูล alerts ที่ผ่านการกรองวันที่แล้วเข้าไปใน events
    if (alertsSnapshot.exists()) {
      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();
      Object.values(alertsSnapshot.val()).forEach((alert: any) => {
        const alertMs = new Date(alert.timestamp).getTime();
        if (alertMs >= startMs && alertMs <= endMs) {
          events.push(alert as AlertData);
        }
      });
    }
    console.log(`✅ Found ${events.length} alerts in date range.`);

    // เพิ่มข้อมูล history ทั้งหมดเข้าไปใน events
    if (historySnapshot.exists()) {
       const historyRecords = Object.entries(historySnapshot.val()).map(([id, value]) => ({
         id,
         ...(value as object),
       })) as HistoricalData[];
      events.push(...historyRecords);
       console.log(`✅ Found ${historyRecords.length} history records in date range.`);
    }

    // 5. ส่ง events ที่รวมข้อมูลทั้งหมดแล้ว (alerts + history) ไปให้ data-analyzer
    const analysisResult = calculateAdvancedStats(events);

    // 6. สร้างผลลัพธ์สุดท้าย
    const finalSafetyData: SafetyData = {
      deviceId,
      user: userProfile,
      startDate,
      endDate,
      events: analysisResult.allEvents, // ใช้ข้อมูลจาก analyzer ที่ตอนนี้ถูกต้องแล้ว
      stats: analysisResult.stats,
      safetyScore: analysisResult.safetyScore,
    };

    console.log('📊 Final safety data:', finalSafetyData);
    return finalSafetyData;

  } catch (error) {
    console.error("❌ Error in getSafetyDataForUser:", error);
    return null;
  }
};
