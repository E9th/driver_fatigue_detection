"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { get, ref } from "firebase/database"
import { database } from "@/lib/firebase"
import type { UserProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { LoadingScreen } from "./loading-screen"

export function AdminMasterDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const usersRef = ref(database, "users")
        const snapshot = await get(usersRef)
        if (snapshot.exists()) {
          const usersData = snapshot.val()
          const usersList = Object.keys(usersData)
            .map((key) => ({
              uid: key,
              ...usersData[key],
            }))
            .filter((user) => user.role !== "admin") // ไม่แสดงผู้ใช้ที่เป็น admin
          setUsers(usersList)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Master Dashboard</h1>
      <div className="mb-4">
        <Input
          placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ-นามสกุล</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.deviceId || "N/A"}</TableCell>
                  <TableCell>
                    {/* --- แก้ไขกลับคืน --- */}
                    {/* เปลี่ยนลิงก์กลับไปที่ /admin/dashboard/ */}
                    <Link href={`/admin/dashboard/${user.uid}`}>
                      <Button variant="outline" size="sm">
                        ดูแดชบอร์ด
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  ไม่พบข้อมูลผู้ใช้งาน
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
