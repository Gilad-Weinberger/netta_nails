"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAllAppointments,
  createAppointment,
  deleteAppointment,
} from "@/utils/appointmentUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  // New appointment form state
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(90); // Default duration is 90 minutes

  // Filter states
  const [showAll, setShowAll] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  // Redirect non-admin users to appointments page
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.push("/appointments");
    }
  }, [loading, user, isAdmin, router]);

  // Fetch all appointments
  useEffect(() => {
    if (user && isAdmin) {
      fetchAppointments();
    }
  }, [user, isAdmin]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const appointmentsData = await getAllAppointments();
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("שגיאה בטעינת התורים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!date || !time) {
      setError("אנא מלאי את כל השדות הנדרשים");
      return;
    }

    try {
      // Format date to YYYY-MM-DD
      const formattedDate = date.toISOString().split("T")[0];

      await createAppointment({
        date: formattedDate,
        time,
        duration: Number(duration),
      });

      setSuccess("התור נוצר בהצלחה");
      setShowForm(false);

      // Reset form
      setDate(new Date());
      setTime("");
      setDuration(90);

      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error("Error creating appointment:", error);
      setError(error.message || "שגיאה ביצירת התור");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (
      !window.confirm(
        "האם את בטוחה שברצונך למחוק תור זה?".replace(/"/g, "&quot;")
      )
    ) {
      return;
    }

    try {
      await deleteAppointment(appointmentId);
      setSuccess("התור נמחק בהצלחה");

      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setError(error.message || "שגיאה במחיקת התור");
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

  const filteredAppointments = showAll
    ? appointments
    : appointments.filter((app) => app.status === "available");

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-xl font-semibold text-pink-600">טוען...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-xl font-semibold text-red-600">
          אין לך הרשאות לצפות בדף זה
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50 py-4 px-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-pink-600 mb-4 sm:mb-0">
            ניהול תורים
          </h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-pink-600 hover:text-pink-800 bg-white py-2 px-4 rounded-md shadow-sm self-start sm:self-auto"
          >
            התנתקי
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="text-gray-700">
            שלום <span className="font-semibold">{user.name}</span> (מנהלת)
          </div>
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

        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors w-full sm:w-auto"
          >
            {showForm ? "ביטול" : "הוספת תור חדש"}
          </button>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAll(true)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showAll
                  ? "bg-pink-600 text-white"
                  : "bg-white text-pink-600 border border-pink-600"
              }`}
            >
              כל התורים
            </button>
            <button
              onClick={() => setShowAll(false)}
              className={`px-4 py-2 rounded-md transition-colors ${
                !showAll
                  ? "bg-pink-600 text-white"
                  : "bg-white text-pink-600 border border-pink-600"
              }`}
            >
              זמינים בלבד
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              הוספת תור חדש
            </h2>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך
                </label>
                <DatePicker
                  selected={date}
                  onChange={setDate}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholderText="בחרי תאריך"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שעה
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="08:00"
                  max="20:00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  משך (בדקות)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={30}
                  step={15}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
              >
                יצירת תור
              </button>
            </form>
          </div>
        )}

        {/* Responsive table for appointments */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop table view - hidden on mobile */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-pink-100">
                <tr>
                  <th className="px-4 py-2 text-right">תאריך</th>
                  <th className="px-4 py-2 text-right">שעה</th>
                  <th className="px-4 py-2 text-right">משך</th>
                  <th className="px-4 py-2 text-right">סטטוס</th>
                  <th className="px-4 py-2 text-right">נקבע ע&quot;י</th>
                  <th className="px-4 py-2 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-pink-600"
                    >
                      טוען תורים...
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      אין תורים להצגה
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-gray-200 hover:bg-pink-50"
                    >
                      <td className="px-4 py-3">
                        {formatDate(appointment.date)}
                      </td>
                      <td className="px-4 py-3">{appointment.time}</td>
                      <td className="px-4 py-3">
                        {appointment.duration || 90} דקות
                      </td>
                      <td className="px-4 py-3">
                        {appointment.status === "available" ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            זמין
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            תפוס
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {appointment.status === "booked" &&
                        appointment.bookedBy ? (
                          <div>
                            <div className="font-semibold">
                              {appointment.bookedBy.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.bookedBy.phone}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            handleDeleteAppointment(appointment.id)
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          מחיקה
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card view - shown only on mobile */}
          <div className="md:hidden">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-pink-600">
                טוען תורים...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                אין תורים להצגה
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 hover:bg-pink-50">
                    <div className="flex justify-between mb-2">
                      <div className="font-semibold">
                        {formatDate(appointment.date)}
                      </div>
                      {appointment.status === "available" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          זמין
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          תפוס
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="text-gray-600">שעה:</div>
                      <div>{appointment.time}</div>

                      <div className="text-gray-600">משך:</div>
                      <div>{appointment.duration || 90} דקות</div>

                      {appointment.status === "booked" &&
                        appointment.bookedBy && (
                          <>
                            <div className="text-gray-600">נקבע ע&quot;י:</div>
                            <div>
                              <div className="font-semibold">
                                {appointment.bookedBy.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.bookedBy.phone}
                              </div>
                            </div>
                          </>
                        )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm"
                      >
                        מחיקה
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
