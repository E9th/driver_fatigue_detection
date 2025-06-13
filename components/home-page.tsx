"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Eye,
  BarChart3,
  Smartphone,
  Camera,
  Play,
  AlertTriangle,
  Users,
  Zap,
  TrendingUp,
  Activity,
  Loader2,
  Rocket,
  Heart,
  Target,
  CheckCircle,
  Bell // Added Bell icon import
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getDeviceCount, getActiveDeviceCount } from "@/lib/firebase"

/**
 * Re-designed Home Page Component
 * Features a functional navigation bar, new sections for Pricing and About Us,
 * and an improved, user-friendly layout with smooth scrolling.
 */
export function HomePage() {
  const [deviceCount, setDeviceCount] = useState<number | null>(null)
  const [activeDeviceCount, setActiveDeviceCount] = useState<number | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    const loadDeviceStats = async () => {
      try {
        setIsLoadingStats(true)
        const [total, active] = await Promise.all([getDeviceCount(), getActiveDeviceCount()])
        setDeviceCount(total)
        setActiveDeviceCount(active)
      } catch (error) {
        console.error("❌ Error loading device stats:", error)
        setDeviceCount(0)
        setActiveDeviceCount(0)
      } finally {
        setIsLoadingStats(false)
      }
    }
    loadDeviceStats()
  }, [])

  const formatDeviceCount = (count: number | null): string => {
    if (count === null) return "..."
    return count.toLocaleString()
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const navLinks = [
    { label: "ฟีเจอร์", id: "features" },
    { label: "วิธีใช้งาน", id: "how-it-works" },
    { label: "ราคา", id: "pricing" },
    { label: "เกี่ยวกับเรา", id: "about" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">Driver Safety</h1>
            </div>
            <nav className="hidden md:flex space-x-2">
                {navLinks.map((link) => (
                    <Button key={link.id} variant="ghost" onClick={() => scrollToSection(link.id)}>
                        {link.label}
                    </Button>
                ))}
            </nav>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/register">สมัครใช้งาน</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-800 py-20 lg:py-28 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 py-1 px-3 mb-4">
              <Zap className="h-4 w-4 mr-1.5" />
              เทคโนโลยี AI เพื่อความปลอดภัย
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                ขับขี่อย่างมั่นใจ ปลอดภัยทุกเส้นทาง
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              ระบบตรวจจับความเหนื่อยล้าอัจฉริยะ พร้อมแจ้งเตือนทันทีเมื่อพบความเสี่ยง ช่วยลดอุบัติเหตุจากการหลับใน
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6" asChild>
                  <Link href="/register"><Play className="h-5 w-5 mr-2" /> เริ่มต้นใช้งาน</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => scrollToSection('features')}>
                ดูฟีเจอร์
              </Button>
            </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">ฟีเจอร์หลักของเรา</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">เครื่องมือที่ช่วยให้ทุกการเดินทางปลอดภัยยิ่งขึ้น</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center"><CardHeader><TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-4"/><CardTitle>ตรวจจับเรียลไทม์</CardTitle></CardHeader><CardContent><p>วิเคราะห์ดวงตาและการหาวต่อเนื่อง แจ้งเตือนทันที</p></CardContent></Card>
            <Card className="text-center"><CardHeader><AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-4"/><CardTitle>ระบบแจ้งเตือนอัจฉริยะ</CardTitle></CardHeader><CardContent><p>เสียงและข้อความเตือนบน Dashboard เมื่อพบความเสี่ยง</p></CardContent></Card>
            <Card className="text-center"><CardHeader><BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-4"/><CardTitle>รายงานและสถิติ</CardTitle></CardHeader><CardContent><p>ดูข้อมูลย้อนหลัง วิเคราะห์พฤติกรรม และส่งออกรายงานได้</p></CardContent></Card>
            <Card className="text-center"><CardHeader><Smartphone className="h-8 w-8 text-purple-500 mx-auto mb-4"/><CardTitle>รองรับทุกอุปกรณ์</CardTitle></CardHeader><CardContent><p>เข้าถึง Dashboard ได้ทุกที่ผ่านคอมพิวเตอร์และมือถือ</p></CardContent></Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">เริ่มต้นใช้งานใน 3 ขั้นตอน</h2>
          </div>
          <div className="relative">
             <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-700"></div>
             <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center"><div className="mx-auto w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-blue-500 mb-4"><Camera className="h-8 w-8 text-blue-500"/></div><h3 className="text-xl font-semibold mb-2">1. ติดตั้งอุปกรณ์</h3><p className="text-gray-600 dark:text-gray-400">เชื่อมต่อกล้องเข้ากับระบบและวางในตำแหน่งที่เหมาะสม</p></div>
                <div className="text-center"><div className="mx-auto w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-blue-500 mb-4"><Play className="h-8 w-8 text-blue-500"/></div><h3 className="text-xl font-semibold mb-2">2. เริ่มการตรวจจับ</h3><p className="text-gray-600 dark:text-gray-400">เปิด Dashboard และกดปุ่มเริ่มทำงาน ระบบจะวิเคราะห์ภาพทันที</p></div>
                <div className="text-center"><div className="mx-auto w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border-2 border-blue-500 mb-4"><Bell className="h-8 w-8 text-blue-500"/></div><h3 className="text-xl font-semibold mb-2">3. รับการแจ้งเตือน</h3><p className="text-gray-600 dark:text-gray-400">ระบบจะส่งเสียงและข้อความเตือนเมื่อตรวจพบความเหนื่อยล้า</p></div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">แผนบริการที่เหมาะกับคุณ</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">เลือกแผนที่ตอบโจทย์การใช้งานของคุณมากที่สุด</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-500 shadow-xl">
              <CardHeader className="text-center"><CardTitle className="text-2xl">สำหรับผู้ขับขี่ทั่วไป</CardTitle><p className="text-4xl font-bold my-4">฿350<span className="text-lg font-normal text-muted-foreground">/เดือน</span></p></CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>ตรวจจับความเหนื่อยล้าเรียลไทม์</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>รายงานสถิติรายวัน/สัปดาห์</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>ส่งออกข้อมูลเป็น CSV/PDF</li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" asChild><Link href="/register">เลือกแผนนี้</Link></Button>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="text-center"><CardTitle className="text-2xl">สำหรับองค์กร/Fleet</CardTitle><p className="text-4xl font-bold my-4">ติดต่อเรา</p></CardHeader>
              <CardContent className="space-y-4">
                 <ul className="space-y-3">
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>ทุกอย่างในแผนทั่วไป</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Admin Dashboard จัดการผู้ขับขี่</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>รายงานสรุประดับองค์กร</li>
                    <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>การช่วยเหลือพิเศษ</li>
                </ul>
                <Button className="w-full" variant="outline" size="lg">ติดต่อฝ่ายขาย</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-white"/>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">ภารกิจของเรา</h2>
            <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                "เรามุ่งมั่นที่จะลดอุบัติเหตุบนท้องถนนที่เกิดจากความเหนื่อยล้าของผู้ขับขี่
                ด้วยการพัฒนาเทคโนโลยี AI ที่เข้าถึงง่ายและใช้งานได้จริง เพื่อสร้างมาตรฐานความปลอดภัยใหม่ให้กับการเดินทางทุกรูปแบบ"
            </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="font-semibold text-white mb-4">เมนู</h3>
                    <ul className="space-y-2">
                        {navLinks.map(link => (
                            <li key={link.id}><Button variant="link" className="p-0 text-gray-300" onClick={() => scrollToSection(link.id)}>{link.label}</Button></li>
                        ))}
                    </ul>
                </div>
                 <div>
                    <h3 className="font-semibold text-white mb-4">ช่วยเหลือ</h3>
                    <ul className="space-y-2">
                        <li><Link href="#" className="hover:text-white">คำถามที่พบบ่อย</Link></li>
                        <li><Link href="#" className="hover:text-white">ติดต่อเรา</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-4">กฎหมาย</h3>
                    <ul className="space-y-2">
                        <li><Link href="/terms" className="hover:text-white">ข้อกำหนดบริการ</Link></li>
                        <li><Link href="/privacy" className="hover:text-white">นโยบายความเป็นส่วนตัว</Link></li>
                    </ul>
                </div>
                 <div className="text-center md:text-left">
                    <h3 className="font-semibold text-white mb-4">พร้อมใช้งานหรือยัง?</h3>
                    <Button className="bg-blue-600 hover:bg-blue-700" asChild><Link href="/register">สมัครใช้งานฟรี</Link></Button>
                </div>
            </div>
            <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} Driver Safety System. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  )
}
