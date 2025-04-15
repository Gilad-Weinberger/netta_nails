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
  const appointmentsRef = collection(db, "appointments");
  const q = query(
    appointmentsRef,
    where("status", "==", "available"),
    where("date", ">=", new Date().toISOString().split("T")[0]), // Only future dates
    orderBy("date"),
    orderBy("time")
  );

  const querySnapshot = await getDocs(q);
  const appointments = [];

  querySnapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return appointments;
}

/**
 * Get all appointments (for admin)
 * @returns {Promise<Array>} - Array of all appointments
 */
export async function getAllAppointments() {
  const appointmentsRef = collection(db, "appointments");
  const q = query(
    appointmentsRef,
    where("date", ">=", new Date().toISOString().split("T")[0]), // Only future dates
    orderBy("date"),
    orderBy("time")
  );

  const querySnapshot = await getDocs(q);
  const appointments = [];

  querySnapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return appointments;
}

/**
 * Get a user's booked appointments
 * @param {string} uid - User ID
 * @returns {Promise<Array>} - Array of user's appointments
 */
export async function getUserAppointments(uid) {
  const appointmentsRef = collection(db, "appointments");
  const q = query(
    appointmentsRef,
    where("bookedBy.uid", "==", uid),
    where("date", ">=", new Date().toISOString().split("T")[0]), // Only future dates
    orderBy("date"),
    orderBy("time")
  );

  const querySnapshot = await getDocs(q);
  const appointments = [];

  querySnapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return appointments;
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
