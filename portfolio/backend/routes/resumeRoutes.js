const express = require("express");
const multer = require("multer");
const { Op } = require("sequelize");
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
  startsAt: resume.startsAt,
  endsAt: resume.endsAt,
  createdAt: resume.createdAt,
});

const getActiveResume = () => {
  const now = new Date();

  return ResumeVersion.findOne({
    where: {
      startsAt: { [Op.lte]: now },
      [Op.or]: [
        { endsAt: { [Op.is]: null } },
        { endsAt: { [Op.gt]: now } },
      ],
    },
    order: [["startsAt", "DESC"]],
  });
};

router.get("/active", async (_req, res) => {
  try {
    const now = new Date();
    const resume = await getActiveResume();
    const nextScheduledResume = await ResumeVersion.findOne({
      where: { startsAt: { [Op.gt]: now } },
      attributes: ["startsAt"],
      order: [["startsAt", "ASC"]],
    });
    const changeTimes = [
      resume?.endsAt,
      nextScheduledResume?.startsAt,
    ]
      .filter((value) => value && new Date(value) > now)
      .map((value) => new Date(value));
    const nextChangeAt = changeTimes.length
      ? new Date(Math.min(...changeTimes.map((value) => value.getTime())))
      : null;

    res.set("Cache-Control", "no-store");
    res.json({
      success: true,
      resume: resume ? toMetadata(resume) : null,
      nextChangeAt,
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
    const resume = await getActiveResume();
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
    const resumes = await ResumeVersion.findAll({
      attributes: ["id", "title", "fileName", "startsAt", "endsAt", "createdAt"],
      order: [["startsAt", "DESC"]],
    });

    res.json({
      success: true,
      resumes: resumes.map(toMetadata),
    });
  } catch (error) {
    console.error("List resumes error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to load resume history.",
    });
  }
});

router.post("/", protectAdmin, uploadResume, async (req, res) => {
  const title = String(req.body.title || "").trim();
  const file = req.file;
  const startsAt = new Date(req.body.startsAt);
  const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;

  if (!title || title.length > 100) {
    return res.status(400).json({
      success: false,
      message: "A resume title of up to 100 characters is required.",
    });
  }

  if (!file || file.mimetype !== "application/pdf" ||
      file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return res.status(400).json({
      success: false,
      message: "Choose a valid PDF resume.",
    });
  }

  if (Number.isNaN(startsAt.getTime()) ||
      (endsAt && Number.isNaN(endsAt.getTime())) ||
      (endsAt && endsAt <= startsAt)) {
    return res.status(400).json({
      success: false,
      message: "The end time must be later than the start time.",
    });
  }

  try {
    const resume = await sequelize.transaction(async (transaction) => {
      const previousOpenVersion = await ResumeVersion.findOne({
        where: {
          startsAt: { [Op.lt]: startsAt },
          endsAt: { [Op.is]: null },
        },
        order: [["startsAt", "DESC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (previousOpenVersion) {
        await previousOpenVersion.update({ endsAt: startsAt }, { transaction });
      }

      const upperBound = endsAt || new Date("9999-12-31T23:59:59.999Z");
      const overlappingResume = await ResumeVersion.findOne({
        where: {
          startsAt: { [Op.lt]: upperBound },
          [Op.or]: [
            { endsAt: { [Op.is]: null } },
            { endsAt: { [Op.gt]: startsAt } },
          ],
        },
        transaction,
      });

      if (overlappingResume) {
        const error = new Error("This schedule overlaps another resume.");
        error.statusCode = 409;
        throw error;
      }

      const fileName = file.originalname
        .replace(/[/\\]/g, "_")
        .replace(/[\r\n"]/g, "_")
        .slice(0, 255);

      return ResumeVersion.create(
        {
          title,
          fileName,
          fileData: file.buffer,
          startsAt,
          endsAt,
        },
        { transaction }
      );
    });

    return res.status(201).json({
      success: true,
      message: "Resume scheduled successfully.",
      resume: toMetadata(resume),
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Upload resume error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save the resume.",
    });
  }
});

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deleted = await sequelize.transaction(async (transaction) => {
      const resume = await ResumeVersion.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!resume) return false;

      const previousResume = await ResumeVersion.findOne({
        where: { endsAt: resume.startsAt },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (previousResume) {
        await previousResume.update(
          { endsAt: resume.endsAt },
          { transaction }
        );
      }

      await resume.destroy({ transaction });
      return true;
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    return res.json({
      success: true,
      message: "Resume removed.",
    });
  } catch (error) {
    console.error("Delete resume error:", error.message);
    return res.status(400).json({
      success: false,
      message: "Unable to remove the resume.",
    });
  }
});

module.exports = router;
