const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.sendMail({
  from: `"Test" <${process.env.EMAIL_USER}>`,
  to: process.env.RECIPIENT_EMAIL,
  subject: 'Zoho test',
  text: 'If you see this, Zoho works!',
})
.then(() => console.log('Email sent!'))
.catch(err => console.error('Error:', err));