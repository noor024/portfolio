require("dotenv").config();

const { MongoClient } = require("mongodb");
const sequelize = require("../config/database");
const Admin = require("../models/Admin");
const Project = require("../models/Project");

const normalizeTech = (tech) => {
  if (!Array.isArray(tech)) {
    return [];
  }

  return tech
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const mapAdmin = (admin) => ({
  name: String(admin.name || "").trim(),
  email: String(admin.email || "").toLowerCase().trim(),
  password: String(admin.password || ""),
  role: "admin",
});

const mapProject = (project) => ({
  title: String(project.title || "").trim(),
  description: String(project.description || "").trim(),
  type: String(project.type || "").trim(),
  tech: normalizeTech(project.tech),
  image: String(project.image || "").trim(),
  github: String(project.github || "").trim(),
  liveDemo: String(project.liveDemo || "").trim(),
  featured: Boolean(project.featured),
  order: Number.isFinite(Number(project.order)) ? Number(project.order) : 0,
  createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
  updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
});

const run = async () => {
  const sourceMongoUri = process.env.MONGO_URI_SOURCE;
  const mongoDbName = process.env.MONGO_DB_NAME;

  if (!sourceMongoUri) {
    throw new Error("MONGO_URI_SOURCE is missing in .env file");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env file");
  }

  const mongoClient = new MongoClient(sourceMongoUri);

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    await mongoClient.connect();

    const mongoDb = mongoDbName
      ? mongoClient.db(mongoDbName)
      : mongoClient.db();
    const adminsCollection = mongoDb.collection("admins");
    const projectsCollection = mongoDb.collection("projects");

    const [mongoAdmins, mongoProjects] = await Promise.all([
      adminsCollection.find({}).toArray(),
      projectsCollection.find({}).toArray(),
    ]);

    const admins = mongoAdmins
      .map(mapAdmin)
      .filter((item) => item.name && item.email && item.password);

    const projects = mongoProjects
      .map(mapProject)
      .filter((item) => item.title && item.description && item.type);

    if (admins.length) {
      await Admin.bulkCreate(admins, {
        updateOnDuplicate: ["name", "password", "role", "updatedAt"],
      });
    }

    if (projects.length) {
      await Project.destroy({
        where: {},
        truncate: true,
        restartIdentity: true,
      });

      await Project.bulkCreate(projects);
    }

    console.log(`Admins migrated: ${admins.length}`);
    console.log(`Projects migrated: ${projects.length}`);
    console.log("MongoDB to PostgreSQL migration completed.");
  } finally {
    await mongoClient.close();
    await sequelize.close();
  }
};

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
