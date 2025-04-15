import { sendAppointmentSMS } from "@/utils/twilioUtils";

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
    const result = await sendAppointmentSMS(recipientPhone, name, date, time);

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
