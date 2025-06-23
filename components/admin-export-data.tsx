// components/admin-export-data.tsx

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { downloadCSV } from "../lib/utils"; // เราจะใช้ฟังก์ชันเดิมจาก lib/utils.ts

// Interface สำหรับข้อมูล stats ที่รับมาจาก Dashboard หลัก
interface OverviewStats {
  totalDevices: number;
  activeDevices: number;
  totalUsers: number;
  adminUsers: number;
  totalYawns: number;
  totalDrowsiness: number;
  totalAlerts: number;
}

interface AdminExportDataProps {
  overviewStats: OverviewStats;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const AdminExportData: React.FC<AdminExportDataProps> = ({ overviewStats, dateRange }) => {

  const handleExport = () => {
    if (!overviewStats) {
      alert("ไม่พบข้อมูลภาพรวมของระบบที่จะส่งออก");
      return;
    }

    const headers = [
      { label: "รายการ (Item)", key: "item" },
      { label: "ค่า (Value)", key: "value" },
    ];

    const dataToExport = [
      { item: "อุปกรณ์ทั้งหมด", value: overviewStats.totalDevices },
      { item: "อุปกรณ์ที่ใช้งาน (Active)", value: overviewStats.activeDevices },
      { item: "ผู้ขับขี่ทั้งหมด", value: overviewStats.totalUsers },
      { item: "ผู้ดูแลระบบ", value: overviewStats.adminUsers },
      { item: "การหาวทั้งหมด (ในช่วงเวลาที่เลือก)", value: overviewStats.totalYawns },
      { item: "ความง่วงทั้งหมด (ในช่วงเวลาที่เลือก)", value: overviewStats.totalDrowsiness },
      { item: "แจ้งเตือนด่วนทั้งหมด (ในช่วงเวลาที่เลือก)", value: overviewStats.totalAlerts },
    ];
    
    // สร้างชื่อไฟล์จากช่วงวันที่
    const startDate = new Date(dateRange.startDate).toISOString().split('T')[0];
    const endDate = new Date(dateRange.endDate).toISOString().split('T')[0];
    const fileName = `system-overview-report_${startDate}_to_${endDate}.csv`;

    downloadCSV(dataToExport, headers, fileName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export ข้อมูลภาพรวม</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          กดปุ่มเพื่อ Export ข้อมูลสรุปของ "ภาพรวมระบบ" ตามช่วงวันที่ที่เลือกด้านบนเป็นไฟล์ CSV
        </p>
        <Button onClick={handleExport}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-download mr-2" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
          Export to CSV
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminExportData;
