const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/admin");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "portfolio_admin_secret_change_this";

// ======================================================
// ADMIN AUTH MIDDLEWARE
// ======================================================

const authenticateAdmin = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Admin authentication required.",
      });
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin token is missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    const admin =
      await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Admin account not found.",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired admin session.",
    });
  }
};

// ======================================================
// ADMIN LOGIN
// ======================================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const admin =
        await Admin.findOne({
          where: {
            email: normalizedEmail,
          },
        });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          admin.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.json({
        success: true,
        message:
          "Admin login successful.",

        token,

        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to login.",
      });
    }
  }
);

// ======================================================
// GET CURRENT ADMIN
// ======================================================

router.get(
  "/me",
  authenticateAdmin,
  async (req, res) => {
    try {
      return res.json({
        success: true,

        admin: {
          id: req.admin.id,
          name: req.admin.name,
          email: req.admin.email,
          role: req.admin.role,
        },
      });
    } catch (error) {
      console.error(
        "Get admin error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to get admin information.",
      });
    }
  }
);

// ======================================================
// UPDATE ADMIN ACCOUNT
// NAME + EMAIL + PASSWORD
// ======================================================

router.put(
  "/account",
  authenticateAdmin,
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        currentPassword,
      } = req.body;

      // ==================================================
      // CURRENT PASSWORD REQUIRED
      // ==================================================

      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Current password is required.",
        });
      }

      // ==================================================
      // VERIFY CURRENT PASSWORD
      // ==================================================

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          req.admin.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect.",
        });
      }

      // ==================================================
      // NORMALIZE VALUES
      // ==================================================

      const newName =
        typeof name === "string"
          ? name.trim()
          : "";

      const newEmail =
        typeof email === "string"
          ? email
              .toLowerCase()
              .trim()
          : "";

      const newPassword =
        typeof password === "string"
          ? password
          : "";

      // ==================================================
      // CHECK CHANGES
      // ==================================================

      const nameChanged =
        newName &&
        newName !== req.admin.name;

      const emailChanged =
        newEmail &&
        newEmail !==
          req.admin.email
            .toLowerCase();

      const passwordChanged =
        Boolean(newPassword);

      if (
        !nameChanged &&
        !emailChanged &&
        !passwordChanged
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a new name, email or password.",
        });
      }

      // ==================================================
      // NAME VALIDATION
      // ==================================================

      if (nameChanged) {
        if (newName.length < 2) {
          return res.status(400).json({
            success: false,
            message:
              "Admin name must contain at least 2 characters.",
          });
        }

        if (newName.length > 100) {
          return res.status(400).json({
            success: false,
            message:
              "Admin name cannot exceed 100 characters.",
          });
        }

        req.admin.name = newName;
      }

      // ==================================================
      // EMAIL VALIDATION
      // ==================================================

      if (emailChanged) {
        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(newEmail)) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid email address.",
          });
        }

        const existingAdmin =
          await Admin.findOne({
            where: {
              email: newEmail,
            },
          });

        if (
          existingAdmin &&
          existingAdmin.id !==
            req.admin.id
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This email is already being used by another admin.",
          });
        }

        req.admin.email = newEmail;
      }

      // ==================================================
      // PASSWORD VALIDATION
      // ==================================================

      if (passwordChanged) {
        const strongPasswordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (
          !strongPasswordRegex.test(
            newPassword
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "New password must be at least 8 characters and include uppercase, lowercase, number and special character.",
          });
        }

        // ----------------------------------------------
        // DON'T ALLOW SAME PASSWORD
        // ----------------------------------------------

        const samePassword =
          await bcrypt.compare(
            newPassword,
            req.admin.password
          );

        if (samePassword) {
          return res.status(400).json({
            success: false,
            message:
              "New password must be different from your current password.",
          });
        }

        // ----------------------------------------------
        // HASH NEW PASSWORD
        // ----------------------------------------------

        req.admin.password =
          await bcrypt.hash(
            newPassword,
            12
          );
      }

      // ==================================================
      // SAVE ADMIN
      // ==================================================

      await req.admin.save();

      // ==================================================
      // CREATE NEW TOKEN
      // ==================================================

      const newToken = jwt.sign(
        {
          id: req.admin.id,
          email: req.admin.email,
          role: req.admin.role,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.json({
        success: true,

        message:
          "Admin account updated successfully.",

        token: newToken,

        admin: {
          id: req.admin.id,
          name: req.admin.name,
          email: req.admin.email,
          role: req.admin.role,
        },
      });
    } catch (error) {
      console.error(
        "Admin account update error:",
        error
      );

      // Duplicate email safety
      if (
        error.name ===
        "SequelizeUniqueConstraintError"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This email is already being used.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update admin account.",
      });
    }
  }
);

// ======================================================
// LOGOUT
// ======================================================

router.post(
  "/logout",
  authenticateAdmin,
  async (req, res) => {
    return res.json({
      success: true,
      message:
        "Admin logged out successfully.",
    });
  }
);

module.exports = router;