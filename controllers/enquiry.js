const { google } = require('googleapis');
const sendEnquiryMail = require('../sendEnquiryMail.js'); 

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

module.exports.submitEnquiry = async (req, res) => {
  const backURL = req.body.fromPage || req.get("Referer") || '/home';

  try {
    const contact = req.body.contact || {};
    const phone = contact.phone || '';

    const now = new Date();
    const formattedDate = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const values = [[
      contact.name || '',
      contact.email || '',
      phone,
      contact.inquiryType || '',
      contact.note || '',
      formattedDate
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

// Flash message and session save
req.flash("success", "Thank you for contacting us! We'll get back to you shortly");

req.session.save(() => {
  res.redirect(backURL);  //Ensures flash mssgs are saved in sessions before redirecting
});

// Send email after response, non-blocking (Fire & Forget)
sendEnquiryMail(contact, phone, formattedDate)
  .then(() => console.log("Enquiry email sent"))
  .catch(err => console.error("Failed to send email:", err));


  } catch (error) {
    console.error('Error appending data to Google Sheet:', error);
    req.flash("error", "Something went wrong. Please try again later");
    res.redirect(backURL);
  }
};
