const { google } = require("googleapis");
const sendEnquiryMail = require("../sendEnquiryMail.js");

/**
 * Creates Google Sheets client lazily (IMPORTANT)
 * This avoids env / startup timing issues
 */
function getSheetsClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  return google.sheets({ version: "v4", auth });
}

module.exports.submitEnquiry = async (req, res) => {
  const backURL = req.body.fromPage || req.get("Referer") || "/home";

  try {
    console.log("➡️ Enquiry controller hit");

    const contact = req.body.contact || {};
    const phone = contact.phone || "";

    const now = new Date();
    const formattedDate = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const values = [[
      contact.name || "",
      contact.email || "",
      phone,
      contact.inquiryType || "",
      contact.note || "",
      formattedDate
    ]];

    console.log("➡️ About to append to Google Sheets");
    console.log("Sheet ID:", process.env.GOOGLE_SHEET_ID);
    console.log("Service Email:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);

    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F", 
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log("✅ Google Sheets append response:", response.status);

    // Flash success message
    req.flash("success", "Thank you for contacting us! We'll get back to you shortly");

    /**
     * END RESPONSE CLEANLY
     * Any background work must be detached
     */
    return req.session.save(() => {
      res.redirect(backURL);

      //Fire-and-forget email (safe pattern)
      setImmediate(() => {
        sendEnquiryMail(contact, phone, formattedDate)
          .then(() => console.log("📧 Enquiry email sent"))
          .catch(err => console.error("❌ Email failed:", err));
      });
    });

  } catch (error) {
    console.error("❌ Error appending data to Google Sheet:", error);

    req.flash("error", "Something went wrong. Please try again later");

    return req.session.save(() => {
      res.redirect(backURL);
    });
  }
};
