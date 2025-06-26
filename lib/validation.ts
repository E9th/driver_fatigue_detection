// Form validation utilities
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  license: string
  deviceId: string
}

export function validateRegistrationForm(data: RegisterFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // ตรวจสอบชื่อ-นามสกุล
  if (!data.fullName.trim()) {
    errors.fullName = "กรุณากรอกชื่อ-นามสกุล"
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = "ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"
  } else if (!/^[a-zA-Zก-๙\s.'-]+$/.test(data.fullName)) {
    errors.fullName = "ชื่อ-นามสกุลมีอักขระที่ไม่ได้รับอนุญาต"
  }

  // ตรวจสอบอีเมล
  if (!data.email.trim()) {
    errors.email = "กรุณากรอกอีเมล"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    errors.email = "รูปแบบอีเมลไม่ถูกต้อง"
  }

  // ตรวจสอบรหัสผ่าน
  if (!data.password) {
    errors.password = "กรุณากรอกรหัสผ่าน"
  } else if (data.password.length < 6) {
    errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
    errors.password = "รหัสผ่านต้องมีตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข"
  }

  // ตรวจสอบยืนยันรหัสผ่าน
  if (!data.confirmPassword) {
    errors.confirmPassword = "กรุณายืนยันรหัสผ่าน"
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
  }

  // ตรวจสอบเบอร์โทรศัพท์
  if (!data.phone.trim()) {
    errors.phone = "กรุณากรอกเบอร์โทรศัพท์"
  } else if (!/^[0-9]{10}$/.test(data.phone.replace(/[-\s]/g, ""))) {
    errors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก"
  }

  // ตรวจสอบเลขใบขับขี่
  if (!data.license.trim()) {
    errors.license = "กรุณากรอกเลขใบขับขี่"
  } else if (data.license.trim().length < 8) {
    errors.license = "เลขใบขับขี่ต้องมีอย่างน้อย 8 ตัวอักษร"
  }

  // ตรวจสอบ Device ID
  if (!data.deviceId) {
    errors.deviceId = "กรุณาเลือก Device ID"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function getErrorMessage(error: any): string {
  if (typeof error === "string") return error

  // Firebase Auth Errors
  switch (error.code) {
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว"
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง"
    case "auth/weak-password":
      return "รหัสผ่านไม่ปลอดภัย"
    case "auth/user-disabled":
      return "บัญชีนี้ถูกปิดใช้งาน"
    case "auth/user-not-found":
      return "ไม่พบบัญชีผู้ใช้"
    case "auth/wrong-password":
      return "รหัสผ่านไม่ถูกต้อง"
    case "auth/too-many-requests":
      return "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง"
    case "auth/network-request-failed":
      return "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย"
    default:
      return error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"
  }
}
