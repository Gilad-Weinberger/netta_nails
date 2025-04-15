import twilio from "twilio";

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Server-side function to send SMS notification about appointment booking
 */
async function sendSMS(recipientPhone, name, date, time) {
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

export async function POST(request) {
  try {
    const { recipientPhone, name, date, time } = await request.json();

    // Validate required fields
    if (!recipientPhone || !name || !date || !time) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await sendSMS(recipientPhone, name, date, time);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return Response.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
