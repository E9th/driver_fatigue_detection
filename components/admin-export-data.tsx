// components/admin-export-data.tsx

"use client";

import { FC } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown } from 'lucide-react';

// Interface สำหรับข้อมูลที่ถูกจัดรูปแบบแล้ว
interface ExportableAdminData {
  userId: string;
  fullName: string;
  email: string;
  deviceId: string;
  isConnected: boolean;
  lastSeen: string;
  latestAlertType?: string;
  latestAlertTimestamp?: string;
}

interface AdminExportDataProps {
  data: ExportableAdminData[]; // รับข้อมูลที่จัดรูปแบบแล้ว
  filename: string;
}

const AdminExportData: FC<AdminExportDataProps> = ({ data, filename }) => {

  const convertToCSV = (dataToConvert: ExportableAdminData[]) => {
    if (dataToConvert.length === 0) {
      return "";
    }
    const headers = Object.keys(dataToConvert[0]).join(',');
    const rows = dataToConvert.map(row => 
      Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"` // Handle quotes in data
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const handleExportCsv = () => {
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-4">
          <FileDown className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportCsv} disabled={data.length === 0}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJson} disabled={data.length === 0}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminExportData;
