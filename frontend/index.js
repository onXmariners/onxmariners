const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

// Configure your Gmail transporter (same as before)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

exports.contactForm = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, projectType, message } = req.body;
    if (!name || !email || !projectType || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: functions.config().email.recipient,
      subject: `New inquiry from ${name} - ${projectType}`,
      text: `Name: ${name}\nEmail: ${email}\nProject Type: ${projectType}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Project Type:</strong> ${projectType}</p>
             <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Email error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
});