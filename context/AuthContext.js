"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() });
        } else {
          // New user, only has basic Firebase Auth info
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, name, phone) => {
    try {
      console.log("Creating user account");

      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user profile with display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      console.log("Email/password account created successfully");

      // Store additional user data in Firestore
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          email: email,
          phone: phone,
          name: name,
          role: "user", // Default role is user
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return userCredential.user;
    } catch (error) {
      console.error("Error in signUp:", error);

      // Handle specific errors
      if (error.code === "auth/email-already-in-use") {
        throw new Error("כתובת האימייל כבר קיימת במערכת");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("כתובת אימייל לא תקינה");
      } else if (error.code === "auth/weak-password") {
        throw new Error("הסיסמה חלשה מדי, אנא בחרי סיסמה חזקה יותר");
      }

      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      console.log("Signing in with email/password");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Email/password authentication successful");

      return userCredential.user;
    } catch (error) {
      console.error("Error in signIn:", error);

      // Handle specific errors
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        throw new Error("אימייל או סיסמה שגויים");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("כתובת אימייל לא תקינה");
      } else if (error.code === "auth/user-disabled") {
        throw new Error("המשתמש חסום, אנא פני למנהל המערכת");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("יותר מדי ניסיונות כניסה, אנא נסי שוב מאוחר יותר");
      }

      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const contextValue = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
