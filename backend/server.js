console.log("server.js loaded");
// Entry point for the backend server
const express = require("express");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

//const adminRoutes = require('../routes/admin.route');
const candidateRoutes = require("./routes/candidate.route");
const adminRoutes = require("./routes/admin"); // Uncomment if admin routes are needed

const app = express();
app.disable("x-powered-by"); // ✅ Removes X-Powered-By header
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://13.201.44.91",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  })
);

app.use(helmet()); // Adds X-Frame-Options: DENY and more
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
  next();
});

// app.use('/api/v1/admin', adminRoutes);
app.use("/api/v1/candidate", candidateRoutes);
app.use("/api/v1/admin", adminRoutes); // Uncomment if admin routes are needed

app.get("/test-api", (req, res) => {
  res.json({ message: "Server is working!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
