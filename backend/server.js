const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose'); // ✅ FIXED

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));


// ================== DATABASE CONNECTION ==================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));


// ================== SCHEMA ==================
const MessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  projectType: String,
  message: String,
  read: {type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", MessageSchema);


// ================== EMAIL SETUP (OPTIONAL) ==================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  connectionTimeout: 20000,
  socketTimeout: 20000,
});


// ================== CONTACT API ==================
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, projectType, message } = req.body;

    // ✅ Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    // ✅ 1. Save to DB (MAIN SYSTEM)
    await Message.create({
      name,
      email,
      projectType,
      message
    });

    console.log("✅ Message saved to DB");

    // ✅ 2. Try sending email (OPTIONAL)
    app.get("/api/messages", async (req, res) => {
  if (req.query.key !== "admin123") {
    return res.status(403).send("Unauthorized");
  }

  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

    res.status(200).json({
      success: true,
      message: "Message received successfully"
    });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// ================== REPLY API (OPTIONAL) ==================

app.post("/api/reply", async (req, res) => {
  try {
    if (req.query.key !== "admin123") return res.sendStatus(403);

    const { to, message } = req.body;

    await transporter.sendMail({
      from: `"OnX Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Reply from OnX Team",
      html: `<p>${message}</p>`
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});


// ================== FETCH MESSAGES ==================
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});


app.get("/api/messages", async (req, res) => {
  if (req.query.key !== "admin123") {
    return res.status(403).send("Unauthorized");
  }

  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

// ----- delete ApI  functions  -------

// DELETE

// DELETE API
app.delete("/api/delete/:id", async (req, res) => {
  try {
    if (req.query.key !== "admin123") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await Message.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// MARK READ API
app.put("/api/read/:id", async (req, res) => {
  try {
    if (req.query.key !== "admin123") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await Message.findByIdAndUpdate(req.params.id, { read: true });

    if (!result) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ----- restore with in 5 sec api -------
app.post("/api/restore", async (req, res) => {
  if (req.query.key !== "admin123") return res.sendStatus(403);

  await Message.create(req.body);
  res.json({ success: true });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));