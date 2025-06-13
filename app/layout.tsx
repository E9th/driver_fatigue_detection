import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
// Removed unused components to clean up the code
import Image from "next/image"

export const metadata: Metadata = {
  title: "Driver Fatigue Detection", // Updated title
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
        {/* The redundant Dialog component has been removed from here */}
        {children}
      </body>
    </html>
  )
}
