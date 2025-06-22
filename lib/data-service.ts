"use client"

import type { HistoricalData, DailyStats, Report, SafetyEvent, SafetyData } from "./types";
import { get, ref } from "firebase/database";
import { database as db } from "@/lib/firebase"; 
import { analyzeSafetyData } from "@/lib/data-analyzer";

/**
 * Service for handling data operations.
 * Centralizes data fetching, processing, and report generation.
 */
export const dataService = {
  /**
   * Fetches and processes safety data for a given device within a date range.
   */
  async getFilteredSafetyData(deviceId: string, startDateISO: string, endDateISO: string): Promise<SafetyData> {
    if (!deviceId || deviceId === 'null' || deviceId === 'undefined') {
        throw new Error("Invalid Device ID provided.");
    }
    
    // Construct refs to the correct paths
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
    
    const filteredHistory = Object.entries(allHistoryData)
        .map(([id, data]) => ({ id, ...(data as Omit<HistoricalData, 'id'>) }))
        .filter(filterByDate);

    const filteredAlerts = Object.entries(allAlertsData)
      .map(([id, data]) => ({ id, ...(data as Omit<SafetyEvent, 'id'>) }))
      .filter(filterByDate);

    const events: SafetyEvent[] = [...filteredAlerts, ...filteredHistory]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        details: (event as any).status || (event as any).details || 'ไม่ระบุ',
        severity: event.severity || 1,
        ear: (event as any).ear
      }));
    
    // This function call is now valid because analyzeSafetyData is correctly imported.
    return analyzeSafetyData(events, deviceId, startDateISO, endDateISO);
  },

  /**
   * Generates a report with recommendations based on safety data.
   */
  generateReport(data: HistoricalData[], stats: DailyStats): Report {
    const recommendations: string[] = [];
    const score = this.calculateSafetyScore(stats);

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
    
    if (recommendations.length === 0) {
      recommendations.push("ยอดเยี่ยม! คุณขับขี่ได้อย่างปลอดภัยในช่วงเวลานี้ โปรดรักษามาตรฐานนี้ต่อไป");
    }

    return { recommendations };
  },

  /**
   * Calculates a safety score based on daily stats.
   */
  calculateSafetyScore(stats: DailyStats): number {
    let score = 100;
    score -= (stats.criticalEvents * 5);
    score -= (stats.fatigueEvents * 2);
    score -= (stats.yawnEvents * 0.5);
    if (stats.averageEAR > 0.3) {
      score += 5;
    }
    return Math.max(0, Math.min(score, 100));
  },
  
  // --- THE FIX: Re-exporting analyzeSafetyData so other modules can use it via dataService ---
  analyzeSafetyData,
  // -----------------------------------------------------------------------------------------
};
