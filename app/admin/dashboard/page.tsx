"use client"

import { AdminMasterDashboard } from '@/components/admin-master-dashboard'
import { AdminGuard } from '@/components/admin-guard'

/**
 * This page serves as the entry point for the admin dashboard.
 * It uses an AdminGuard to protect the route and then renders the main dashboard component.
 */
export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <div className="p-4 sm:p-6 lg:p-8">
        <AdminMasterDashboard />
      </div>
    </AdminGuard>
  )
}
