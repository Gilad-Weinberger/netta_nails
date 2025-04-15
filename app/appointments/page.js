"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAvailableAppointments,
  getUserAppointments,
  bookAppointment,
  cancelAppointment,
} from "@/utils/appointmentUtils";

export default function Appointments() {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUserAppointments, setIsLoadingUserAppointments] =
    useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUserAppointments = useCallback(async () => {
    if (!user) return;

    setIsLoadingUserAppointments(true);
    try {
      const userAppointmentsData = await getUserAppointments(user.uid);
      setUserAppointments(userAppointmentsData);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
      // Don't set global error for this to avoid confusing the user
    } finally {
      setIsLoadingUserAppointments(false);
    }
  }, [user]);

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

  // Fetch available appointments and user's booked appointments
  useEffect(() => {
    if (user && !isAdmin) {
      fetchAppointments();
      fetchUserAppointments();
    }
  }, [user, isAdmin, fetchUserAppointments]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const appointmentsData = await getAvailableAppointments();
      setAvailableAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching available appointments:", error);
      setError("שגיאה בטעינת התורים הזמינים");
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number to ensure it has the international code
  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If the number doesn't start with the country code (972 for Israel),
    // and starts with 0, replace the leading 0 with 972
    if (!cleaned.startsWith("972") && cleaned.startsWith("0")) {
      cleaned = "972" + cleaned.substring(1);
    }

    // Ensure it has the + prefix for international format
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  };

  // Send WhatsApp message directly through API
  const sendWhatsAppNotification = async (
    recipientPhone,
    name,
    date,
    time,
    isCancellation = false
  ) => {
    try {
      // Validate all required fields before making the API call
      if (!recipientPhone || !name || !date || !time) {
        console.warn("Missing required fields for WhatsApp message", {
          recipientPhone,
          name,
          date,
          time,
        });
        return {
          success: false,
          error: "חסרים שדות חובה לשליחת ההודעה",
        };
      }

      // Format phone number to international format if needed
      const formattedPhone = formatPhoneNumber(recipientPhone);

      // Use absolute path for the API endpoint
      const apiUrl = `${window.location.origin}/api/send-sms`;

      console.log("WhatsApp API URL:", apiUrl); // Add debugging log

      // Call the API route
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientPhone: formattedPhone,
          name,
          date,
          time,
          isCancellation,
          sendToAdmin: true,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Handle the case where the user hasn't opted in for WhatsApp
        if (result.isNotOptedIn) {
          console.warn(
            "Phone number is not opted in for WhatsApp:",
            formattedPhone
          );
          return {
            success: false,
            error: "מספר הטלפון לא נרשם לקבלת הודעות WhatsApp",
            isNotOptedIn: true,
          };
        }

        throw new Error(result.error || "שליחת ההודעה נכשלה");
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return { success: false, error: error.message };
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

      let successMessage = "התור נקבע בהצלחה!";

      // Send WhatsApp to user
      const userWhatsAppResult = await sendWhatsAppNotification(
        user.phone,
        user.name,
        formatDate(bookedAppointment.date),
        bookedAppointment.time,
        false // Not a cancellation
      );

      // Check if WhatsApp sending failed
      if (!userWhatsAppResult.success) {
        console.warn(
          "Failed to send WhatsApp to user:",
          userWhatsAppResult.error
        );

        // If the issue is with not being opted in, provide a specific message
        if (userWhatsAppResult.isNotOptedIn) {
          successMessage +=
            " אך לא הצלחנו לשלוח הודעת WhatsApp לאישור (מספר הטלפון לא רשום לקבלת הודעות).";
        } else {
          successMessage += " אך לא הצלחנו לשלוח הודעת WhatsApp לאישור.";
        }
      } else {
        successMessage += " נשלחה הודעת WhatsApp עם פרטי התור.";
      }

      setSuccess(successMessage);

      // Remove booked appointment from available list
      setAvailableAppointments(
        availableAppointments.filter((app) => app.id !== appointmentId)
      );

      // Refresh user appointments to show the newly booked one
      fetchUserAppointments();
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError(error.message || "שגיאה בקביעת התור");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");

    if (!window.confirm("האם את בטוחה שברצונך לבטל תור זה?")) {
      return;
    }

    try {
      // Find the appointment details before canceling
      const appointmentToCancel = userAppointments.find(
        (app) => app.id === appointmentId
      );

      if (!appointmentToCancel) {
        throw new Error("לא ניתן למצוא את פרטי התור");
      }

      // Cancel the appointment in the database
      await cancelAppointment(appointmentId);

      // Prepare the success message
      let successMessage = "התור בוטל בהצלחה!";

      // Send WhatsApp notification to user about cancellation
      const userWhatsAppResult = await sendWhatsAppNotification(
        user.phone,
        user.name,
        formatDate(appointmentToCancel.date),
        appointmentToCancel.time,
        true // Is a cancellation
      );

      // Check if WhatsApp sending failed
      if (!userWhatsAppResult.success) {
        console.warn(
          "Failed to send WhatsApp cancellation to user:",
          userWhatsAppResult.error
        );

        // If the issue is with not being opted in, provide a specific message
        if (userWhatsAppResult.isNotOptedIn) {
          successMessage +=
            " אך לא הצלחנו לשלוח הודעת WhatsApp לאישור (מספר הטלפון לא רשום לקבלת הודעות).";
        } else {
          successMessage += " אך לא הצלחנו לשלוח הודעת WhatsApp לאישור.";
        }
      } else {
        successMessage += " נשלחה הודעת WhatsApp עם אישור הביטול.";
      }

      setSuccess(successMessage);

      // Refresh both appointment lists
      fetchAppointments();
      fetchUserAppointments();
    } catch (error) {
      console.error("Error canceling appointment:", error);
      setError(error.message || "שגיאה בביטול התור");
    }
  };

  // Helper function to check if appointment is within 24 hours
  const isWithin24Hours = (dateString, timeString) => {
    const appointmentDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffHours = (appointmentDateTime - now) / (1000 * 60 * 60);
    return diffHours < 24;
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
          <h1 className="text-2xl font-bold text-pink-600">תורים</h1>
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

        {/* User's booked appointments section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-pink-600 mb-4">
            התורים שלי
          </h2>

          {isLoadingUserAppointments ? (
            <div className="text-center py-4">
              <div className="text-pink-500">טוען...</div>
            </div>
          ) : userAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-gray-600">אין לך תורים מוזמנים כרגע</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-md p-4 border-r-4 border-pink-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg text-gray-800">
                        {formatDate(appointment.date)}
                      </div>
                      <div className="text-gray-600">
                        שעה: {appointment.time}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                        מוזמן
                      </div>
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={isWithin24Hours(
                          appointment.date,
                          appointment.time
                        )}
                        className={`px-3 py-1 text-xs cursor-pointer rounded-md transition-colors ${
                          isWithin24Hours(appointment.date, appointment.time)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                        title={
                          isWithin24Hours(appointment.date, appointment.time)
                            ? "לא ניתן לבטל תור פחות מ-24 שעות לפני מועד התור"
                            : "ביטול תור"
                        }
                      >
                        ביטול תור
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available appointments section */}
        <h2 className="text-xl font-semibold text-pink-600 mb-4">
          תורים זמינים
        </h2>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-pink-600">טוען תורים זמינים...</div>
            </div>
          ) : availableAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">אין תורים זמינים כרגע</p>
              <p className="text-sm text-gray-500 mt-2">
                נסי לבדוק שוב מאוחר יותר
              </p>
            </div>
          ) : (
            availableAppointments.map((appointment) => (
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
                  </div>
                  <button
                    onClick={() => handleBookAppointment(appointment.id)}
                    className="px-4 py-2 cursor-pointer bg-pink-600 text-white text-sm font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
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
