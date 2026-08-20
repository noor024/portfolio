const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Project = sequelize.define(
  "Project",
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
    description: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tech: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    github: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    liveDemo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "projects",
    timestamps: true,
    hooks: {
      beforeValidate: (project) => {
        ["title", "description", "type", "image", "github", "liveDemo"].forEach(
          (field) => {
            if (typeof project[field] === "string") {
              project[field] = project[field].trim();
            }
          }
        );

        if (Array.isArray(project.tech)) {
          project.tech = project.tech
            .map((item) => String(item).trim())
            .filter(Boolean);
        } else {
          project.tech = [];
        }
      },
    },
  }
);

module.exports = Project;