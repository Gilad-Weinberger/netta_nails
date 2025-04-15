"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAvailableAppointments,
  bookAppointment,
} from "@/utils/appointmentUtils";
import { sendAppointmentSMS } from "@/utils/twilioUtils";

export default function Appointments() {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  // Redirect admin to admin page
  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push("/admin");
    }
  }, [loading, user, isAdmin, router]);

  // Fetch available appointments
  useEffect(() => {
    if (user && !isAdmin) {
      fetchAppointments();
    }
  }, [user, isAdmin]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const appointmentsData = await getAvailableAppointments();
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("שגיאה בטעינת התורים הזמינים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");

    if (!window.confirm("האם את בטוחה שברצונך לקבוע תור זה?")) {
      return;
    }

    try {
      const bookedAppointment = await bookAppointment(appointmentId, {
        uid: user.uid,
        name: user.name,
        phone: user.phone,
      });

      // Send SMS to user
      await sendAppointmentSMS(
        user.phone,
        user.name,
        formatDate(bookedAppointment.date),
        bookedAppointment.time
      );

      // Send SMS to admin (using environment variable)
      await sendAppointmentSMS(
        process.env.NEXT_PUBLIC_ADMIN_PHONE,
        user.name,
        formatDate(bookedAppointment.date),
        bookedAppointment.time
      );

      setSuccess("התור נקבע בהצלחה! קיבלת הודעת SMS עם פרטי התור");

      // Remove booked appointment from list
      setAppointments(appointments.filter((app) => app.id !== appointmentId));
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(error.message || "שגיאה בקביעת התור");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-xl font-semibold text-pink-600">טוען...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-pink-600">תורים זמינים</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-pink-600 hover:text-pink-800"
          >
            התנתקי
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="text-gray-700">
            שלום <span className="font-semibold">{user.name}</span>
          </div>
          <div className="text-sm text-gray-500">מספר טלפון: {user.phone}</div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-pink-600">טוען תורים זמינים...</div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">אין תורים זמינים כרגע</p>
              <p className="text-sm text-gray-500 mt-2">
                נסי לבדוק שוב מאוחר יותר
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg text-gray-800">
                      {formatDate(appointment.date)}
                    </div>
                    <div className="text-gray-600">שעה: {appointment.time}</div>
                    <div className="text-gray-500 text-sm">
                      משך: {appointment.duration || 90} דקות
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookAppointment(appointment.id)}
                    className="px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
                  >
                    קביעת תור
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
