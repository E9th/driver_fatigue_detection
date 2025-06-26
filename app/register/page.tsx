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
import { validateRegistrationForm, getErrorMessage, type RegisterFormData } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
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
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isCheckingLicense, setIsCheckingLicense] = useState(false)

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
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดรายการอุปกรณ์ได้",
          variant: "destructive",
        })
      }
    }

    loadUsedDevices()
  }, [toast])

  // Real-time email validation
  useEffect(() => {
    if (formData.email && formData.email.includes("@")) {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      const timeout = setTimeout(async () => {
        console.log("🔧 RegisterPage: Checking email availability:", formData.email)
        setIsCheckingEmail(true)

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
        } finally {
          setIsCheckingEmail(false)
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
        setIsCheckingLicense(true)

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
          setErrors((prev) => ({ ...prev, license: "ไม่สามารถตรวจสอบเลขใบขับขี่ได้" }))
        } finally {
          setIsCheckingLicense(false)
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

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    console.log(`🔧 RegisterPage: Input change: ${field} = ${value}`)
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔧 RegisterPage: Form submitted")

    // Validate terms acceptance
    if (!acceptTerms) {
      setErrors({ terms: "กรุณายอมรับข้อกำหนดและเงื่อนไข" })
      return
    }

    // Validate form data
    const validation = validateRegistrationForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณาตรวจสอบข้อมูลที่กรอกใหม่อีกครั้ง",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check for duplicates one more time before submitting
      const [emailExists, licenseExists] = await Promise.all([
        checkEmailExists(formData.email),
        checkLicenseExists(formData.license),
      ])

      if (emailExists) {
        setErrors({ email: "อีเมลนี้ถูกใช้งานแล้ว" })
        toast({
          title: "อีเมลซ้ำ",
          description: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น",
          variant: "destructive",
        })
        return
      }

      if (licenseExists) {
        setErrors({ license: "เลขใบขับขี่นี้ถูกใช้งานแล้ว" })
        toast({
          title: "เลขใบขับขี่ซ้ำ",
          description: "เลขใบขับขี่นี้ถูกใช้งานแล้ว",
          variant: "destructive",
        })
        return
      }

      const result = await registerUser(formData)

      if (result.success) {
        toast({
          title: "สมัครสมาชิกสำเร็จ",
          description: "ยินดีต้อนรับเข้าสู่ระบบ Driver Fatigue Detection",
        })

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        const errorMessage = getErrorMessage(result.error)
        toast({
          title: "การลงทะเบียนล้มเหลว",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Register page error:", error)
      const errorMessage = getErrorMessage(error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Driver Fatigue Detection Logo"
              width={80}
              height={80}
              className="h-20 w-20"
              onError={(e) => {
                console.error("Logo loading error")
                // Fallback to placeholder if logo fails to load
                e.currentTarget.src = "/placeholder.svg?height=80&width=80"
              }}
            />
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
                disabled={isSubmitting}
              />
              {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="somchai.d@example.com"
                  disabled={isSubmitting}
                />
                {isCheckingEmail && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
              </div>
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
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* License Field */}
            <div className="space-y-2">
              <Label htmlFor="license">เลขใบขับขี่ *</Label>
              <div className="relative">
                <Input
                  id="license"
                  value={formData.license}
                  onChange={(e) => handleInputChange("license", e.target.value)}
                  className={errors.license ? "border-red-500" : ""}
                  placeholder="เลขใบขับขี่"
                  disabled={isSubmitting}
                />
                {isCheckingLicense && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
              </div>
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
                disabled={isSubmitting}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                "สมัครสมาชิก"
              )}
            </Button>
            <div className="text-center text-sm">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>
            <Button variant="outline" className="w-full" asChild disabled={isSubmitting}>
              <Link href="/">กลับสู่หน้าหลัก</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
