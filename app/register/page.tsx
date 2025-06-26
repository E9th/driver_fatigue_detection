"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DeviceIdSelector } from "@/components/device-id-selector"
import { registerUser, checkEmailExists, checkLicenseExists, getUsedDevices } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    license: "",
    deviceId: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [licenseCheckTimeout, setLicenseCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [usedDevices, setUsedDevices] = useState<string[]>([])

  const router = useRouter()
  const { toast } = useToast()

  // Load used devices
  useEffect(() => {
    const loadUsedDevices = async () => {
      try {
        const devices = await getUsedDevices()
        setUsedDevices(devices)
        console.log("🔧 RegisterPage: Used devices:", devices)
      } catch (error) {
        console.error("🔧 RegisterPage: Error loading used devices:", error)
      }
    }

    loadUsedDevices()
  }, [])

  // Real-time email validation
  useEffect(() => {
    if (formData.email && formData.email.includes("@")) {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      const timeout = setTimeout(async () => {
        console.log("🔧 RegisterPage: Checking email availability:", formData.email)
        try {
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)

          if (!isValidEmail) {
            setErrors((prev) => ({ ...prev, email: "รูปแบบอีเมลไม่ถูกต้อง" }))
            return
          }

          const emailExists = await checkEmailExists(formData.email)

          if (emailExists) {
            setErrors((prev) => ({ ...prev, email: "อีเมลนี้ถูกใช้งานแล้ว" }))
          } else {
            setErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors.email
              return newErrors
            })
          }
        } catch (error) {
          console.error("🔧 RegisterPage: Error checking email:", error)
          setErrors((prev) => ({ ...prev, email: "ไม่สามารถตรวจสอบอีเมลได้" }))
        }
      }, 1000)

      setEmailCheckTimeout(timeout)
    }

    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
    }
  }, [formData.email])

  // Real-time license validation
  useEffect(() => {
    if (formData.license && formData.license.length > 5) {
      if (licenseCheckTimeout) {
        clearTimeout(licenseCheckTimeout)
      }

      const timeout = setTimeout(async () => {
        console.log("🔧 RegisterPage: Checking license availability:", formData.license)
        try {
          const licenseExists = await checkLicenseExists(formData.license)
          if (licenseExists) {
            setErrors((prev) => ({ ...prev, license: "เลขใบขับขี่นี้ถูกใช้งานแล้ว" }))
          } else {
            setErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors.license
              return newErrors
            })
          }
        } catch (error) {
          console.error("🔧 RegisterPage: Error checking license:", error)
        }
      }, 1000)

      setLicenseCheckTimeout(timeout)
    }

    return () => {
      if (licenseCheckTimeout) {
        clearTimeout(licenseCheckTimeout)
      }
    }
  }, [formData.license])

  const handleInputChange = (field: string, value: string) => {
    console.log(`🔧 RegisterPage: Input change: ${field} = ${value}`)
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    const validFullNameRegex = /^[a-zA-Zก-๙\s.'-]+$/
    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

    if (!formData.fullName.trim()) {
      newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล"
    } else if (!validFullNameRegex.test(formData.fullName)) {
      newErrors.fullName = "ชื่อ-นามสกุลมีอักขระที่ไม่ได้รับอนุญาต"
    }

    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล"
    } else if (!validEmailRegex.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง"
    }

    if (!formData.password) newErrors.password = "กรุณากรอกรหัสผ่าน"
    if (formData.password.length < 6) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
    if (!formData.phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์"
    if (!formData.license.trim()) newErrors.license = "กรุณากรอกเลขใบขับขี่"
    if (!formData.deviceId) newErrors.deviceId = "กรุณาเลือก Device ID"
    if (!acceptTerms) newErrors.terms = "กรุณายอมรับข้อกำหนดและเงื่อนไข"

    // Check email availability
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

    // Check license availability
    if (formData.license && !newErrors.license) {
      try {
        const licenseExists = await checkLicenseExists(formData.license)
        if (licenseExists) {
          newErrors.license = "เลขใบขับขี่นี้ถูกใช้งานแล้ว"
        }
      } catch (error) {
        console.error("🔧 RegisterPage: Cannot check license during validation:", error)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔧 RegisterPage: Form submitted")
    setIsSubmitting(true)

    try {
      const isValid = await validateForm()
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      const result = await registerUser(formData)

      if (result.success) {
        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "กำลังนำท่านไปยังหน้าแดชบอร์ด...",
        })

        // Simple redirect without session API
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        toast({
          title: "การลงทะเบียนล้มเหลว",
          description: result.error || "ไม่สามารถสมัครสมาชิกได้",
          variant: "destructive",
        })
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error("Register page error:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Driver Fatigue Detection Logo" width={80} height={80} className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl font-bold">สมัครสมาชิกผู้ขับขี่</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อใช้งานระบบ Driver Fatigue Detection</CardDescription>
        </CardHeader>

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
