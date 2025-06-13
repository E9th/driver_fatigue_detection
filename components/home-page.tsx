"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Eye,
  Bell,
  BarChart3,
  Smartphone,
  Camera,
  Play,
  AlertTriangle,
  Users,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Star,
  Zap,
  TrendingUp,
  Activity,
  Heart,
  CheckCircle,
  TrendingDown,
  Rocket
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

/**
 * Home Page Component (Original design with functional navigation and removed device count)
 */
export function HomePage() {
  
  // Helper function for smooth scrolling
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Driver Fatigue Detection Logo"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Driver Fatigue Detection</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">ระบบตรวจจับความเหนื่อยล้าของผู้ขับขี่</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <Zap className="h-3 w-3 mr-1" />
                  เทคโนโลยี AI ล่าสุด
                </Badge>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  ยกระดับความปลอดภัย
                  <span className="text-blue-600">บนท้องถนน</span>
                  <br />
                  ด้วยการตรวจจับความเหนื่อยล้าเรียลไทม์
                </h1>
                <p className="text-base sm:text-lg md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  แจ้งเตือนก่อนเกิดอุบัติเหตุ มั่นใจทุกการเดินทางด้วยความแม่นยำสูง
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6" asChild>
                  <Link href="/register"><Play className="h-5 w-5 mr-2" />เริ่มต้นใช้งาน</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-lg px-8 py-6 border-2"
                  onClick={() => scrollToSection('features')}
                >
                  ดูข้อมูลเพิ่มเติม
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">99.5%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ความแม่นยำ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ตรวจสอบต่อเนื่อง</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ความพึงพอใจ</div>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={24}
                      height={24}
                      className="h-6 w-6 brightness-0 invert"
                    />
                    <span className="font-medium">Driver Fatigue Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs">เชื่อมต่อแล้ว</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                      <div className="font-medium text-yellow-800">ตรวจพบอาการง่วง</div>
                      <div className="text-sm text-yellow-700">แนะนำให้หยุดพักหรือเปลี่ยนคนขับ</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border rounded-lg p-4 shadow-sm"><div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-gray-500">สถานะปัจจุบัน</div><Eye className="h-4 w-4 text-blue-500" /></div><div className="text-2xl font-bold text-gray-900">ง่วงนอน</div><div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full" style={{ width: "65%" }}></div></div></div>
                    <div className="bg-white border rounded-lg p-4 shadow-sm"><div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-gray-500">คะแนนความปลอดภัย</div><Activity className="h-4 w-4 text-green-500" /></div><div className="text-2xl font-bold text-gray-900">65/100</div><div className="text-sm text-gray-500 mt-2">ต่ำกว่าระดับปกติ (80+)</div></div>
                  </div>
                  <div className="bg-white border rounded-lg p-4 shadow-sm"><div className="flex items-center justify-between mb-4"><div><div className="font-medium">แนวโน้มความเหนื่อยล้า</div><div className="text-xs text-gray-500 mt-1">สีเขียว: ปกติ, สีเหลือง: ระวัง, สีแดง: อันตราย</div></div><BarChart3 className="h-4 w-4 text-gray-400" /></div><div className="h-24 flex items-end space-x-1">{[40, 35, 50, 45, 60, 75, 65, 80, 60, 55, 70, 85].map((value, i) => (<div key={i} className={`w-full rounded-t ${value > 70 ? "bg-red-400" : value > 50 ? "bg-yellow-400" : "bg-green-400"}`} style={{ height: `${Math.max(value * 0.8, 20)}%` }} title={`ช่วงเวลา ${i + 1}: ${value > 70 ? "อันตราย" : value > 50 ? "ระวัง" : "ปกติ"}`}></div>)) }</div><div className="text-xs text-gray-400 mt-2 text-center">12 ช่วงเวลาล่าสุด (แต่ละช่วง 10 นาที)</div></div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-red-100 dark:bg-red-900 border border-red-300 rounded-lg p-3 shadow-lg animate-pulse"><div className="flex items-center space-x-2"><Bell className="h-4 w-4 text-red-600" /><span className="text-sm font-medium text-red-800 dark:text-red-200">แจ้งเตือนด่วน!</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-12 bg-white dark:bg-gray-900"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-10"><h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">ฟีเจอร์ที่ทำให้คุณขับขี่อย่างปลอดภัย</h2><p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">เทคโนโลยี AI ที่ทันสมัยช่วยตรวจจับและแจ้งเตือนความเหนื่อยล้าแบบเรียลไทม์</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"><Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-blue-500"><CardHeader><div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4"><TrendingUp className="h-8 w-8 text-blue-600" /></div><CardTitle className="text-lg">Real-Time Monitoring</CardTitle></CardHeader><CardContent><CardDescription className="text-base">ติดตามค่า EAR, MAR และสถานะผู้ขับทันที ด้วยความแม่นยำสูง</CardDescription></CardContent></Card><Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-yellow-500"><CardHeader><div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="h-8 w-8 text-yellow-600" /></div><CardTitle className="text-lg">Alerts & Notifications</CardTitle></CardHeader><CardContent><CardDescription className="text-base">เสียงและข้อความเตือนเมื่อพบอาการง่วงหรือหลับตาที่ยาวนาน</CardDescription></CardContent></Card><Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-green-500"><CardHeader><div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4"><BarChart3 className="h-8 w-8 text-green-600" /></div><CardTitle className="text-lg">History & Reports</CardTitle></CardHeader><CardContent><CardDescription className="text-base">เก็บสถิติพฤติกรรม พร้อมดาวน์โหลด CSV/PDF ได้ทันที</CardDescription></CardContent></Card><Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-purple-500"><CardHeader><div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4"><Smartphone className="h-8 w-8 text-purple-600" /></div><CardTitle className="text-lg">Mobile-Ready</CardTitle></CardHeader><CardContent><CardDescription className="text-base">ดูรายงานบนสมาร์ทโฟนหรือแท็บเล็ต ก็ใช้งานได้ลื่นไหล</CardDescription></CardContent></Card></div></div></section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 bg-gray-50 dark:bg-gray-800"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-10"><h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">วิธีการใช้งาน 3 ขั้นตอนง่าย ๆ</h2><p className="text-xl text-gray-600 dark:text-gray-300">เริ่มต้นใช้งานได้ภายในไม่กี่นาที</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="text-center"><div className="relative"><div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6"><Camera className="h-10 w-10 text-white" /></div><div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-blue-600">1</span></div></div><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">ติดตั้งอุปกรณ์</h3><p className="text-gray-600 dark:text-gray-300">เชื่อมต่อกล้อง-เซ็นเซอร์ เข้ากับระบบ ง่ายและรวดเร็ว</p></div><div className="text-center"><div className="relative"><div className="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6"><Play className="h-10 w-10 text-white" /></div><div className="absolute -top-2 -right-2 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-green-600">2</span></div></div><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">เริ่มตรวจจับ</h3><p className="text-gray-600 dark:text-gray-300">กด START บน Dashboard แล้วระบบจะรับข้อมูลเรียลไทม์</p></div><div className="text-center"><div className="relative"><div className="mx-auto w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mb-6"><AlertTriangle className="h-10 w-10 text-white" /></div><div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center"><span className="text-sm font-bold text-yellow-600">3</span></div></div><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">รับการแจ้งเตือน</h3><p className="text-gray-600 dark:text-gray-300">เสียง/ข้อความเตือนทันทีเมื่อพบความเสี่ยง</p></div></div></div></section>
      
      {/* ADDED: Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-white dark:bg-gray-900"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center mb-12"><h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">แผนบริการที่เหมาะกับคุณ</h2><p className="mt-4 text-lg text-gray-600 dark:text-gray-400">เริ่มต้นใช้งานด้วยแผนที่คุ้มค่าและโปร่งใส</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><Card className="border-2 border-blue-500 shadow-xl"><CardHeader className="text-center"><CardTitle className="text-2xl">สำหรับผู้ขับขี่ทั่วไป</CardTitle><p className="text-4xl font-bold my-4">฿350<span className="text-lg font-normal text-muted-foreground">/เดือน</span></p></CardHeader><CardContent className="space-y-4"><ul className="space-y-3"><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>ตรวจจับความเหนื่อยล้าเรียลไทม์</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>รายงานสถิติรายวัน/สัปดาห์</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>ส่งออกข้อมูลเป็น CSV/PDF</li></ul><Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" asChild><Link href="/register">เลือกแผนนี้</Link></Button></CardContent></Card><Card><CardHeader className="text-center"><CardTitle className="text-2xl">สำหรับองค์กร/Fleet</CardTitle><p className="text-4xl font-bold my-4">ติดต่อเรา</p></CardHeader><CardContent className="space-y-4"><ul className="space-y-3"><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>ทุกอย่างในแผนทั่วไป</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>Admin Dashboard จัดการผู้ขับขี่</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>รายงานสรุประดับองค์กร</li><li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2"/>การช่วยเหลือพิเศษ</li></ul><Button className="w-full" variant="outline" size="lg">ติดต่อฝ่ายขาย</Button></CardContent></Card></div></div></section>

      {/* ADDED: About Us Section */}
      <section id="about" className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-800"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6"><Heart className="h-8 w-8 text-white"/></div><h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">เกี่ยวกับเรา</h2><p className="mt-6 text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">"เรามุ่งมั่นที่จะลดอุบัติเหตุบนท้องถนนที่เกิดจากความเหนื่อยล้าของผู้ขับขี่ ด้วยการพัฒนาเทคโนโลยี AI ที่เข้าถึงง่ายและใช้งานได้จริง เพื่อสร้างมาตรฐานความปลอดภัยใหม่ให้กับการเดินทางทุกรูปแบบ"</p></div></section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 md:grid-cols-4 gap-8"><div className="col-span-1 md:col-span-2"><div className="flex items-center space-x-3 mb-4"><Image src="/logo.png" alt="Driver Fatigue Detection Logo" width={32} height={32} className="h-8 w-8" /><span className="text-xl font-bold">Driver Fatigue Detection</span></div><p className="text-gray-400 mb-6 max-w-md">ระบบตรวจจับความเหนื่อยล้าของผู้ขับขี่ด้วยเทคโนโลยี AI เพื่อความปลอดภัยสูงสุดบนท้องถนน</p><div className="flex space-x-4"><Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2"><Facebook className="h-5 w-5" /></Button><Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2"><Twitter className="h-5 w-5" /></Button><Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2"><Instagram className="h-5 w-5" /></Button></div></div><div><h3 className="text-lg font-semibold mb-4">ลิงค์ด่วน</h3><ul className="space-y-2"><li><Button variant="link" className="p-0 text-gray-400 hover:text-white" onClick={() => scrollToSection('about')}>เกี่ยวกับเรา</Button></li><li><Button variant="link" className="p-0 text-gray-400 hover:text-white" onClick={() => scrollToSection('features')}>ฟีเจอร์</Button></li><li><Button variant="link" className="p-0 text-gray-400 hover:text-white" onClick={() => scrollToSection('how-it-works')}>วิธีใช้งาน</Button></li><li><Button variant="link" className="p-0 text-gray-400 hover:text-white" onClick={() => scrollToSection('pricing')}>ราคา</Button></li></ul></div><div><h3 className="text-lg font-semibold mb-4">ติดต่อเรา</h3><div className="space-y-3"><div className="flex items-center space-x-3"><Mail className="h-4 w-4 text-gray-400" /><span className="text-gray-400">support@driverfatigue.com</span></div><div className="flex items-center space-x-3"><Phone className="h-4 w-4 text-gray-400" /><span className="text-gray-400">02-123-4567</span></div></div></div></div><div className="border-t border-gray-800 mt-12 pt-8"><div className="flex flex-col md:flex-row justify-between items-center"><p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Driver Fatigue Detection. สงวนลิขสิทธิ์.</p><div className="flex space-x-6 mt-4 md:mt-0"><Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">นโยบายความเป็นส่วนตัว</Link><Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">ข้อกำหนดการใช้งาน</Link></div></div></div></div></footer>
    </div>
  )
}
