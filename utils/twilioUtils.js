// Utility functions for Twilio SMS

/**
 * Send SMS notification about appointment booking via the API route
 * @param {string} recipientPhone - Phone number to send SMS to
 * @param {string} name - Customer name
 * @param {string} date - Appointment date
 * @param {string} time - Appointment time
 */
export async function sendAppointmentSMS(recipientPhone, name, date, time) {
  try {
    const response = await fetch("/api/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientPhone,
        name,
        date,
        time,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to send SMS");
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}
