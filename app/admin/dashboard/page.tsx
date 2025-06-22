"use client"

import { useState, useEffect } from 'react';
import { AdminMasterDashboard } from '@/components/admin-master-dashboard';
import { AdminGuard } from '@/components/admin-guard';
import { LoadingScreen } from '@/components/loading-screen';
import { getAllUsers } from '@/lib/admin-utils';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

// Define types locally for clarity
interface AlertData {
  alert_type: string;
  device_id: string;
  severity: string;
  timestamp: string;
}

interface DeviceData {
  current_data?: {
    timestamp: string;
  };
}

/**
 * This page serves as a data-fetching container for the admin dashboard.
 * It fetches all necessary data (users, alerts, devices) and then passes it
 * down to the main dashboard component. This pattern prevents re-fetching
 * and simplifies state management in child components.
 */
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<{
    users: UserProfile[];
    alerts: AlertData[];
    devices: { [key: string]: DeviceData };
  } | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const usersList = await getAllUsers();
        
        const alertsSnapshot = await get(ref(database, 'alerts'));
        const alertsVal = alertsSnapshot.exists() ? alertsSnapshot.val() : {};
        const alertsList: AlertData[] = alertsVal 
          ? Object.values(alertsVal).flatMap(deviceAlerts => 
              (deviceAlerts && typeof deviceAlerts === 'object') ? Object.values(deviceAlerts as object) : []
            ) 
          : [];

        const devicesSnapshot = await get(ref(database, 'devices'));
        const devicesData = devicesSnapshot.exists() ? devicesSnapshot.val() : {};

        setInitialData({
          users: usersList,
          alerts: alertsList,
          devices: devicesData,
        });
      } catch (error) {
        console.error("Failed to load initial admin data on page level:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading || !initialData) {
    return <LoadingScreen message="กำลังเตรียมข้อมูลแดชบอร์ด..." />;
  }

  return (
    <AdminGuard>
      <div className="p-4 sm:p-6 lg:p-8">
        <AdminMasterDashboard
          initialUsers={initialData.users}
          initialAlerts={initialData.alerts}
          initialDevices={initialData.devices}
        />
      </div>
    </AdminGuard>
  );
}
