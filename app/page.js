"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/appointments");
    }
  }, [loading, user, router]);

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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-pink-600 mb-3">נטע ניילס</h1>
          <p className="text-gray-600">מערכת קביעת תורים ללק ג&apos;ל</p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/auth/signin">
            <button className="w-full py-3 px-4 bg-white text-pink-600 font-semibold rounded-md border border-pink-300 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors">
              התחברות
            </button>
          </Link>
          <Link href="/auth/signup">
            <button className="w-full py-3 px-4 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors">
              הרשמה
            </button>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>קביעת תור לאיחור ג&apos;ל | מניקור | פדיקור</p>
          <p className="mt-2">© נטע ניילס 2025</p>
        </div>
      </div>
    </main>
  );
}
