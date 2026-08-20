const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const sequelize = require("./config/database");

const adminRoutes = require("./routes/adminRoutes");
const projectRoutes = require("./routes/projectRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// ===============================
// SECURITY
// ===============================

app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// ===============================
// RATE LIMIT
// ===============================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// ===============================
// ROUTES
// ===============================

app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/settings", settingsRoutes);

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();

    res.json({
      success: true,
      message: "Portfolio backend is running 🚀",
      database: "PostgreSQL Connected ✅",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Database unavailable",
      database: "PostgreSQL Disconnected ❌",
    });
  }
});

// ===============================
// 404
// ===============================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((error, req, res, next) => {
  console.error("Server Error:", error.message);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ===============================
// DATABASE FIX
// ===============================

const fixAdminRoleColumn = async () => {
  try {
    console.log("Checking admins.role column...");

    // Remove old ENUM default
    await sequelize.query(`
      ALTER TABLE admins
      ALTER COLUMN role DROP DEFAULT;
    `);

    // Convert ENUM to VARCHAR
    await sequelize.query(`
      ALTER TABLE admins
      ALTER COLUMN role TYPE VARCHAR(20)
      USING role::text;
    `);

    // Add normal string default
    await sequelize.query(`
      ALTER TABLE admins
      ALTER COLUMN role SET DEFAULT 'admin';
    `);

    console.log("admins.role column fixed ✅");
  } catch (error) {
    // If already VARCHAR, don't stop server
    if (
      error.message.includes(
        "cannot be cast automatically"
      )
    ) {
      console.error(
        "Role column conversion still failed ❌"
      );
      throw error;
    }

    console.log(
      "Role column already fixed or does not need changes ✅"
    );
  }
};

// ===============================
// DATABASE CONNECTION
// ===============================

const connectDB = async () => {
  try {
    await sequelize.authenticate();

    console.log("PostgreSQL Connected ✅");

    // Fix old ENUM column before Sequelize sync
    await fixAdminRoleColumn();

    // IMPORTANT:
    // Do NOT use alter:true here because it is
    // causing the ENUM conversion problem.
    await sequelize.sync();

    console.log("Database synchronized ✅");
  } catch (error) {
    console.error(
      "PostgreSQL Connection Error ❌"
    );

    console.error(error.message);

    process.exit(1);
  }
};

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Backend running on http://localhost:${PORT}`
    );
  });
};

startServer();