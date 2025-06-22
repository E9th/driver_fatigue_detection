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
import { app, database } from './firebase'; // Ensure 'database' is exported from firebase.ts
import type { UserProfile } from './types';

const auth = getAuth(app);

// Custom Hook to manage auth state and user profile
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
  
  // --- FIX: This useEffect now has an empty dependency array `[]` ---
  // This ensures the onAuthStateChanged listener is set up only ONCE when the hook is first used.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const profile = await fetchUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [fetchUserProfile]); // fetchUserProfile is memoized with useCallback

  return { user, userProfile, loading, refreshUserProfile };
}

// Sign-in function
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: any) {
    console.error("Sign-in error:", error);
    return { success: false, error: error.message };
  }
}

// Sign-up function
export async function signUp(email: string, password: string, fullName: string, license: string, phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set display name in Auth
    await firebaseUpdateProfile(user, { displayName: fullName });
    
    // Create user profile in Realtime Database
    const userProfileData: UserProfile = {
      uid: user.uid,
      email: user.email!,
      fullName,
      role: 'driver', // Default role
      registeredAt: new Date().toISOString(),
      deviceId: 'null', // Default deviceId
      license,
      phone,
    };
    await set(ref(database, 'users/' + user.uid), userProfileData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Sign-up error:", error);
    return { success: false, error: error.message };
  }
}

// Sign-out function
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ... (The rest of your functions: updateUserProfile, reauthenticate, updateUserPassword)
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const currentData = snapshot.val();
      await set(userRef, { ...currentData, ...data });
      // Also update auth profile if fullName changes
      if (data.fullName && auth.currentUser && auth.currentUser.uid === uid) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: data.fullName });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating profile:", error);
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
        console.error("Re-authentication failed:", error);
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
        console.error("Error updating password:", error);
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
        console.error("Error getting user profile:", error);
        return null;
    }
}
