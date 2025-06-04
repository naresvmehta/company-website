const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendEnquiryMail = async (contact, phone, formattedDate) => {
  const mailOptions = {
    from: `"Patil Machines – Website Enquiry" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    replyTo: contact.email,
    subject: `New Enquiry from ${contact.name} – ${contact.inquiryType}`,
    html: `
      <div style="max-width:600px; margin:auto; font-family:Arial, sans-serif; border:1px solid #e0e0e0; border-radius:10px; overflow:hidden;">
        <div style="background-color:#2e7d32; color:white; padding:20px; text-align:center;">
          <h2 style="margin:0;">Patil Machines Pvt Ltd</h2>
          <p style="margin:5px 0;">New Customer Enquiry Received</p>
        </div>
        <div style="padding:20px; background-color:#ffffff;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:8px; font-weight:bold; color:#2e7d32;">Name:</td>
              <td style="padding:8px;">${contact.name}</td>
            </tr>
            <tr style="background-color:#f9f9f9;">
              <td style="padding:8px; font-weight:bold; color:#2e7d32;">Email:</td>
              <td style="padding:8px;">${contact.email}</td>
            </tr>
            <tr>
              <td style="padding:8px; font-weight:bold; color:#2e7d32;">Phone:</td>
              <td style="padding:8px;">${phone}</td>
            </tr>
            <tr style="background-color:#f9f9f9;">
              <td style="padding:8px; font-weight:bold; color:#2e7d32;">Inquiry Type:</td>
              <td style="padding:8px;">${contact.inquiryType}</td>
            </tr>
            <tr>
              <td style="padding:8px; font-weight:bold; color:#2e7d32;">Message:</td>
              <td style="padding:8px;">${contact.note}</td>
            </tr>
            <tr style="background-color:#f9f9f9;">
              <td style="padding:8px; font-weight:bold; color:#2e7d32;">Submitted On:</td>
              <td style="padding:8px;">${formattedDate}</td>
            </tr>
          </table>
        </div>
        <div style="background-color:#e8f5e9; padding:10px; text-align:center; font-size:12px; color:#555;">
          This enquiry was submitted via the official website of Patil Machines Pvt Ltd.<br/>
          📄 <a href="https://docs.google.com/spreadsheets/d/1aKY_WmgJ25OUOIZ2MsRpdQRjmAdHFUWL5FZvEyNOKlo/edit?usp=sharing" target="_blank" style="color:#2e7d32;">View Full Enquiry Record in Google Sheet</a>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEnquiryMail;
