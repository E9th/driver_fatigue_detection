"use client"

/**
 * ============================================================================
 * REGISTRATION PAGE - หน้าลงทะเบียนผู้ใช้ใหม่
 * ============================================================================
 *
 * หน้านี้จัดการการลงทะเบียนผู้ใช้ใหม่เข้าสู่ระบบ Driver Fatigue Detection
 * รวมถึงการตรวจสอบข้อมูลซ้ำ, การป้องกันการเลือกอุปกรณ์ซ้ำ, และการบันทึกข้อมูล
 *
 * MAIN FEATURES:
 * - Real-time email validation (ตรวจสอบอีเมลซ้ำแบบ real-time)
 * - Real-time license validation (ตรวจสอบใบขับขี่ซ้ำแบบ real-time) // เพิ่มใหม่
 * - Device availability checking (ตรวจสอบอุปกรณ์ที่ใช้ได้)
 * - Form validation (ตรวจสอบความถูกต้องของข้อมูล)
 * - Password strength validation (ตรวจสอบความแข็งแรงของรหัสผ่าน)
 * - Terms and conditions acceptance (การยอมรับข้อกำหนด)
 *
 * DEPENDENCIES:
 * - lib/auth.ts: สำหรับการลงทะเบียนผู้ใช้
 * - lib/validation.ts: สำหรับตรวจสอบข้อมูลซ้ำ
 * - components/device-id-selector.tsx: สำหรับเลือกอุปกรณ์
 *
 * NAVIGATION FLOW:
 * Register Success → /dashboard (ผู้ใช้ทั่วไป)
 * Register Success → /admin/dashboard (ผู้ดูแลระบบ)
 */

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DeviceIdSelector } from "@/components/device-id-selector"
import { registerUser } from "@/lib/auth"
// แก้ไข: เพิ่ม checkLicenseExists จาก lib/validation
import { checkEmailExists, checkDeviceExists, getUsedDevices, checkLicenseExists } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  // ============================================================================
  // STATE MANAGEMENT - การจัดการสถานะของ Component
  // ============================================================================

  /**
   * ข้อมูลฟอร์มลงทะเบียน
   */
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    license: "",
    deviceId: "",
  })

  /**
   * ข้อผิดพลาดของแต่ละฟิลด์
   */
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * การแสดง/ซ่อนรหัสผ่าน
   */
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  /**
   * การยอมรับข้อกำหนดและเงื่อนไข
   */
  const [acceptTerms, setAcceptTerms] = useState(false)

  /**
   * สถานะการส่งฟอร์ม
   */
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Timeout สำหรับการตรวจสอบอีเมลและใบขับขี่
   */
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [licenseCheckTimeout, setLicenseCheckTimeout] = useState<NodeJS.Timeout | null>(null) // เพิ่ม state ใหม่

  /**
   * รายการอุปกรณ์ที่ถูกใช้งานแล้ว
   */
  const [usedDevices, setUsedDevices] = useState<string[]>([])

  // Hooks สำหรับ navigation และ notifications
  const router = useRouter()
  const { toast } = useToast()

  // ============================================================================
  // EFFECTS - การทำงานเมื่อ Component โหลดหรือ State เปลี่ยน
  // ============================================================================

  /**
   * โหลดรายการอุปกรณ์ที่ถูกใช้งานแล้ว
   */
  useEffect(() => {
    const loadUsedDevices = async () => {
      try {
        const devices = await getUsedDevices()
        setUsedDevices(devices)
        console.log("🔧 RegisterPage: Used devices:", devices)
      } catch (error) {
        console.error("🔧 RegisterPage: Error loading used devices:", error)
        // ไม่แสดง error ให้ผู้ใช้เห็น เพราะไม่ใช่ข้อผิดพลาดร้ายแรง
      }
    }

    loadUsedDevices()
  }, [])

  /**
   * ตรวจสอบอีเมลซ้ำแบบ Real-time
   */
  useEffect(() => {
    if (formData.email && formData.email.includes("@")) {
      // ล้าง timeout เดิม
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      // ตั้ง timeout ใหม่
      const timeout = setTimeout(async () => {
        console.log("🔧 RegisterPage: Checking email availability:", formData.email)
        try {
          // ตรวจสอบรูปแบบอีเมล
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

          if (!isValidEmail) {
            setErrors((prev) => ({ ...prev, email: "รูปแบบอีเมลไม่ถูกต้อง" }))
            return
          }

          // ตรวจสอบอีเมลซ้ำ
          const emailExists = await checkEmailExists(formData.email)

          if (emailExists) {
            setErrors((prev) => ({ ...prev, email: "อีเมลนี้ถูกใช้งานแล้ว" }))
          } else {
            // ล้าง error ถ้าอีเมลใช้ได้
            setErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors.email
              return newErrors
            })
          }
        } catch (error) {
          console.error("🔧 RegisterPage: Error checking email:", error)
          // ไม่แสดง error ถ้าไม่สามารถตรวจสอบได้ (อาจเป็นปัญหา network)
          setErrors((prev) => ({ ...prev, email: "ไม่สามารถตรวจสอบอีเมลได้" }))
        }
      }, 1000) // รอ 1 วินาที

      setEmailCheckTimeout(timeout)
    }

    // Cleanup function
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
    }
  }, [formData.email])
  
  /**
   * [โค้ดใหม่] ตรวจสอบเลขใบขับขี่ซ้ำแบบ Real-time
   */
  useEffect(() => {
    if (formData.license && formData.license.length > 5) { // เริ่มตรวจเมื่อความยาวพอสมควร
      if (licenseCheckTimeout) {
        clearTimeout(licenseCheckTimeout);
      }
  
      const timeout = setTimeout(async () => {
        console.log("🔧 RegisterPage: Checking license availability:", formData.license);
        try {
          const licenseExists = await checkLicenseExists(formData.license);
          if (licenseExists) {
            setErrors((prev) => ({ ...prev, license: "เลขใบขับขี่นี้ถูกใช้งานแล้ว" }));
          } else {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.license;
              return newErrors;
            });
          }
        } catch (error) {
          console.error("🔧 RegisterPage: Error checking license:", error);
          // ไม่ต้องแสดง error หาก network มีปัญหา แต่จะไปดักอีกทีตอน submit
        }
      }, 1000); // รอ 1 วินาที
  
      setLicenseCheckTimeout(timeout);
    }
  
    return () => {
      if (licenseCheckTimeout) {
        clearTimeout(licenseCheckTimeout);
      }
    };
  }, [formData.license]);

  // ============================================================================
  // EVENT HANDLERS - ฟังก์ชันจัดการ Events
  // ============================================================================

  /**
   * จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
   */
  const handleInputChange = (field: string, value: string) => {
    console.log(`🔧 RegisterPage: Input change: ${field} = ${value}`)

    // อัปเดตข้อมูล
    setFormData((prev) => ({ ...prev, [field]: value }))

    // ล้าง error เมื่อผู้ใช้เริ่มพิมพ์
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  /**
   * [โค้ดแก้ไข] ตรวจสอบความถูกต้องของฟอร์มทั้งหมด
   */
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    // [โค้ดใหม่] Regex สำหรับตรวจสอบ
    const validFullNameRegex = /^[a-zA-Zก-๙\s.'-]+$/;
    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // ตรวจสอบข้อมูลพื้นฐาน และรูปแบบ
    if (!formData.fullName.trim()) {
        newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
    } else if (!validFullNameRegex.test(formData.fullName)) {
        newErrors.fullName = "ชื่อ-นามสกุลมีอักขระที่ไม่ได้รับอนุญาต";
    }

    if (!formData.email.trim()) {
        newErrors.email = "กรุณากรอกอีเมล";
    } else if (!validEmailRegex.test(formData.email)) {
        newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    
    if (!formData.password) newErrors.password = "กรุณากรอกรหัสผ่าน"
    if (formData.password.length < 6) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
    if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์"
    if (!formData.license.trim()) newErrors.license = "กรุณากรอกเลขใบขับขี่"
    if (!formData.deviceId) newErrors.deviceId = "กรุณาเลือก Device ID"
    if (!acceptTerms) newErrors.terms = "กรุณายอมรับข้อกำหนดและเงื่อนไข"

    // ตรวจสอบอีเมลซ้ำ (ถ้าผ่านการตรวจสอบพื้นฐาน)
    if (formData.email && !newErrors.email) {
      try {
        const emailExists = await checkEmailExists(formData.email)
        if (emailExists) {
          newErrors.email = "อีเมลนี้ถูกใช้งานแล้ว"
        }
      } catch (error) {
        console.error("🔧 RegisterPage: Cannot check email during validation:", error)
      }
    }

    // [โค้ดใหม่] ตรวจสอบเลขใบขับขี่ซ้ำ (ถ้าผ่านการตรวจสอบพื้นฐาน)
    if (formData.license && !newErrors.license) {
        try {
          const licenseExists = await checkLicenseExists(formData.license);
          if (licenseExists) {
            newErrors.license = "เลขใบขับขี่นี้ถูกใช้งานแล้ว";
          }
        } catch (error) {
          console.error("🔧 RegisterPage: Cannot check license during validation:", error);
        }
    }

    // ตรวจสอบอุปกรณ์ซ้ำ (ถ้าผ่านการตรวจสอบพื้นฐาน)
    if (formData.deviceId && !newErrors.deviceId) {
      try {
        const deviceExists = await checkDeviceExists(formData.deviceId)
        if (deviceExists) {
          const allDevices = Array.from({ length: 20 }, (_, i) => `device_${String(i + 1).padStart(2, "0")}`)
          const availableDevices = allDevices.filter((device) => !usedDevices.includes(device))
          const suggestion = availableDevices.length > 0 ? ` แนะนำ: ${availableDevices.slice(0, 3).join(", ")}` : ""

          newErrors.deviceId = `อุปกรณ์นี้ถูกใช้งานแล้ว${suggestion}`
        }
      } catch (error) {
        console.error("🔧 RegisterPage: Cannot check device during validation:", error)
      }
    }

    // อัปเดต errors state
    setErrors(newErrors)

    // ส่งคืนผลลัพธ์
    return Object.keys(newErrors).length === 0
  }

  /**
   * [โค้ดแก้ไข] จัดการการส่งฟอร์ม
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔧 RegisterPage: Form submitted")

    setIsSubmitting(true)

    try {
      // STEP 1: ตรวจสอบความถูกต้องของฟอร์ม
      const isValid = await validateForm()

      if (!isValid) {
        console.log("🔧 RegisterPage: Form validation failed:", errors)
        // [โค้ดแก้ไข] ปลดล็อกปุ่มหาก validation ไม่ผ่าน
        setIsSubmitting(false) 
        return
      }

      // STEP 2: ลงทะเบียนผู้ใช้
      console.log("🔧 RegisterPage: Registering user with data:", formData)
      const result = await registerUser(formData)

      console.log("🔧 RegisterPage: Registration result:", result)

      if (result.success) {
        // แสดงข้อความสำเร็จ
        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "ยินดีต้อนรับเข้าสู่ระบบ Driver Fatigue Detection",
        })

        // [โค้ดแก้ไข] Redirect ไปยัง dashboard ทันที
        router.push("/dashboard")
      } else {
        // แสดงข้อความผิดพลาด
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถสมัครสมาชิกได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("🔧 RegisterPage: Registration error:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // RENDER - การแสดงผล UI
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        {/* Header Section */}
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Driver Fatigue Detection Logo" width={80} height={80} className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl font-bold">สมัครสมาชิกผู้ขับขี่</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อใช้งานระบบ Driver Fatigue Detection</CardDescription>
        </CardHeader>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName">ชื่อ-นามสกุล *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={errors.fullName ? "border-red-500" : ""}
                placeholder="สมชาย ใจดี"
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                placeholder="somchai.d@example.com"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">หมายเลขโทรศัพท์ *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={errors.phone ? "border-red-500" : ""}
                placeholder="0812345678"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* License Field */}
            <div className="space-y-2">
              <Label htmlFor="license">เลขใบขับขี่ *</Label>
              <Input
                id="license"
                value={formData.license}
                onChange={(e) => handleInputChange("license", e.target.value)}
                className={errors.license ? "border-red-500" : ""}
                placeholder="เลขใบขับขี่"
              />
              {errors.license && <p className="text-sm text-red-500">{errors.license}</p>}
            </div>

            {/* Device ID Selector */}
            <DeviceIdSelector
              value={formData.deviceId}
              onValueChange={(value) => handleInputChange("deviceId", value)}
              error={errors.deviceId}
              disabled={isSubmitting}
              usedDevices={usedDevices}
            />

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                ฉันยอมรับ{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  ข้อกำหนดและเงื่อนไข
                </Link>{" "}
                และ{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </Label>
            </div>
            {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}
          </CardContent>

          {/* Footer Section */}
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </Button>
            <div className="text-center text-sm">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">กลับสู่หน้าหลัก</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
