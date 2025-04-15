"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function SignIn() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/appointments");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Handle sign-in
      if (!email) {
        throw new Error("נא להזין כתובת אימייל");
      }

      if (!password) {
        throw new Error("נא להזין סיסמה");
      }

      await signIn(email, password);

      // Redirect to appointments page on success
      router.push("/appointments");
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-xl font-semibold text-pink-600">טוען...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-pink-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">נטע ניילס</h1>
          <p className="text-gray-600">כניסה למערכת</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כתובת אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="הכניסי את הסיסמה שלך"
              dir="ltr"
            />
          </div>

          {error && <div className="text-red-500 text-sm py-2">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "מתחבר..." : "התחברות"}
          </button>

          <div className="text-center mt-4">
            <Link
              href="/auth/signup"
              className="text-pink-600 hover:underline focus:outline-none"
            >
              אין לך חשבון? הרשמי כאן
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
