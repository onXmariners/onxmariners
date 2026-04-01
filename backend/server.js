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

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  resend = new Resend(process.env.RESEND_API_KEY);

  console.log("✅ Resend initialized");

} catch (err) {
  console.error("❌ Resend setup failed:", err.message);
}

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

// ================== CONTACT SAVE ==================
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

// ================== REPLY (RESEND ONLY) ==================
app.post("/api/reply", async (req, res) => {
  try {
    if (req.query.key !== "admin123") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!resend) {
      return res.status(500).json({ error: "Email service not ready" });
    }

    const { to, subject, message } = req.body;

    console.log("Reply Request:", req.body);

    if (!to) {
      return res.status(400).json({ error: "No recipient email" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    await resend.emails.send({
      from: "OnXmariners <onboarding@resend.dev>",
      to,
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

// ================== TEMPLATE ==================
function getEmailTemplate(message) {
  return `
  <div style="font-family: Arial; background:#f9fafb; padding:20px;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden;">
      <div style="background:#000;color:#fbbf24;padding:15px;font-size:20px;">
        🚀 OnXmariners
      </div>
      <div style="padding:20px;">
        <p>${message}</p>
      </div>
      <div style="background:#eee;padding:10px;text-align:center;font-size:12px;">
        © OnXmariners
      </div>
    </div>
  </div>
  `;
}

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));