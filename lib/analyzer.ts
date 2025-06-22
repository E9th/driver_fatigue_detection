// lib/analyzer.ts

import type { SafetyEvent, DailyStats, SafetyData } from "./types";

/**
 * Analyzes a set of safety events to produce statistics and a comprehensive safety data object.
 * This function is now isolated to prevent circular dependencies.
 */
export function analyzeSafetyData(
  events: SafetyEvent[],
  deviceId: string,
  startDateISO: string,
  endDateISO: string
): SafetyData {
  
  const stats: DailyStats = {
    totalEvents: events.length,
    yawnEvents: events.filter(e => e.details === 'yawn_detected').length,
    fatigueEvents: events.filter(e => e.details === 'drowsiness_detected').length,
    criticalEvents: events.filter(e => e.details === 'critical_drowsiness').length,
    averageEAR: 0, // Will be calculated below
  };

  const earValues = events
    .map(e => e.ear)
    .filter((ear): ear is number => typeof ear === 'number' && ear > 0);

  if (earValues.length > 0) {
    stats.averageEAR = earValues.reduce((sum, val) => sum + val, 0) / earValues.length;
  }

  return {
    deviceId,
    events,
    stats,
    safetyScore: calculateSafetyScore(stats), // Using a local helper
    startDate: startDateISO,
    endDate: endDateISO,
  };
}

/**
 * A local helper function to calculate safety score.
 */
function calculateSafetyScore(stats: DailyStats): number {
    let score = 100;
    score -= (stats.criticalEvents * 5);
    score -= (stats.fatigueEvents * 2);
    score -= (stats.yawnEvents * 0.5);

    if (stats.averageEAR > 0.3) {
      score += 5;
    }
    return Math.round(Math.max(0, Math.min(score, 100)));
}
