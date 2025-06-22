"use client"

import { AdminMasterDashboard } from '@/components/admin-master-dashboard'
import { AdminGuard } from '@/components/admin-guard'

// This page now correctly renders the main dashboard component, which handles its own data.
export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <div className="p-4 sm:p-6 lg:p-8">
        <AdminMasterDashboard />
      </div>
    </AdminGuard>
  )
}
