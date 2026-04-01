const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const { Resend } = require('resend');

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

console.log("RESEND KEY:", process.env.RESEND_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ================== DB ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// ================== SCHEMA ==================
const MessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  projectType: String,
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);

// ================== EMAIL ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// ================== CONTACT ==================

app.post("/api/reply", async (req, res) => {
  try {
    if (req.query.key !== "admin123") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Recipient required" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    await resend.emails.send({
      from: "OnXmariners <onboarding@resend.dev>", // temp sender
      to: to,
      subject: subject || "Reply from OnXmariners",
      html: getEmailTemplate(message)
    });

    res.json({ success: true });

  } catch (err) {
    console.error("RESEND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================== FETCH ==================
app.get("/api/messages", async (req, res) => {
  if (req.query.key !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

// ================== DELETE ==================
app.delete("/api/delete/:id", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);

  await Message.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ================== MARK READ ==================
app.put("/api/read/:id", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);

  await Message.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

// ================== RESTORE ==================
app.post("/api/restore", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);

  await Message.create(req.body);
  res.json({ success: true });
});

// ================== REPLY ==================
app.post("/api/reply", async (req, res) => {
  try {
    if (req.query.key !== "admin123") return res.sendStatus(403);

    const { to, subject, message } = req.body;

    console.log("Reply Request:", req.body);

    if (!to) {
      return res.status(400).json({ error: "No recipient email" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    await transporter.sendMail({
      from: `"OnXmariners Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || "Reply from OnXmariners",
      html: `<p>${message}</p>`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("REPLY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

function getEmailTemplate(message) {
  return `
  <div style="
    font-family: Arial, sans-serif;
    background:#f9fafb;
    padding:20px;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:white;
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 5px 20px rgba(0,0,0,0.1);
    ">

      <!-- Header -->
      <div style="
        background:#000;
        color:#fbbf24;
        padding:15px;
        font-size:20px;
        font-weight:bold;
      ">
        🚀 OnXmariners
      </div>

      <!-- Body -->
      <div style="padding:20px; color:#333;">
        <h3>Hello 👋</h3>

        <p>${message}</p>

        <br>

        <p style="color:gray;">
          This message was sent from OnXmariners team.
        </p>
      </div>

      <!-- Footer -->
      <div style="
        background:#f3f4f6;
        padding:15px;
        font-size:12px;
        color:gray;
        text-align:center;
      ">
        © 2026 OnXmariners. All rights reserved.
      </div>

    </div>

  </div>
  `;
}

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));