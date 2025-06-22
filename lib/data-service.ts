// lib/data-service.ts

import { HistoricalData, DailyStats, Report, SafetyEvent } from "./types";
import { get, ref } from "firebase/database";
import { db } from "./firebase";
import { analyzeSafetyData } from "./data-analyzer";

/**
 * Service for handling data operations.
 * Centralizes data fetching, processing, and report generation.
 */
export const dataService = {
  /**
   * Fetches and processes safety data for a given device within a date range.
   * @param deviceId The ID of the device to fetch data for.
   * @param startDateISO The start date of the range in ISO format.
   * @param endDateISO The end date of the range in ISO format.
   * @returns A promise that resolves to the processed safety data.
   */
  async getFilteredSafetyData(deviceId: string, startDateISO: string, endDateISO: string) {
    if (!deviceId || deviceId === 'null' || deviceId === 'undefined') {
        console.warn("getFilteredSafetyData called with invalid deviceId.");
        throw new Error("Invalid Device ID provided.");
    }
    
    console.log(`🔍 Querying history for device: ${deviceId} between ${startDateISO} and ${endDateISO}`);
    
    const historyRef = ref(db, `history/${deviceId}`);
    const historySnapshot = await get(historyRef);
    const allHistoryData = historySnapshot.exists() ? historySnapshot.val() : {};

    const filteredHistory = Object.entries(allHistoryData)
        .map(([id, data]) => ({ id, ...(data as Omit<HistoricalData, 'id'>) }))
        .filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= new Date(startDateISO) && itemDate <= new Date(endDateISO);
        });

    console.log(`✅ Found ${filteredHistory.length} history records in date range.`);
    
    const alertsRef = ref(db, `alerts/${deviceId}`);
    const alertsSnapshot = await get(alertsRef);
    const allAlertsData = alertsSnapshot.exists() ? alertsSnapshot.val() : {};

    const filteredAlerts = Object.entries(allAlertsData)
      .map(([id, data]) => ({ id, ...(data as Omit<SafetyEvent, 'id'>) }))
      .filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= new Date(startDateISO) && itemDate <= new Date(endDateISO);
      });

    console.log(`✅ Found ${filteredAlerts.length} alerts in date range.`);

    const events: SafetyEvent[] = [...filteredAlerts, ...filteredHistory]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        details: event.status || (event as any).details || 'ไม่ระบุ',
        severity: event.severity || 1,
        ear: (event as any).ear
      }));
    
    return analyzeSafetyData(events, deviceId, startDateISO, endDateISO);
  },

  /**
   * Generates a report with recommendations based on safety data.
   * @param data The historical data events.
   * @param stats The calculated daily statistics.
   * @returns A report object with actionable recommendations.
   */
  generateReport(data: HistoricalData[], stats: DailyStats): Report {
    const recommendations: string[] = [];
    const score = this.calculateSafetyScore(stats);

    // --- NEW: Dynamic Recommendations Logic ---
    if (score < 60) {
      recommendations.push("คะแนนความปลอดภัยของคุณค่อนข้างต่ำ ควรเพิ่มความระมัดระวังในการขับขี่");
    }

    if (stats.criticalEvents > 5) {
      recommendations.push("ตรวจพบเหตุการณ์วิกฤตหลายครั้ง โปรดตรวจสอบสภาพร่างกายและยานพาหนะก่อนเดินทาง");
    } else if (stats.fatigueEvents > 10) {
      recommendations.push("มีความเสี่ยงเรื่องความง่วงขณะขับขี่สูง ควรหยุดพักทุกๆ 1-2 ชั่วโมง");
    }

    if (stats.yawnEvents > 20) {
      recommendations.push("สังเกตพบการหาวบ่อยครั้ง ซึ่งเป็นสัญญาณของความเหนื่อยล้า ควรนอนหลับให้เพียงพอก่อนขับรถ");
    }
    
    if (stats.averageEAR < 0.22 && stats.averageEAR > 0) {
        recommendations.push(`ค่าเฉลี่ยการลืมตา (EAR) ค่อนข้างต่ำ (${stats.averageEAR.toFixed(3)}) อาจเป็นสัญญาณของความง่วง`);
    }

    if (recommendations.length === 0) {
      recommendations.push("ยอดเยี่ยม! คุณขับขี่ได้อย่างปลอดภัยในช่วงเวลานี้ โปรดรักษามาตรฐานนี้ต่อไป");
    }

    return { recommendations };
  },

  /**
   * Calculates a safety score based on daily stats.
   * @param stats The daily statistics.
   * @returns A safety score between 0 and 100.
   */
  calculateSafetyScore(stats: DailyStats): number {
    let score = 100;
    
    // Deductions based on events, with weights
    score -= (stats.criticalEvents * 5); // Critical events have a high impact
    score -= (stats.fatigueEvents * 2); // Drowsiness events have a medium impact
    score -= (stats.yawnEvents * 0.5); // Yawns have a low impact

    // Bonus for high average EAR (if data is available)
    if (stats.averageEAR > 0.3) {
      score += 5;
    }

    // Ensure score is within bounds [0, 100]
    return Math.max(0, Math.min(score, 100));
  },
};
