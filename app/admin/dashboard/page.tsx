"use client"

import { AdminMasterDashboard } from '@/components/admin-master-dashboard'
import { AdminGuard } from '@/components/admin-guard'

// This page now ONLY renders the main dashboard component, protected by a guard.
// All data fetching and logic is correctly handled inside AdminMasterDashboard itself.
export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <div className="p-4 sm:p-6 lg:p-8">
        <AdminMasterDashboard />
      </div>
    </AdminGuard>
  )
}
