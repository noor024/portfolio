require("dotenv").config();

const bcrypt = require("bcryptjs");
const sequelize = require("./config/database");
const Admin = require("./models/Admin");

async function resetAdmin() {
  try {
    await sequelize.authenticate();

    const email = "admin@gmail.com";
    const password = "Noor@12345";

    const admin = await Admin.findOne({
      where: { email },
    });

    if (!admin) {
      console.log("Admin not found ❌");
      await sequelize.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    admin.password = hashedPassword;
    admin.email = email;
    admin.role = "admin";

    await admin.save();

    console.log("");
    console.log("================================");
    console.log("ADMIN PASSWORD RESET SUCCESS ✅");
    console.log("================================");
    console.log("Email: admin@gmail.com");
    console.log("Password: Noor@12345");
    console.log("================================");

    await sequelize.close();
  } catch (error) {
    console.error("Reset error ❌");
    console.error(error);
    await sequelize.close();
  }
}

resetAdmin();