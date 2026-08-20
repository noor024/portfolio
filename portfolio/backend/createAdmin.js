require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("./config/database");
const Admin = require("./models/Admin");

async function createAdmin() {
  try {
    await sequelize.authenticate();

    console.log("Database connected ✅");

    // ==========================================
    // ADMIN DETAILS FROM .ENV
    // ==========================================

    const adminName = process.env.ADMIN_NAME || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // ==========================================
    // CHECK ENV
    // ==========================================

    if (!adminEmail || !adminPassword) {
      console.error(
        "ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env ❌"
      );

      await sequelize.close();
      process.exit(1);
    }

    // ==========================================
    // CHECK EXISTING ADMIN
    // ==========================================

    const existingAdmin = await Admin.findOne({
      where: {
        email: adminEmail.toLowerCase().trim(),
      },
    });

    if (existingAdmin) {
      console.log("Admin already exists ✅");
      console.log(`Email: ${adminEmail}`);

      await sequelize.close();
      process.exit(0);
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      12
    );

    // ==========================================
    // CREATE ADMIN
    // ==========================================

    await Admin.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
    });

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log("");
    console.log("=================================");
    console.log("Admin created successfully ✅");
    console.log("=================================");
    console.log(`Name: ${adminName}`);
    console.log(`Email: ${adminEmail}`);
    console.log("Password: Taken from .env 🔐");
    console.log("=================================");
    console.log("");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Admin creation error ❌");
    console.error(error.message);

    await sequelize.close();
    process.exit(1);
  }
}

createAdmin();