const express = require("express");
const PortfolioSettings = require("../models/PortfolioSettings");
const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

const defaults = {
  personal: {
    name: "Noor Mohammad.",
    role: "Full Stack Developer",
    tagline: "Building ideas into digital experiences.",
    bio: "I'm a BCA student and aspiring full-stack developer passionate about building modern websites and applications.",
    email: "itz.sanu024@gmail.com",
  },
  social: {
    github: "https://github.com/noor024",
    linkedin: "www.linkedin.com/in/noor-mohammad-00932a355",
    instagram: "https://www.instagram.com/thenoorunfiltered",
  },
  skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Java", "Flutter"],
};

const getSettings = async () => {
  const [settings] = await PortfolioSettings.findOrCreate({
    where: { id: 1 },
    defaults,
  });

  return settings;
};

router.get("/", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      settings: {
        personal: { ...defaults.personal, ...settings.personal },
        social: { ...defaults.social, ...settings.social },
        skills: Array.isArray(settings.skills) ? settings.skills : defaults.skills,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to load portfolio settings" });
  }
});

router.put("/", protectAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    const personal = req.body.personal || {};
    const social = req.body.social || {};

    settings.personal = {
      name: String(personal.name || "").trim(),
      role: String(personal.role || "").trim(),
      tagline: String(personal.tagline || "").trim(),
      bio: String(personal.bio || "").trim(),
      email: String(personal.email || "").trim(),
    };
    settings.social = {
      github: String(social.github || "").trim(),
      linkedin: String(social.linkedin || "").trim(),
      instagram: String(social.instagram || "").trim(),
    };
    settings.skills = Array.isArray(req.body.skills)
      ? req.body.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];

    await settings.save();
    res.json({ success: true, message: "Portfolio settings saved", settings });
  } catch (error) {
    res.status(400).json({ success: false, message: "Unable to save portfolio settings" });
  }
});

module.exports = router;