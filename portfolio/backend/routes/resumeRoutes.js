const express = require("express");
const multer = require("multer");
const ResumeVersion = require("../models/ResumeVersion");
const sequelize = require("../config/database");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();
const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Only PDF resumes are supported."));
    }

    callback(null, true);
  },
});

const uploadResume = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    const status = error instanceof multer.MulterError
      ? error.code === "LIMIT_FILE_SIZE" ? 413 : 400
      : 400;

    return res.status(status).json({
      success: false,
      message: error.message || "Unable to upload resume.",
    });
  });
};

const toMetadata = (resume) => ({
  id: resume.id,
  title: resume.title,
  fileName: resume.fileName,
  updatedAt: resume.updatedAt,
});

const getCurrentResume = () =>
  ResumeVersion.findOne({
    order: [["updatedAt", "DESC"], ["id", "DESC"]],
  });

router.get("/active", async (_req, res) => {
  try {
    const resume = await getCurrentResume();

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      resume: resume ? toMetadata(resume) : null,
    });
  } catch (error) {
    console.error("Get active resume error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load the current resume.",
    });
  }
});

router.get("/active/file", async (_req, res) => {
  try {
    const resume = await getCurrentResume();
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "No resume is currently published.",
      });
    }

    const safeFileName = resume.fileName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\\;]/g, "_");
    const encodedFileName = encodeURIComponent(resume.fileName)
      .replace(/[!'()*]/g, (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`
      );
    res.set({
      "Cache-Control": "no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
      "X-Content-Type-Options": "nosniff",
    });
    return res.send(resume.fileData);
  } catch (error) {
    console.error("Download active resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to download the current resume.",
    });
  }
});

router.get("/", protectAdmin, async (_req, res) => {
  try {
    const resume = await getCurrentResume();

    res.json({
      success: true,
      resume: resume ? toMetadata(resume) : null,
    });
  } catch (error) {
    console.error("Get current resume error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load the current resume.",
    });
  }
});

router.post("/", protectAdmin, uploadResume, async (req, res) => {
  const file = req.file;

  if (!file || file.mimetype !== "application/pdf" ||
      file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return res.status(400).json({
      success: false,
      message: "Choose a valid PDF resume.",
    });
  }

  try {
    const resume = await sequelize.transaction(async (transaction) => {
      const existingResumes = await ResumeVersion.findAll({
        attributes: ["id"],
        order: [["updatedAt", "DESC"], ["id", "DESC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const fileName = file.originalname
        .replace(/[/\\]/g, "_")
        .replace(/[\r\n"]/g, "_")
        .slice(0, 255);
      const currentResume = existingResumes.length
        ? await ResumeVersion.findByPk(existingResumes[0].id, { transaction })
        : null;

      const savedResume = currentResume
        ? await currentResume.update(
            {
              title: "Current resume",
              fileName,
              fileData: file.buffer,
              startsAt: new Date(),
              endsAt: null,
            },
            { transaction }
          )
        : await ResumeVersion.create(
            {
              title: "Current resume",
              fileName,
              fileData: file.buffer,
              startsAt: new Date(),
              endsAt: null,
            },
            { transaction }
          );

      const replacedResumeIds = existingResumes
        .slice(1)
        .map(({ id }) => id);
      if (replacedResumeIds.length) {
        await ResumeVersion.destroy({
          where: { id: replacedResumeIds },
          transaction,
        });
      }

      return savedResume;
    });

    return res.status(201).json({
      success: true,
      message: "CV replaced and published successfully.",
      resume: toMetadata(resume),
    });
  } catch (error) {
    console.error("Upload resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to replace the current resume.",
    });
  }
});

module.exports = router;
