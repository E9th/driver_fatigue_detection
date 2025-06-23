// components/admin-guard.tsx

"use client";

import { useAuth } from "@/lib/auth"; // สมมติว่า path นี้ถูกต้อง
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "./loading-screen";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // ถ้าโหลดเสร็จแล้ว แต่ไม่มี user ให้ redirect ไปหน้า login
      console.warn("🔒 AdminGuard: No user found, redirecting to login.");
      router.replace("/login");
    } else if (!loading && user && !isAdmin) {
      // ถ้าโหลดเสร็จ, มี user แต่ไม่ใช่ admin ให้ redirect ไปหน้า dashboard ปกติ
      console.warn("🚫 AdminGuard: User is not an admin, redirecting to dashboard.");
      router.replace("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !user) {
    // ขณะกำลังโหลด หรือยังไม่มีข้อมูล user ให้แสดงหน้า loading
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์การเข้าถึง..." />;
  }

  if (isAdmin) {
    // ถ้าเป็น admin, ให้ render children ที่รับเข้ามาได้เลย
    // การ return children โดยตรงแบบนี้จะแก้ปัญหา React.Children.only
    return <>{children}</>;
  }

  // เป็น fallback กรณีที่ยังไม่ redirect แต่ user ไม่ใช่ admin
  // โดยปกติ useEffect จะทำงานก่อนมาถึงตรงนี้
  return <LoadingScreen message="กำลังเปลี่ยนเส้นทาง..." />;
}
