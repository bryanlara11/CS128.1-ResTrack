const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const notificationsRoutes = require("./routes/notifications");
const studiesRoutes = require("./routes/studies");
const dashboardRoutes = require("./routes/dashboard");
const usersRoutes = require("./routes/users");

const app = express();

// Middleware
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"] }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/studies", studiesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "ResTrack API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
