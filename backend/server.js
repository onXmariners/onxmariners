const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');

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

// ================== CONTACT ==================
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

// ================== REPLY ==================
app.post("/api/reply", async (req, res) => {
  try {
    if (req.query.key !== "admin123") {
      return res.status(403).json({ error: "Unauthorized" });
    }

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

// ================== CRUD ==================
app.get("/api/messages", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);
  const data = await Message.find().sort({ createdAt: -1 });
  res.json(data);
});

app.delete("/api/delete/:id", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);
  await Message.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.put("/api/read/:id", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);
  await Message.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

// ================== TEMPLATE ==================
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