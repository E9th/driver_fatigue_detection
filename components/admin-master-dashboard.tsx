// components/admin-master-dashboard.tsx

"use client";

import { useEffect, useState } from 'react';
import { UserProfile, DeviceInfo, Alert } from '@/lib/types';
import { getAllUsersWithDeviceData } from '@/lib/admin-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, User, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
// ================= [ เพิ่ม ] =================
// 1. Import คอมโพเนนต์ Export ที่สร้างขึ้นใหม่
import AdminExportData from './admin-export-data';
// ==========================================

// Interface สำหรับข้อมูลที่รวมกันแล้ว
interface UserWithDevice extends UserProfile {
  device?: DeviceInfo;
}

export const AdminMasterDashboard = () => { 
  const [usersWithDevices, setUsersWithDevices] = useState<UserWithDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllUsersWithDeviceData();
        setUsersWithDevices(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch admin dashboard data:", err);
        setError("Could not load user and device data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= [ เพิ่ม ] =================
  // 2. เตรียมและจัดรูปแบบข้อมูลเพื่อการ Export
  const exportableData = usersWithDevices.map(user => ({
      userId: user.uid,
      fullName: user.fullName,
      email: user.email,
      deviceId: user.deviceId || 'N/A',
      isConnected: user.device?.is_connected ?? false,
      lastSeen: user.device?.last_seen ? new Date(user.device.last_seen).toLocaleString('th-TH') : 'N/A',
      latestAlertType: user.device?.latest_alert?.alert_type || 'None',
      latestAlertTimestamp: user.device?.latest_alert?.timestamp ? new Date(user.device.latest_alert.timestamp).toLocaleString('th-TH') : 'N/A',
  }));

  // สร้างชื่อไฟล์แบบไดนามิก
  const exportFilename = `admin_dashboard_export_${new Date().toISOString().split('T')[0]}`;
  // ==========================================

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Admin Master Dashboard</h1>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Master Dashboard</h1>
        
        {/* ================= [ เพิ่ม ] ================= */}
        {/* 3. เพิ่มคอมโพเนนต์ปุ่ม Export ลงใน JSX */}
        <AdminExportData data={exportableData} filename={exportFilename} />
        {/* ========================================== */}

      </div>

      <motion.div layout>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Connection Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Latest Alert</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {usersWithDevices.map((user) => (
                <motion.tr
                  key={user.uid}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.deviceId || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.device?.is_connected ? (
                      <Badge variant="default" className="bg-green-500 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3"/> Connected
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3"/> Disconnected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.device?.last_seen ? new Date(user.device.last_seen).toLocaleString('th-TH') : 'Never'}
                  </TableCell>
                  <TableCell>
                    {user.device?.latest_alert?.alert_type ? (
                      <Badge variant={user.device.latest_alert.severity === 'high' ? 'destructive' : 'default'}>
                        <AlertTriangle className="mr-1 h-3 w-3" /> {user.device.latest_alert.alert_type}
                      </Badge>
                    ) : 'None'}
                  </TableCell>
                  <TableCell>
                     <Link href={`/admin/dashboard/${user.uid}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                     </Link>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};
