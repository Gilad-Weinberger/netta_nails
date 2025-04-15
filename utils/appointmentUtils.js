// Utility functions for appointments
import { db } from "@/firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";

/**
 * Get all available appointments
 * @returns {Promise<Array>} - Array of available appointments
 */
export async function getAvailableAppointments() {
  try {
    const appointmentsRef = collection(db, "appointments");
    // Using a simpler query that doesn't require a composite index
    // We'll filter and sort the results in memory after fetching
    const q = query(appointmentsRef, where("status", "==", "available"));

    const querySnapshot = await getDocs(q);
    const appointments = [];
    const today = new Date().toISOString().split("T")[0];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include appointments with dates in the future
      if (data.date >= today) {
        appointments.push({
          id: doc.id,
          ...data,
        });
      }
    });

    // Sort the results manually
    return appointments.sort((a, b) => {
      // First sort by date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // If dates are the same, sort by time
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.error("Error fetching available appointments:", error);
    throw error;
  }
}

/**
 * Get all appointments (for admin)
 * @returns {Promise<Array>} - Array of all appointments
 */
export async function getAllAppointments() {
  try {
    const appointmentsRef = collection(db, "appointments");
    // Using a simpler query that doesn't require a composite index
    const q = query(appointmentsRef);

    const querySnapshot = await getDocs(q);
    const appointments = [];
    const today = new Date().toISOString().split("T")[0];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include appointments with dates in the future
      if (data.date >= today) {
        appointments.push({
          id: doc.id,
          ...data,
        });
      }
    });

    // Sort the results manually
    return appointments.sort((a, b) => {
      // First sort by date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // If dates are the same, sort by time
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    throw error;
  }
}

/**
 * Get a user's booked appointments
 * @param {string} uid - User ID
 * @returns {Promise<Array>} - Array of user's appointments
 */
export async function getUserAppointments(uid) {
  try {
    const appointmentsRef = collection(db, "appointments");
    // Using a simpler query that only requires a basic index
    const q = query(appointmentsRef, where("bookedBy.uid", "==", uid));

    const querySnapshot = await getDocs(q);
    const appointments = [];
    const today = new Date().toISOString().split("T")[0];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include appointments with dates in the future
      if (data.date >= today) {
        appointments.push({
          id: doc.id,
          ...data,
        });
      }
    });

    // Sort the results manually
    return appointments.sort((a, b) => {
      // First sort by date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // If dates are the same, sort by time
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    throw error;
  }
}

/**
 * Book an appointment
 * @param {string} appointmentId - Appointment ID
 * @param {Object} user - User details (name, phone, uid)
 * @returns {Promise<Object>} - Updated appointment
 */
export async function bookAppointment(appointmentId, user) {
  const appointmentRef = doc(db, "appointments", appointmentId);
  const appointmentDoc = await getDoc(appointmentRef);

  if (!appointmentDoc.exists()) {
    throw new Error("Appointment not found");
  }

  const appointmentData = appointmentDoc.data();

  // Check if appointment is available
  if (appointmentData.status !== "available") {
    throw new Error("Appointment is already booked");
  }

  // Check if appointment is at least 24 hours in the future
  const appointmentDateTime = new Date(
    `${appointmentData.date}T${appointmentData.time}`
  );
  const now = new Date();
  const diffHours = (appointmentDateTime - now) / (1000 * 60 * 60);

  if (diffHours < 24) {
    throw new Error("Appointments must be booked at least 24 hours in advance");
  }

  // Update appointment status to booked
  await updateDoc(appointmentRef, {
    status: "booked",
    bookedBy: {
      uid: user.uid,
      name: user.name,
      phone: user.phone,
    },
    bookedAt: new Date().toISOString(),
  });

  // Get updated appointment
  const updatedAppointment = await getDoc(appointmentRef);

  return {
    id: updatedAppointment.id,
    ...updatedAppointment.data(),
  };
}

/**
 * Create a new appointment (admin only)
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<Object>} - Created appointment
 */
export async function createAppointment(appointmentData) {
  const appointmentsRef = collection(db, "appointments");

  const newAppointment = await addDoc(appointmentsRef, {
    ...appointmentData,
    status: "available",
    createdAt: new Date().toISOString(),
  });

  // Get created appointment
  const appointmentDoc = await getDoc(newAppointment);

  return {
    id: appointmentDoc.id,
    ...appointmentDoc.data(),
  };
}

/**
 * Delete an appointment (admin only)
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteAppointment(appointmentId) {
  const appointmentRef = doc(db, "appointments", appointmentId);
  await deleteDoc(appointmentRef);
  return true;
}
