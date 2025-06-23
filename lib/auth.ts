"use client"

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore" // ใช้ firestore สำหรับโปรไฟล์
import { app, db } from "./firebase" // ต้อง import db จาก firebase.ts
import { UserProfile } from "./types"
import { LoadingScreen } from "@/components/loading-screen"

// 1. กำหนด Type ของ Context ให้ชัดเจน
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

// 2. สร้าง Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. สร้าง AuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        // ดึงข้อมูลโปรไฟล์จาก Firestore เพื่อเช็ค Role
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setUserProfile(profile);
          setIsAdmin(profile.role === 'admin');
        } else {
          // กรณีหาโปรไฟล์ไม่เจอ
          setUserProfile(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userProfile, isAdmin, loading };

  // ตรวจสอบสถานะ loading ก่อน render children
  if (loading) {
    return <LoadingScreen message="กำลังเริ่มต้นระบบ..." />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. สร้างและ Export Hook `useAuth`
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 5. Export ฟังก์ชันที่จำเป็นอื่นๆ
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut as signOut,
};
