// lib/admin-utils.ts

import { ref, get, set, remove } from "firebase/database";
import { database } from "./firebase";
import type { UserProfile, DeviceInfo } from "./types"; // ตรวจสอบว่า import Type ครบถ้วน

/**
 * Interface สำหรับข้อมูลที่รวม User และ Device เข้าด้วยกัน
 */
interface UserWithDevice extends UserProfile {
  device?: DeviceInfo;
}

/**
 * Get all users (Admin function)
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    if (!database) {
      throw new Error("Firebase DB not available");
    }
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      return Object.entries(usersData).map(([uid, data]: [string, any]) => ({
        uid,
        ...data,
      }));
    }
    return [];
  } catch (error) {
    console.error("❌ Error in getAllUsers:", error);
    // Re-throw the error to be caught by the calling component
    throw error;
  }
};

/**
 * Delete user (Admin function)
 */
export const deleteUser = async (
  uid: string
): Promise<{ success: boolean; error?: string; releasedDeviceId?: string }> => {
  try {
    if (!database) {
      throw new Error("Database not initialized");
    }

    const userRef = ref(database, `users/${uid}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      await remove(userRef);
      console.log("✅ Firebase: User deleted successfully");
      return {
        success: true,
        releasedDeviceId: userData?.deviceId || undefined,
      };
    }
    return { success: false, error: "User not found" };
  } catch (error: any) {
    console.error("🔥 Firebase: Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all used device IDs (Admin function)
 */
export const getUsedDeviceIds = async (): Promise<string[]> => {
  try {
    if (!database) {
      throw new Error("Firebase DB not available");
    }
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const usedIds = Object.values(usersData)
        .map((user: any) => user.deviceId)
        .filter(Boolean); // กรองเอาค่าที่เป็น null หรือ undefined ออก
      return usedIds as string[];
    }
    return [];
  } catch (error) {
    console.error("❌ Error in getUsedDeviceIds:", error);
    throw error;
  }
};

/**
 * Get all users and their associated device data (Admin function)
 */
export const getAllUsersWithDeviceData = async (): Promise<UserWithDevice[]> => {
  try {
    if (!database) {
      throw new Error("Firebase DB not available");
    }

    // 1. ดึงข้อมูลผู้ใช้ทั้งหมด
    const users = await getAllUsers();
    if (users.length === 0) {
      return [];
    }

    // 2. ดึงข้อมูลสถานะของอุปกรณ์ทั้งหมดในครั้งเดียว
    const deviceRef = ref(database, "devices");
    const deviceSnapshot = await get(deviceRef);
    const devicesData = deviceSnapshot.exists() ? deviceSnapshot.val() : {};

    // 3. รวมข้อมูลผู้ใช้เข้ากับข้อมูลอุปกรณ์
    const usersWithDevices = users.map(user => {
      const userDevice = user.deviceId ? devicesData[user.deviceId] : undefined;
      return {
        ...user,
        device: userDevice,
      };
    });

    return usersWithDevices;

  } catch (error) {
    console.error("❌ Error in getAllUsersWithDeviceData:", error);
    throw error;
  }
};

// ฟังก์ชันสำหรับเปลี่ยน Driver เป็น Admin
export const promoteDriverToAdmin = async (
  uid: string
): Promise<{ success: boolean; error?: string; releasedDeviceId?: string }> => {
  try {
    console.log(`👑 Promoting user ${uid} to admin...`);

    // 1. ดึงข้อมูลผู้ใช้ปัจจุบัน
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return { success: false, error: "ไม่พบผู้ใช้" };
    }

    const userData = snapshot.val();
    const deviceId = userData.deviceId;

    // 2. อัปเดตเป็น admin และเอา deviceId ออก
    await set(userRef, {
      ...userData,
      role: "admin",
      deviceId: null, // เอา device ออก
      promotedToAdminAt: new Date().toISOString(),
    });

    console.log(`✅ User ${uid} promoted to admin, device ${deviceId} released`);

    return {
      success: true,
      releasedDeviceId: deviceId,
    };
  } catch (error: any) {
    console.error("Error promoting user to admin:", error);
    return { success: false, error: error.message };
  }
};

// ฟังก์ชันสำหรับตรวจสอบ Device ที่ว่าง
export const getAvailableDevices = async (): Promise<string[]> => {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      // If no users, all devices are available
      return Array.from({ length: 20 }, (_, i) => `device_${String(i + 1).padStart(2, "0")}`);
    }

    const users = snapshot.val();
    const usedDeviceIds = new Set<string>();

    // เก็บ device ที่ใช้งานอยู่
    Object.values(users).forEach((user: any) => {
      if (user.deviceId && user.role === "driver") {
        usedDeviceIds.add(user.deviceId);
      }
    });

    // สร้างรายการ device ทั้งหมด
    const allDevices = Array.from({ length: 20 }, (_, i) => `device_${String(i + 1).padStart(2, "0")}`);

    // คืนค่า device ที่ว่าง
    const availableDevices = allDevices.filter((device) => !usedDeviceIds.has(device));

    console.log(`📱 Available devices: ${availableDevices.length}`, availableDevices);
    return availableDevices;
  } catch (error) {
    console.error("Error getting available devices:", error);
    return [];
  }
};
