import type { HistoricalData, AlertData, DailyStats } from "./types";

// ฟังก์ชันสำหรับคำนวณสถิติขั้นสูง
export const calculateAdvancedStats = (events: (HistoricalData | AlertData)[]) => {
  // สร้างตัวแปรสำหรับเก็บค่าสถิติต่างๆ
  const stats: DailyStats = {
    totalYawns: 0,
    totalDrowsiness: 0,
    totalAlerts: 0,
    totalSessions: 0,
    averageEAR: 0,
    averageMouthDistance: 0,
    statusDistribution: {},
  };

  // กรองข้อมูลเฉพาะส่วนที่มีค่า EAR เพื่อนำไปคำนวณค่าเฉลี่ย
  const earData = events.filter(
    (e): e is HistoricalData => "ear" in e && typeof e.ear === "number"
  );

  // คำนวณค่า EAR เฉลี่ย
  if (earData.length > 0) {
    const totalEar = earData.reduce((sum, item) => sum + item.ear, 0);
    stats.averageEAR = Number((totalEar / earData.length).toFixed(3));
  }

  // วนลูปเพื่อนับจำนวน event แต่ละประเภท
  events.forEach((event) => {
    if ("alert_type" in event) {
      switch (event.alert_type) {
        case "yawn_detected":
          stats.totalYawns++;
          break;
        case "drowsiness_detected":
          stats.totalDrowsiness++;
          break;
        case "critical_drowsiness":
          stats.totalAlerts++;
          break;
      }
    }
  });

  // คำนวณคะแนนความปลอดภัย
  let score = 100;
  score -= Math.min(stats.totalYawns * 2, 30);
  score -= Math.min(stats.totalDrowsiness * 5, 40);
  score -= Math.min(stats.totalAlerts * 10, 50);
  if (stats.averageEAR > 0 && stats.averageEAR < 0.25) score -= 20;
  else if (stats.averageEAR > 0 && stats.averageEAR < 0.3) score -= 10;
  const safetyScore = Math.max(0, Math.round(score));

  // --- จุดแก้ไข ---
  // ส่งคืนข้อมูล events ทั้งหมดที่รับเข้ามา ไม่ใช่แค่ส่วนใดส่วนหนึ่ง
  return {
    stats,
    safetyScore,
    allEvents: events, // <<<<<<< แก้ไขตรงนี้ให้ส่ง events ทั้งหมดกลับไป
  };
};
