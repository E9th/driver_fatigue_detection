// components/admin-export-data.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { DatePickerWithRange } from "./date-range-picker"; // สมมติว่ามี component นี้อยู่
import { DateRange } from "react-day-picker";
import { downloadCSV } from "../lib/utils"; // สมมติว่ามีฟังก์ชันนี้ใน utils

// Interface สำหรับข้อมูลภาพรวม
interface SystemOverviewStats {
  total_drivers: number;
  active_devices: number;
  total_alerts: number;
  critical_alerts: number;
  total_yawn_events: number;
  total_drowsiness_events: number;
}

interface AdminExportDataProps {
  overviewStats: SystemOverviewStats;
}

const AdminExportData: React.FC<AdminExportDataProps> = ({ overviewStats }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleExport = () => {
    if (!overviewStats) {
      alert("ไม่พบข้อมูลภาพรวมของระบบที่จะส่งออก");
      return;
    }

    const headers = [
      { label: "รายการ", key: "item" },
      { label: "จำนวน", key: "value" },
    ];

    const dataToExport = [
      { item: "จำนวนผู้ขับขี่ทั้งหมด", value: overviewStats.total_drivers },
      { item: "อุปกรณ์ที่ใช้งาน", value: overviewStats.active_devices },
      { item: "การแจ้งเตือนทั้งหมด", value: overviewStats.total_alerts },
      { item: "การแจ้งเตือนระดับวิกฤต", value: overviewStats.critical_alerts },
      { item: "จำนวนการหาวทั้งหมด", value: overviewStats.total_yawn_events },
      { item: "จำนวนการสัปหงกทั้งหมด", value: overviewStats.total_drowsiness_events },
    ];
    
    // ตั้งชื่อไฟล์ตามช่วงวันที่ ถ้ามี
    const startDate = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : 'all-time';
    const endDate = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : '';
    const fileName = `system-overview-report_${startDate}${endDate ? '_to_' + endDate : ''}.csv`;

    downloadCSV(dataToExport, headers, fileName);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Export ข้อมูลภาพรวมระบบ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            เลือกช่วงวันที่ที่ต้องการ (ไม่บังคับ)
          </p>
          {/* หากคุณยังไม่มี DatePickerWithRange ให้ใช้ Input ธรรมดาไปก่อน */}
          {/* <DatePickerWithRange date={dateRange} onDateChange={setDateRange} /> */}
          <p className="text-sm text-muted-foreground mt-2">
            การ Export นี้จะดึงข้อมูลสรุปจาก "ภาพรวมของระบบ" ที่แสดงอยู่ด้านบน
          </p>
        </div>
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
