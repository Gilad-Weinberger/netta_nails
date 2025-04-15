// Utility functions for Twilio SMS
import twilio from "twilio";

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS notification about appointment booking
 * @param {string} recipientPhone - Phone number to send SMS to
 * @param {string} name - Customer name
 * @param {string} date - Appointment date
 * @param {string} time - Appointment time
 */
export async function sendAppointmentSMS(recipientPhone, name, date, time) {
  try {
    const message = await twilioClient.messages.create({
      body: `תור ללק ג'ל ל-${name} נקבע לתאריך ${date} בשעה ${time}.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipientPhone,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}
