import axios from "axios";
import qs from "qs";

// UltraMsg configuration
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID; // Hardcoded for testing - use process.env in production
const ULTRAMSG_API_TOKEN = process.env.ULTRAMSG_API_TOKEN; // Hardcoded for testing - use process.env in production
const ULTRAMSG_BASE_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}`;

// Admin phone number
const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE; // Replace with your actual admin phone number

/**
 * Server-side function to send WhatsApp notification
 */
async function sendWhatsApp(
  recipientPhone,
  name,
  date,
  time,
  isCancellation = false
) {
  try {
    // Determine the message based on whether it's a booking or cancellation
    const message = isCancellation
      ? `תור ללק ג'ל ל-${name} בתאריך ${date} בשעה ${time} בוטל.`
      : `תור ללק ג'ל ל-${name} נקבע לתאריך ${date} בשעה ${time}.`;

    console.log(
      `Sending ${
        isCancellation ? "cancellation" : "booking"
      } WhatsApp to ${recipientPhone}: "${message}"`
    );

    // Using the new axios implementation
    var data = qs.stringify({
      "token": ULTRAMSG_API_TOKEN,
      "to": recipientPhone,
      "body": message
    });

    var config = {
      method: 'post',
      url: `${ULTRAMSG_BASE_URL}/messages/chat`,
      headers: {  
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const response = await axios(config);
    console.log("UltraMsg API response:", JSON.stringify(response.data));

    // UltraMsg API returns different status formats
    // Sometimes it's { sent: true, message: "ok" } or 
    // { status: "success", id: "..." }
    if (
      (response.data && response.data.status === "success") || 
      (response.data && response.data.sent === true) ||
      (response.data && response.data.message === "ok")
    ) {
      return { 
        success: true, 
        messageId: response.data.id || response.data.message || "sent" 
      };
    } else {
      throw new Error(
        response.data?.message || response.data?.error || "Failed to send WhatsApp message"
      );
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    console.log("WhatsApp API endpoint called");

    const body = await request.json();
    console.log("Request body:", body);

    const { recipientPhone, name, date, time, isCancellation, sendToAdmin } =
      body;

    // Validate required fields
    if (!recipientPhone || !name || !date || !time) {
      console.error("Missing required fields:", {
        recipientPhone,
        name,
        date,
        time,
      });
      return Response.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Send WhatsApp message to the recipient
    const result = await sendWhatsApp(
      recipientPhone,
      name,
      date,
      time,
      isCancellation === true
    );

    // If sendToAdmin flag is true, also send a message to the admin
    if (sendToAdmin === true && ADMIN_PHONE) {
      try {
        console.log("Sending notification to admin:", ADMIN_PHONE);
        await sendWhatsApp(
          ADMIN_PHONE,
          name,
          date,
          time,
          isCancellation === true
        );
      } catch (adminError) {
        console.error("Failed to send admin notification:", adminError);
        // Continue even if admin notification fails
      }
    }

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error in WhatsApp API route:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
