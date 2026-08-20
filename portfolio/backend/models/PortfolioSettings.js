const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PortfolioSettings = sequelize.define(
  "PortfolioSettings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    personal: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    social: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    skills: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  { tableName: "portfolio_settings", timestamps: true }
);

module.exports = PortfolioSettings;