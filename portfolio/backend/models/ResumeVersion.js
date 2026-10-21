const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ResumeVersion = sequelize.define(
  "ResumeVersion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileData: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "resume_versions",
    timestamps: true,
    indexes: [{ fields: ["startsAt"] }],
  }
);

module.exports = ResumeVersion;
