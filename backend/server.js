const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('./middleware/auth');  // <-- this is your JWT middleware

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ================== RESEND ==================
let resend;
try {
  const { Resend } = require("resend");
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("✅ Resend ready");
} catch (err) {
  console.error("❌ Resend error:", err.message);
}

// ================== DB ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// ================== SCHEMA ==================
const Message = mongoose.model("Message", new mongoose.Schema({
  name: String,
  email: String,
  projectType: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));

// ================== AUTH - LOGIN (PUBLIC) ==================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { email: process.env.ADMIN_EMAIL, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, message: 'Login successful' });
});

// ================== CONTACT (PUBLIC - NO AUTH) ==================
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, projectType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    await Message.create({ name, email, projectType, message });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

// ================== REPLY (PROTECTED - requires JWT) ==================
app.post("/api/reply", auth, async (req, res) => {
  try {
    // REMOVED the insecure key check
    const { to, subject, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Missing data" });
    }

    await resend.emails.send({
      from: "OnXPDF <business@onxpdf.com>",
      to,
      bcc: process.env.EMAIL_USER,
      reply_to: "business@onxpdf.com",
      subject: subject || "Reply from OnXPDF",
      html: getEmailTemplate(message)
    });

    res.json({ success: true });

  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================== GET MESSAGES (PROTECTED) ==================
app.get("/api/messages", auth, async (req, res) => {
  // REMOVED key check
  const data = await Message.find().sort({ createdAt: -1 });
  res.json(data);
});

// ================== DELETE MESSAGE (PROTECTED) ==================
app.delete("/api/delete/:id", auth, async (req, res) => {
  // REMOVED key check
  await Message.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ================== MARK AS READ (PROTECTED) ==================
app.put("/api/read/:id", auth, async (req, res) => {
  // REMOVED key check
  await Message.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

// ================== EMAIL TEMPLATE ==================
function getEmailTemplate(message) {
  return `
  <div style="font-family:Arial;background:#f9fafb;padding:20px">
    <div style="max-width:600px;margin:auto;background:white;border-radius:10px">
      <div style="background:black;color:#fbbf24;padding:15px">
        🚀 OnXPDF
      </div>
      <div style="padding:20px">
        <p>${message}</p>
      </div>
    </div>
  </div>`;
}

// ================== SERVER ==================
app.listen(process.env.PORT || 5000, () =>
  console.log("🚀 Server running")
);