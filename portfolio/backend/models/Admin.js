const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin"),
      allowNull: false,
      defaultValue: "admin",
    },
  },
  {
    tableName: "admins",
    timestamps: true,
    hooks: {
      beforeValidate: (admin) => {
        if (admin.email) {
          admin.email = admin.email.toLowerCase().trim();
        }

        if (admin.name) {
          admin.name = admin.name.trim();
        }
      },
    },
  }
);

module.exports = Admin;