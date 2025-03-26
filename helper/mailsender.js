import db from "../database/database.js";
import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, emailType, userId }) => {
  // if (email) {
  const hashCode = Math.floor(100000 + Math.random() * 900000)
  const tokenExpiry = new Date(Date.now() + 3600000);

  // Convert to MySQL-compatible DATETIME format (YYYY-MM-DD HH:MM:SS)
  const tokenExpiryFormatted = tokenExpiry.toISOString().slice(0, 19).replace('T', ' ');


  if (emailType === 'VERIFY') {
    await db.query('UPDATE users SET verifyToken=? , verifyTokenExpiry=? WHERE id=?', [hashCode, tokenExpiryFormatted, userId])
  } else if (emailType === "RESET") {
    await db.query('UPDATE users SET forgetPasswordToken = ?, forgetPasswordTokenExpiry = ? WHERE id = ?', [hashCode, tokenExpiryFormatted, userId]);
  }
  
  var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "49b8d0cf0a190e",
      pass: "43a42322805a00"
    }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailType === "VERIFY" ? "Email Verification" : "Password Reset"}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .email-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .email-header h1 {
            font-size: 24px;
            color: #333;
            margin: 0;
          }
          .email-body {
            font-size: 16px;
            line-height: 1.6;
          }
          .verification-code {
            display: inline-block;
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            background-color: #4CAF50;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .email-footer {
            text-align: center;
            font-size: 12px;
            color: #888;
            margin-top: 20px;
          }
          .email-footer a {
            color: #4CAF50;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>${emailType === "VERIFY" ? "Welcome to Our Service" : "Password Reset Request"}</h1>
          </div>
          <div class="email-body">
            <p>Hello,</p>
            <p>${emailType === "VERIFY" ? "We have received a request to verify your email address. Please use the following code to complete the verification:" : "We received a request to reset your password. Please use the following code to reset it:"}</p>
            
            <div class="verification-code">
              ${hashCode}
            </div>
  
            <p>This code is valid for the next 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
          <div class="email-footer">
            <p>If you have any questions, feel free to <a href="mailto:support@example.com">contact our support team</a>.</p>
            <p>&copy; 2024 Our Service. All Rights Reserved.</p>
          </div>
        </div>
      </body>
    </html>`;

  // const response = await resend.emails.send({
  //     from: `"MYCKAh Support" <info@mirfah.com>`,
  //     to: email,
  //     subject: emailType === "VERIFY" ? "Email Verification" : "Reset Password",
  //     html: htmlContent,
  // })


  // Send email using Nodemailer
  const mailOptions = {
    from: `"MYCKAh Support" <alinoumanriaz@gmail.com>`, // Sender address
    to: email, // Recipient address
    subject: emailType === "VERIFY" ? "Email Verification" : "Reset Password", // Email subject
    html: htmlContent, // HTML content
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}