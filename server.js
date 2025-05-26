const express = require('express');
const { google } = require('googleapis');

const path = require('path');


if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, ''))); //Acquiring CSS/JS files


// Middleware to parse urlencoded form data (from HTML form POST)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON data (if needed)
app.use(express.json());


const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // Correct env variable name
  null,
  // Replace literal \\n with actual newline characters in the private key
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets'] // scope for editing sheets
);

const sheets = google.sheets({ version: 'v4', auth });

app.post('/submit', async (req, res) => {
  try {
    const contact = req.body.contact || {};
    const phone = contact.phone || ''; // Fix: get phone from contact

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

    const values = [
      [
        contact.name || '',
        contact.email || '',
        phone,
        contact.inquiryType || '',
        contact.note || '',
         formattedDate
      ],
    ];

    console.log('Appending row:', values);  // Debug

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log("Form data appended successfully");
    // Send success response to frontend
    res.status(200).json({ success: true, message: "Data saved successfully" });
  } catch (error) {
    console.error('Error appending data to Google Sheet:', error);
    res.status(500).json({ success: false, message: "Failed to save data" });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
