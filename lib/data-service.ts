"use client"

import type { HistoricalData, DailyStats, Report, SafetyEvent, SafetyData } from "./types";
import { get, ref } from "firebase/database";
import { database as db } from "@/lib/firebase"; 
import { analyzeSafetyData } from "@/lib/analyzer"; // FIX: Import from the new, isolated file.

export const dataService = {
  async getFilteredSafetyData(deviceId: string, startDateISO: string, endDateISO: string): Promise<SafetyData> {
    if (!deviceId || deviceId === 'null' || deviceId === 'undefined') {
        throw new Error("Invalid Device ID provided.");
    }
    
    const historyRef = ref(db, `history/${deviceId}`);
    const alertsRef = ref(db, `alerts/${deviceId}`);

    const [historySnapshot, alertsSnapshot] = await Promise.all([
      get(historyRef),
      get(alertsRef)
    ]);

    const allHistoryData = historySnapshot.exists() ? historySnapshot.val() : {};
    const allAlertsData = alertsSnapshot.exists() ? alertsSnapshot.val() : {};
    
    const filterByDate = (item: any) => {
        if (!item || !item.timestamp) return false;
        const itemDate = new Date(item.timestamp);
        return itemDate >= new Date(startDateISO) && itemDate <= new Date(endDateISO);
    };
    
    const filteredHistory = Object.values(allHistoryData).filter(filterByDate);
    const filteredAlerts = Object.values(allAlertsData).filter(filterByDate);

    const events: SafetyEvent[] = [...(filteredAlerts as SafetyEvent[]), ...(filteredHistory as HistoricalData[])]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((event, index) => ({
        id: (event as any).id || `${event.timestamp}-${index}`,
        timestamp: event.timestamp,
        details: (event as any).status || (event as any).details || 'ไม่ระบุ',
        severity: event.severity || 1,
        ear: (event as any).ear
      }));
    
    // This call will now work correctly.
    return analyzeSafetyData(events, deviceId, startDateISO, endDateISO);
  },

  generateReport(stats: DailyStats): Report {
    const recommendations: string[] = [];
    const score = dataService.calculateSafetyScore(stats);

    if (score < 60) recommendations.push("คะแนนความปลอดภัยของคุณค่อนข้างต่ำ ควรเพิ่มความระมัดระวัง");
    if (stats.criticalEvents > 5) recommendations.push("ตรวจพบเหตุการณ์วิกฤตหลายครั้ง โปรดตรวจสอบสภาพร่างกายและยานพาหนะ");
    if (stats.fatigueEvents > 10) recommendations.push("มีความเสี่ยงเรื่องความง่วงสูง ควรหยุดพักทุกๆ 1-2 ชั่วโมง");
    if (stats.yawnEvents > 20) recommendations.push("สังเกตพบการหาวบ่อยครั้ง ควรนอนหลับให้เพียงพอ");
    if (recommendations.length === 0) recommendations.push("ยอดเยี่ยม! การขับขี่ของคุณปลอดภัยดี");

    return { recommendations };
  },

  calculateSafetyScore(stats: DailyStats): number {
    let score = 100;
    score -= (stats.criticalEvents * 5);
    score -= (stats.fatigueEvents * 2);
    score -= (stats.yawnEvents * 0.5);
    if (stats.averageEAR > 0.3) score += 5;
    return Math.round(Math.max(0, Math.min(score, 100)));
  },
};
