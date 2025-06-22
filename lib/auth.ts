"use client"

import { useState, useEffect, useCallback } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as firebaseUpdatePassword,
  type User
} from 'firebase/auth';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { app, database } from './firebase';
import type { UserProfile } from './types';

const auth = getAuth(app);

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (uid: string) => {
    const dbRef = ref(getDatabase());
    const snapshot = await get(child(dbRef, `users/${uid}`));
    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    return null;
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      setUserProfile(profile);
    }
  }, [user, fetchUserProfile]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Always start loading when auth state might change
      setLoading(true); 
      if (currentUser) {
        setUser(currentUser);
        // Ensure profile is fetched before setting loading to false
        const profile = await fetchUserProfile(currentUser.uid); 
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      // Only set loading to false after all async operations are complete
      setLoading(false); 
    });

    return () => unsubscribe();
  }, [fetchUserProfile]); 

  return { user, userProfile, loading, refreshUserProfile };
}

// ... (The rest of your functions: signIn, signUp, signOut, etc. remain unchanged)
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signUp(email: string, password: string, fullName: string, license: string, phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await firebaseUpdateProfile(user, { displayName: fullName });
    const userProfileData: UserProfile = {
      uid: user.uid, email: user.email!, fullName, role: 'driver', 
      registeredAt: new Date().toISOString(), deviceId: 'null', license, phone,
    };
    await set(ref(database, 'users/' + user.uid), userProfileData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const currentData = snapshot.val();
      await set(userRef, { ...currentData, ...data });
      if (data.fullName && auth.currentUser && auth.currentUser.uid === uid) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: data.fullName });
      }
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function reauthenticate(currentPassword: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        return false;
    }
}

export async function updateUserPassword(newPassword: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        await firebaseUpdatePassword(user, newPassword);
        return true;
    } catch (error) {
        return false;
    }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const dbRef = ref(getDatabase());
    try {
        const snapshot = await get(child(dbRef, `users/${uid}`));
        if (snapshot.exists()) {
            return snapshot.val() as UserProfile;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}
