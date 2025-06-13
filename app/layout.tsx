import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
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
        {children}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo.png"
                  alt="Driver Fatigue Detection Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <DialogTitle>Driver Fatigue Detection</DialogTitle>
              </div>
              <DialogDescription>
                ตั้งค่าการทำงานของแอปพลิเคชัน
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>โหมดมืด</span>
                <Button variant="outline" size="sm">
                  เปิด/ปิด
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>การแจ้งเตือน</span>
                <Button variant="outline" size="sm">
                  เปิด/ปิด
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </body>
    </html>
  )
}
