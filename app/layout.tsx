// app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
// --- ส่วนที่ต้องเพิ่มเข้ามา ---
import { AuthProvider } from "@/lib/auth.tsx" //
import { Toaster } from "@/components/ui/toast" //
// -------------------------

export const metadata: Metadata = {
  title: "Driver Fatigue Detection",
  description: "ระบบตรวจจับความเหนื่อยล้าของผู้ขับขี่ด้วย AI",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {/* ห่อหุ้ม children ด้วย AuthProvider */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
