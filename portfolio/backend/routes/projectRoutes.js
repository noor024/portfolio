const express = require("express");
const Project = require("../models/Project");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

const toProjectPayload = (project) => {
  const value = project.toJSON();

  return {
    ...value,
    _id: String(value.id),
  };
};

// ======================================
// GET ALL PROJECTS
// Public route
// ======================================

router.get("/", async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json({
      success: true,
      count: projects.length,
      projects: projects.map(toProjectPayload),
    });
  } catch (error) {
    console.error("Get projects error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to get projects",
    });
  }
});

// ======================================
// GET SINGLE PROJECT
// Public route
// ======================================

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      project: toProjectPayload(project),
    });
  } catch (error) {
    console.error("Get project error:", error.message);

    res.status(400).json({
      success: false,
      message: "Invalid project ID",
    });
  }
});

// ======================================
// CREATE PROJECT
// Protected Admin Route
// ======================================

router.post("/", protectAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      tech,
      image,
      github,
      liveDemo,
      featured,
      order,
    } = req.body;

    // Validation
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description and type are required",
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      type: type.trim(),

      tech: Array.isArray(tech)
        ? tech.map((item) => String(item).trim()).filter(Boolean)
        : [],

      image: image?.trim() || "",
      github: github?.trim() || "",
      liveDemo: liveDemo?.trim() || "",
      featured: Boolean(featured),
      order: Number.isFinite(Number(order))
        ? Number(order)
        : 0,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: toProjectPayload(project),
    });
  } catch (error) {
    console.error("Create project error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
});

// ======================================
// UPDATE PROJECT
// Protected Admin Route
// ======================================

router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      tech,
      image,
      github,
      liveDemo,
      featured,
      order,
    } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, description and type are required",
      });
    }

    const [rowsUpdated] = await Project.update(
      {
        title: title.trim(),
        description: description.trim(),
        type: type.trim(),

        tech: Array.isArray(tech)
          ? tech
              .map((item) => String(item).trim())
              .filter(Boolean)
          : [],

        image: image?.trim() || "",
        github: github?.trim() || "",
        liveDemo: liveDemo?.trim() || "",
        featured: Boolean(featured),

        order: Number.isFinite(Number(order))
          ? Number(order)
          : 0,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    if (!rowsUpdated) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project updated successfully",
      project: toProjectPayload(project),
    });
  } catch (error) {
    console.error("Update project error:", error.message);

    res.status(400).json({
      success: false,
      message: "Unable to update project",
    });
  }
});

// ======================================
// DELETE PROJECT
// Protected Admin Route
// ======================================

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.destroy();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);

    res.status(400).json({
      success: false,
      message: "Unable to delete project",
    });
  }
});

module.exports = router;