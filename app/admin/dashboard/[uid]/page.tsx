import { Suspense } from "react"
import { SafetyDashboard } from "@/components/safety-dashboard"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface AdminUserDashboardProps {
  params: {
    uid: string
  }
}

export default function AdminUserDashboard({ params }: AdminUserDashboardProps) {
  const { uid } = params

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">แดชบอร์ดผู้ใช้</h1>
      </div>

      <Suspense fallback={<LoadingScreen message="กำลังโหลดข้อมูล..." />}>
        <SafetyDashboard deviceId={uid} viewMode="admin" />
      </Suspense>
    </div>
  )
}
