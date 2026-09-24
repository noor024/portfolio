import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { portfolioData } from "./data/portfolioData";
import AdminLogin from "./Admin/AdminLogin";
import AdminDashboard from "./Admin/AdminDashboard";
import {
  ADMIN_API_URL,
  PROJECTS_API_URL,
  SETTINGS_API_URL,
} from "./config/api";
import "./App.css";

const API_URL = PROJECTS_API_URL;

function Arrow() {
  return <span className="arrow-icon">↗</span>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [admin, setAdmin] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState(portfolioData);

  const closeMenu = () => setMenuOpen(false);

  const { personal, social, skills } = siteSettings;

  /* ==========================================
     CHECK ADMIN LOGIN
  ========================================== */

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) return;

    const validateAdminSession = async () => {
      try {
        const response = await fetch(`${ADMIN_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok || !data.success || !data.admin) {
          throw new Error("Invalid admin session");
        }

        setAdmin(data.admin);
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
      } catch {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      }
    }

    validateAdminSession();
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("admin") === "true") {
      setShowAdminLogin(true);
    }
  }, []);

  /* ==========================================
     LOAD PROJECTS
  ========================================== */

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load projects");
      }

      setProjects(data.projects || []);
    } catch (error) {
      console.error("Projects loading error:", error);
      setProjects(portfolioData.projects || []);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(SETTINGS_API_URL);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load settings");
        }

        setSiteSettings((previous) => ({
          ...previous,
          ...data.settings,
          personal: { ...previous.personal, ...data.settings.personal },
          social: { ...previous.social, ...data.settings.social },
        }));
      } catch (error) {
        console.error("Settings loading error:", error);
      }
    };

    loadSettings();
  }, []);

  /* ==========================================
     ADMIN LOGIN
  ========================================== */

  const handleAdminLogin = (adminData) => {
    setAdmin(adminData);
    setShowAdminLogin(false);
    setShowAdminDashboard(true);

    localStorage.setItem(
      "adminUser",
      JSON.stringify(adminData)
    );
  };

  /* ==========================================
     ADMIN LOGOUT
  ========================================== */

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    setAdmin(null);
    setShowAdminDashboard(false);
    setShowAdminLogin(false);
  };

  /* ==========================================
     ADMIN DASHBOARD
  ========================================== */

  if (showAdminDashboard && admin) {
    return (
      <AdminDashboard
        admin={admin}
        onLogout={handleAdminLogout}
        onAdminUpdate={(updatedAdmin) => {
          setAdmin(updatedAdmin);

          localStorage.setItem(
            "adminUser",
            JSON.stringify(updatedAdmin)
          );
        }}
      />
    );
  }

  /* ==========================================
     ADMIN LOGIN
  ========================================== */

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  /* ==========================================
     PORTFOLIO
  ========================================== */

  return (
    <div className="portfolio">

      {/* BACKGROUND */}
      <div className="background-effects">
        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>
        <div className="ambient ambient-three"></div>
        <div className="grid-background"></div>
      </div>

      {/* ======================================
          NAVBAR
      ====================================== */}

      <header className="navbar">

        <a
          href="#home"
          className="logo"
          onClick={closeMenu}
        >
          {personal.name.charAt(0)}
          <span>.</span>
        </a>

        <nav
          className={
            menuOpen
              ? "nav-links active"
              : "nav-links"
          }
        >
          <a href="#home" onClick={closeMenu}>
            Home
          </a>

          <a href="#about" onClick={closeMenu}>
            About
          </a>

          <a href="#education" onClick={closeMenu}>
            Journey
          </a>

          <a href="#skills" onClick={closeMenu}>
            Skills
          </a>

          <a href="#projects" onClick={closeMenu}>
            Projects
          </a>

          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
        </nav>

        <div className="navbar-actions">

          <a
            href="#contact"
            className="nav-button"
          >
            Let's Talk
            <Arrow />
          </a>

        </div>

        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "×" : "☰"}
        </button>

      </header>

      <main>

        {/* ======================================
            HERO
        ====================================== */}

        <section
          className="hero-section section"
          id="home"
        >

          <motion.div
            className="hero-content"
            initial={{
              opacity: 0,
              x: -40
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              duration: 0.8
            }}
          >

            <div className="availability">
              <span></span>
              Available for opportunities
            </div>

            <p className="eyebrow">
              <span className="eyebrow-star">✦</span>
              Hello, I'm
            </p>

            <h1>
              {personal.name.split(" ")[0]}
              <br />

              <span>
                {personal.name
                  .split(" ")
                  .slice(1)
                  .join(" ")}
              </span>
            </h1>

            <h2>
              {personal.role.split(" ")[0]}{" "}

              <span>
                {personal.role
                  .split(" ")
                  .slice(1)
                  .join(" ")}
              </span>
            </h2>

            <p className="hero-description">
              {personal.bio}
            </p>

            <div className="hero-actions">

              <a
                href="#projects"
                className="primary-button"
              >
                Explore My Work
                <Arrow />
              </a>

              <a
                href="#contact"
                className="secondary-button"
              >
                Contact Me
                <span>✉</span>
              </a>

            </div>

            <div className="social-links">

              <a
                href={social.github}
                target="_blank"
                rel="noreferrer"
              >
                <span>GH</span>
                GitHub
              </a>

              <a
                href={social.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <span>in</span>
                LinkedIn
              </a>

              <a
                href={social.instagram}
                target="_blank"
                rel="noreferrer"
              >
                <span>IG</span>
                Instagram
              </a>

            </div>

          </motion.div>

          {/* ==================================
              PROFILE VISUAL
          ================================== */}

          <motion.div
            className="hero-profile"
            initial={{
              opacity: 0,
              scale: 0.8,
              y: 30
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            transition={{
              duration: 1,
              delay: 0.2
            }}
          >

            <div className="profile-orbit orbit-a"></div>
            <div className="profile-orbit orbit-b"></div>

            <div className="profile-glow"></div>

            <div className="profile-image-wrapper">

              <div className="profile-image-frame">

                <img
                  src="/profile01.jpg"
                  alt={`${personal.name} profile`}
                  className="profile-image"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.classList.add(
                      "image-fallback"
                    );
                  }}
                />

                <div className="image-fallback-content">
                  <strong>
                    {personal.name
                      .split(" ")
                      .map((word) => word.charAt(0))
                      .join("")
                      .slice(0, 2)}
                  </strong>

                  <span>Developer</span>
                </div>

              </div>

              <div className="profile-status">
                <span></span>
                Open to work
              </div>

            </div>

            <div className="floating-info floating-top">

              <span className="floating-icon">
                &lt;/&gt;
              </span>

              <div>
                <strong>Developer</strong>
                <small>Building digital products</small>
              </div>

            </div>

            <div className="floating-info floating-bottom">

              <span className="floating-icon">
                ✦
              </span>

              <div>
                <strong>{projects.length}+</strong>
                <small>Projects</small>
              </div>

            </div>

          </motion.div>

        </section>

        {/* ======================================
            STATS STRIP
        ====================================== */}

        <section className="stats-strip">

          <div className="stat-item">
            <strong>{skills.length}+</strong>
            <span>Technologies</span>
          </div>

          <div className="stat-item">
            <strong>{projects.length}+</strong>
            <span>Projects</span>
          </div>

          <div className="stat-item">
            <strong>100%</strong>
            <span>Learning Mindset</span>
          </div>

          <div className="stat-item">
            <strong>∞</strong>
            <span>Ideas</span>
          </div>

        </section>

        {/* ======================================
            ABOUT
        ====================================== */}

        <section
          className="section about-section"
          id="about"
        >

          <motion.div
            className="section-heading"
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
          >

            <p className="section-label">
              01 — About Me
            </p>

            <h2>
              Turning ideas into
              <span> digital experiences.</span>
            </h2>

          </motion.div>

          <div className="about-grid">

            <motion.div
              className="about-photo-card"
              initial={{
                opacity: 0,
                x: -40
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              viewport={{
                once: true
              }}
            >

              <img
                src="/profile.png"
                alt={`${personal.name} portrait`}
              />

              <div className="about-photo-overlay">
                <span>Based in India</span>
                <span>•</span>
                <span>Developer</span>
              </div>

            </motion.div>

            <motion.div
              className="about-text"
              initial={{
                opacity: 0,
                x: 40
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              viewport={{
                once: true
              }}
            >

              <span className="mini-tag">
                WHO I AM
              </span>

              <h3>
                A developer who enjoys
                <span> building things.</span>
              </h3>

              <p>
                {personal.bio}
              </p>

              <p>
                I enjoy combining technology,
                design and problem-solving to
                create digital products that are
                useful, fast and visually engaging.
              </p>

              <div className="about-highlights">

                <div>
                  <span>01</span>
                  <strong>Problem Solving</strong>
                </div>

                <div>
                  <span>02</span>
                  <strong>Creative Development</strong>
                </div>

                <div>
                  <span>03</span>
                  <strong>Continuous Learning</strong>
                </div>

              </div>

              <a
                href="#contact"
                className="text-link"
              >
                Let's work together
                <Arrow />
              </a>

            </motion.div>

          </div>

        </section>

        {/* ======================================
            JOURNEY
        ====================================== */}

        <section
          className="section journey-section"
          id="education"
        >

          <motion.div
            className="section-heading"
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
          >

            <p className="section-label">
              02 — My Journey
            </p>

            <h2>
              Learning.
              <span> Building. Growing.</span>
            </h2>

          </motion.div>

          <div className="timeline">

            <motion.div
              className="timeline-item"
              initial={{
                opacity: 0,
                x: -30
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              viewport={{
                once: true
              }}
            >

              <div className="timeline-number">
                01
              </div>

              <div className="timeline-content">
                <span>Education</span>
                <h3>Bachelor of Computer Applications</h3>
                <p>
                  Building a strong foundation in
                  programming, software development
                  and computer science.
                </p>
              </div>

            </motion.div>

            <motion.div
              className="timeline-item"
              initial={{
                opacity: 0,
                x: -30
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                delay: 0.15
              }}
            >

              <div className="timeline-number">
                02
              </div>

              <div className="timeline-content">
                <span>Development</span>
                <h3>Web Development Journey</h3>
                <p>
                  Learning modern frontend and
                  backend technologies while building
                  real-world projects.
                </p>
              </div>

            </motion.div>

            <motion.div
              className="timeline-item"
              initial={{
                opacity: 0,
                x: -30
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                delay: 0.3
              }}
            >

              <div className="timeline-number">
                03
              </div>

              <div className="timeline-content">
                <span>Now</span>
                <h3>Building & Exploring</h3>
                <p>
                  Creating full-stack applications,
                  improving UI/UX and continuously
                  expanding my technical skills.
                </p>
              </div>

            </motion.div>

          </div>

        </section>

        {/* ======================================
            SKILLS
        ====================================== */}

        <section
          className="section skills-section"
          id="skills"
        >

          <motion.div
            className="section-heading"
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
          >

            <p className="section-label">
              03 — Skills
            </p>

            <h2>
              Tools I use to
              <span> bring ideas to life.</span>
            </h2>

          </motion.div>

          <div className="skills-grid">

            {skills.map((skill, index) => (

              <motion.div
                className="skill-card"
                key={skill}
                initial={{
                  opacity: 0,
                  y: 25
                }}
                whileInView={{
                  opacity: 1,
                  y: 0
                }}
                viewport={{
                  once: true
                }}
                transition={{
                  delay: index * 0.05
                }}
                whileHover={{
                  y: -8
                }}
              >

                <div className="skill-top">
                  <span className="skill-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="skill-arrow">
                    <Arrow />
                  </span>
                </div>

                <h3>{skill}</h3>

                <div className="skill-line">
                  <span></span>
                </div>

              </motion.div>

            ))}

          </div>

        </section>

        {/* ======================================
            PROJECTS
        ====================================== */}

        <section
          className="section projects-section"
          id="projects"
        >

          <motion.div
            className="section-heading projects-heading"
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
          >

            <div>

              <p className="section-label">
                04 — Projects
              </p>

              <h2>
                Selected
                <span> work.</span>
              </h2>

            </div>

            <p className="heading-description">
              Real projects, experiments and
              digital products built while learning
              and developing.
            </p>

          </motion.div>

          {projectsLoading ? (

            <div className="projects-loading">
              <div className="loading-spinner"></div>
              <span>Loading projects...</span>
            </div>

          ) : (

            <div className="projects-grid">

              {projects.length === 0 ? (

                <div className="projects-empty">
                  <div className="empty-icon">
                    &lt;/&gt;
                  </div>

                  <h3>
                    Projects coming soon
                  </h3>

                  <p>
                    New projects will appear here
                    once they are added from the
                    admin dashboard.
                  </p>

                </div>

              ) : (

                projects.map((project, index) => (

                  <motion.article
                    className="project-card"
                    key={
                      project._id ||
                      project.title ||
                      index
                    }
                    initial={{
                      opacity: 0,
                      y: 40
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0
                    }}
                    viewport={{
                      once: true
                    }}
                    transition={{
                      delay: index * 0.08
                    }}
                    whileHover={{
                      y: -10
                    }}
                  >

                    <div className="project-preview">

                      {project.image ? (

                        <img
                          src={project.image}
                          alt={project.title}
                          className="project-image"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                      ) : (

                        <div className="project-symbol">
                          &lt;/&gt;
                        </div>

                      )}

                      <div className="project-overlay"></div>

                      {project.type && (
                        <span className="project-type">
                          {project.type}
                        </span>
                      )}

                      {project.featured && (
                        <span className="featured-project">
                          Featured
                        </span>
                      )}

                    </div>

                    <div className="project-content">

                      <div className="project-title-row">

                        <div>
                          <span className="project-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <h3>
                            {project.title}
                          </h3>
                        </div>

                        <div className="project-button">
                          <Arrow />
                        </div>

                      </div>

                      <p>
                        {project.description}
                      </p>

                      <div className="tech-list">

                        {Array.isArray(project.tech) &&
                          project.tech.map(
                            (technology) => (
                              <span
                                key={technology}
                              >
                                {technology}
                              </span>
                            )
                          )}

                      </div>

                      <div className="project-links">

                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noreferrer"
                          >
                            GitHub
                            <Arrow />
                          </a>
                        )}

                        {project.liveDemo && (
                          <a
                            href={project.liveDemo}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Live Demo
                            <Arrow />
                          </a>
                        )}

                      </div>

                    </div>

                  </motion.article>

                ))

              )}

            </div>

          )}

        </section>

        {/* ======================================
            WHAT I DO
        ====================================== */}

        <section className="section services-section">

          <motion.div
            className="section-heading"
            initial={{
              opacity: 0,
              y: 30
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
          >

            <p className="section-label">
              05 — What I Do
            </p>

            <h2>
              Building digital
              <span> solutions.</span>
            </h2>

          </motion.div>

          <div className="services-grid">

            <motion.div
              className="service-card"
              whileHover={{
                y: -8
              }}
            >
              <span>01</span>
              <div className="service-icon">
                &lt;/&gt;
              </div>
              <h3>Web Development</h3>
              <p>
                Modern, responsive and scalable
                websites using current web
                technologies.
              </p>
            </motion.div>

            <motion.div
              className="service-card"
              whileHover={{
                y: -8
              }}
            >
              <span>02</span>
              <div className="service-icon">
                ◈
              </div>
              <h3>UI Development</h3>
              <p>
                Clean interfaces with attention to
                usability, layout and visual details.
              </p>
            </motion.div>

            <motion.div
              className="service-card"
              whileHover={{
                y: -8
              }}
            >
              <span>03</span>
              <div className="service-icon">
                ⚡
              </div>
              <h3>Full Stack Projects</h3>
              <p>
                Connecting frontend applications
                with APIs, databases and backend
                services.
              </p>
            </motion.div>

          </div>

        </section>

        {/* ======================================
            CONTACT
        ====================================== */}

        <section
          className="section cta-section"
          id="contact"
        >

          <motion.div
            className="cta-box"
            initial={{
              opacity: 0,
              scale: 0.96
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
          >

            <div className="cta-background-glow"></div>

            <p className="section-label">
              06 — Contact
            </p>

            <h2>
              Have an idea?
              <br />
              <span>Let's build it.</span>
            </h2>

            <p>
              I'm always interested in new
              projects, creative ideas and
              opportunities to build something
              meaningful.
            </p>

            <div className="cta-actions">

              <a
                href={`mailto:${personal.email}`}
                className="primary-button"
              >
                Send Message
                <span>✉</span>
              </a>

              <a
                href="/Noor_Resume.pdf"
                download="Noor_Resume.pdf"
                className="secondary-button"
              >
                Download CV
                <span>↓</span>
              </a>

            </div>

            <div className="contact-email">
              {personal.email}
            </div>

          </motion.div>

        </section>

      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="footer">

        <div className="footer-brand">

          <a
            href="#home"
            className="logo"
          >
            {personal.name.charAt(0)}
            <span>.</span>
          </a>

          <p>
            Designed & built with passion.
          </p>

        </div>

        <div className="footer-right">

          <p>
            © 2026 {personal.name}.
            All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;