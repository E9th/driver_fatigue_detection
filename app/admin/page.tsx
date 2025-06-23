/**
 * Admin Management Page - FIXED navigation
 * User management interface for administrators
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminGuard } from "@/components/admin-guard"
import { getAllUsers, deleteUser } from "@/lib/auth"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Search, UserX, User, LayoutDashboard, ArrowLeft, BarChart3 } from "lucide-react"
import type { UserProfile } from "@/lib/types"

/**
 * Admin page component for user management
 * Provides functionality to view, search, and delete users
 */
export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const router = useRouter()

  /**
   * Load all users on component mount
   */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await getAllUsers()
        setUsers(allUsers)
        setFilteredUsers(allUsers)
        console.log("✅ Users loaded:", allUsers.length)
      } catch (error) {
        console.error("❌ Error loading users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  /**
   * Filter users based on search term
   */
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.deviceId && user.deviceId.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  /**
   * Handle user deletion
   */
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsLoading(true)
    try {
      const result = await deleteUser(userToDelete)

      if (result.success) {
        // Update user list after deletion
        const updatedUsers = users.filter((user) => user.uid !== userToDelete)
        setUsers(updatedUsers)
        setFilteredUsers(updatedUsers)
        console.log("✅ User deleted successfully")
      } else {
        alert(`ไม่สามารถลบผู้ใช้ได้: ${result.error}`)
      }
    } catch (error) {
      console.error("❌ Error deleting user:", error)
      alert("เกิดข้อผิดพลาดในการลบผู้ใช้")
    } finally {
      setUserToDelete(null)
      setIsLoading(false)
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* FIXED: Navigate to Master Dashboard instead of regular dashboard */}
              <Button variant="outline" size="icon" onClick={() => router.push("/admin/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">ระบบจัดการผู้ใช้งาน (Admin)</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push("/admin/dashboard")}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Master Dashboard
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="ค้นหาผู้ใช้..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <LoadingScreen message="กำลังโหลดข้อมูลผู้ใช้..." />
          ) : (
            /* User Table */
            <div className="rounded-lg bg-white p-6 shadow-md">
              <Table>
                <TableCaption>รายชื่อผู้ใช้งานทั้งหมดในระบบ {filteredUsers.length} คน</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>เบอร์โทรศัพท์</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่ลงทะเบียน</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.deviceId || "ไม่มี"}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role === "admin" ? "แอดมิน" : "คนขับ"}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.registeredAt).toLocaleDateString("th-TH")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Profile Button */}
                          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/profile/${user.uid}`)}>
                            <User className="mr-1 h-4 w-4" />
                            โปรไฟล์
                          </Button>

                          {/* Dashboard Button (only if user has device) */}
                          {user.deviceId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/${user.uid}`)}
                            >
                              <LayoutDashboard className="mr-1 h-4 w-4" />
                              แดชบอร์ด
                            </Button>
                          )}

                          {/* Delete Button (only for non-admin users) */}
                          {user.role !== "admin" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user.uid)}>
                                  <UserX className="mr-1 h-4 w-4" />
                                  ลบ
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    คุณต้องการลบผู้ใช้ {user.fullName} ({user.email}) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteUser}>ยืนยันการลบ</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}
