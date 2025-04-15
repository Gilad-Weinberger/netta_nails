"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function Home() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // false = sign in, true = sign up
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
      if (isSignUp) {
        // Handle sign-up
        if (!name) {
          throw new Error("נא להזין שם מלא");
        }

        if (!email) {
          throw new Error("נא להזין כתובת אימייל");
        }

        if (!phoneNumber) {
          throw new Error("נא להזין מספר טלפון");
        }

        if (!password || password.length < 6) {
          throw new Error("סיסמה חייבת להכיל לפחות 6 תווים");
        }

        if (password !== confirmPassword) {
          throw new Error("הסיסמאות אינן תואמות");
        }

        // Validate Israeli phone number
        if (!phoneNumber.startsWith("+972") || phoneNumber.length !== 13) {
          throw new Error("אנא הכניסי מספר טלפון ישראלי תקין");
        }

        await signUp(email, password, name, phoneNumber);
      } else {
        // Handle sign-in
        if (!email) {
          throw new Error("נא להזין כתובת אימייל");
        }

        if (!password) {
          throw new Error("נא להזין סיסמה");
        }

        await signIn(email, password);
      }

      // Redirect to appointments page on success
      router.push("/appointments");
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
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
          <p className="text-gray-600">מערכת קביעת תורים ללק ג'ל</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם מלא
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="הכניסי את שמך המלא"
                dir="rtl"
              />
            </div>
          )}

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
              placeholder={isSignUp ? "לפחות 6 תווים" : "הכניסי את הסיסמה שלך"}
              dir="ltr"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אימות סיסמה
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="הכניסי את הסיסמה שוב"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מספר טלפון
                </label>
                <PhoneInput
                  international
                  defaultCountry="IL"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="הכניסי את מספר הטלפון שלך"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * יש להזין מספר טלפון ישראלי עם קידומת 972+
                </p>
              </div>
            </>
          )}

          {error && <div className="text-red-500 text-sm py-2">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? isSignUp
                ? "רושם..."
                : "מתחבר..."
              : isSignUp
              ? "הרשמה"
              : "התחברות"}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-pink-600 hover:underline focus:outline-none"
            >
              {isSignUp
                ? "כבר יש לך חשבון? התחברי כאן"
                : "אין לך חשבון? הרשמי כאן"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
