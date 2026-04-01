const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

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
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

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
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ error: "Failed" });
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

    console.log("Reply:", req.body);

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

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));