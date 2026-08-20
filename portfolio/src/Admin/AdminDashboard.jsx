import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ADMIN_API_URL, PROJECTS_API_URL } from "../config/api";
import "./AdminDashboard.css";

const API_URL = PROJECTS_API_URL;

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const emptyForm = {
  title: "",
  description: "",
  type: "Full Stack",
  tech: "",
  image: "",
  github: "",
  liveDemo: "",
  featured: false,
  order: 0,
};

function AdminDashboard({ admin, onLogout, onAdminUpdate }) {
  const [currentAdmin, setCurrentAdmin] = useState(admin);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [accountForm, setAccountForm] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load projects");
      }

      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message || "Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    setCurrentAdmin(admin);

    setAccountForm((previous) => ({
      ...previous,
      name: admin?.name || "",
      email: admin?.email || "",
    }));
  }, [admin]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        (Array.isArray(project.tech) &&
          project.tech.some((item) =>
            item.toLowerCase().includes(query)
          ));

      const matchesFilter =
        filter === "all" ||
        (filter === "featured" && project.featured) ||
        (filter === "regular" && !project.featured);

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, filter]);

  const totalTechnologies = useMemo(() => {
    const technologies = new Set();

    projects.forEach((project) => {
      if (Array.isArray(project.tech)) {
        project.tech.forEach((tech) => technologies.add(tech));
      }
    });

    return technologies.size;
  }, [projects]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;

    setAccountForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const openEditForm = (project) => {
    setEditingId(project._id);

    setForm({
      title: project.title || "",
      description: project.description || "",
      type: project.type || "Full Stack",
      tech: Array.isArray(project.tech)
        ? project.tech.join(", ")
        : "",
      image: project.image || "",
      github: project.github || "",
      liveDemo: project.liveDemo || "",
      featured: Boolean(project.featured),
      order: project.order || 0,
    });

    setMessage("");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Project title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Project description is required.");
      return;
    }

    if (!form.type.trim()) {
      setError("Project type is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const projectData = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type.trim(),
        tech: form.tech
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        image: form.image.trim(),
        github: form.github.trim(),
        liveDemo: form.liveDemo.trim(),
        featured: form.featured,
        order: Number(form.order) || 0,
      };

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save project");
      }

      setMessage(
        editingId
          ? "Project updated successfully."
          : "Project added successfully."
      );

      closeForm();
      await loadProjects();
    } catch (err) {
      setError(err.message || "Unable to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete project");
      }

      setMessage("Project deleted successfully.");
      await loadProjects();
    } catch (err) {
      setError(err.message || "Unable to delete project");
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();

    setAccountError("");
    setAccountMessage("");

    const nextName = accountForm.name.trim();
    const nextEmail = accountForm.email.trim().toLowerCase();

    const currentName = currentAdmin?.name?.trim() || "";
    const currentEmail =
      currentAdmin?.email?.trim().toLowerCase() || "";

    const nameChanged = nextName !== currentName;
    const emailChanged = nextEmail !== currentEmail;
    const passwordChanged = Boolean(accountForm.newPassword);

    if (!nameChanged && !emailChanged && !passwordChanged) {
      setAccountError(
        "Please change your name, email or password."
      );
      return;
    }

    if (!nextName) {
      setAccountError("Admin name is required.");
      return;
    }

    if (nextName.length < 2) {
      setAccountError(
        "Admin name must contain at least 2 characters."
      );
      return;
    }

    if (nextName.length > 100) {
      setAccountError(
        "Admin name cannot exceed 100 characters."
      );
      return;
    }

    if (emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(nextEmail)) {
        setAccountError("Please enter a valid email address.");
        return;
      }
    }

    if (!accountForm.currentPassword) {
      setAccountError("Current password is required.");
      return;
    }

    if (
      passwordChanged &&
      !STRONG_PASSWORD_REGEX.test(accountForm.newPassword)
    ) {
      setAccountError(
        "New password must contain uppercase, lowercase, number, special character and be at least 8 characters."
      );
      return;
    }

    if (
      passwordChanged &&
      accountForm.newPassword !== accountForm.confirmPassword
    ) {
      setAccountError(
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setAccountSaving(true);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Admin session expired. Please login again.");
      }

      const payload = {
        currentPassword: accountForm.currentPassword,
      };

      if (nameChanged) payload.name = nextName;
      if (emailChanged) payload.email = nextEmail;
      if (passwordChanged) payload.password = accountForm.newPassword;

      const response = await fetch(
        `${ADMIN_API_URL}/account`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update account"
        );
      }

      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }

      setCurrentAdmin(data.admin);

      localStorage.setItem(
        "adminUser",
        JSON.stringify(data.admin)
      );

      if (onAdminUpdate) {
        onAdminUpdate(data.admin);
      }

      setAccountForm({
        name: data.admin.name,
        email: data.admin.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setAccountMessage(
        "Account updated successfully."
      );
    } catch (err) {
      setAccountError(
        err.message || "Unable to update account"
      );
    } finally {
      setAccountSaving(false);
    }
  };

  const firstName =
    currentAdmin?.name?.split(" ")[0] || "Admin";

  return (
    <div className="admin-dashboard">
      <div className="admin-background-orb orb-one" />
      <div className="admin-background-orb orb-two" />

      {/* HEADER */}
      <header className="admin-dashboard-header">
        <div className="admin-brand">
          <div className="admin-brand-icon">N.</div>

          <div>
            <p className="admin-label">PORTFOLIO</p>
            <h1>Admin Studio</h1>
          </div>
        </div>

        <div className="admin-header-actions">
          <div className="admin-user">
            <div className="admin-user-avatar">
              {currentAdmin?.name
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </div>

            <div className="admin-user-details">
              <strong>{currentAdmin?.name || "Admin"}</strong>
              <span>{currentAdmin?.email || ""}</span>
            </div>
          </div>

          <button
            className="admin-logout-button"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-dashboard-content">
        {/* HERO */}
        <motion.section
          className="admin-hero"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="hero-content">
            <div className="hero-badge">
              <span className="live-dot" />
              ADMIN CONTROL CENTER
            </div>

            <h2>
              Welcome back,
              <br />
              <span>{firstName}.</span>
            </h2>

            <p>
              Your portfolio command center. Create,
              manage and publish your work without
              touching the source code.
            </p>

            <div className="hero-actions">
              <button
                className="premium-primary-button"
                onClick={openAddForm}
              >
                <span>＋</span>
                Create Project
              </button>

              <button
                className="premium-secondary-button"
                onClick={() =>
                  document
                    .getElementById("projects-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View Projects
                <span>↓</span>
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-ring ring-one" />
            <div className="hero-ring ring-two" />

            <div className="hero-center-icon">
              ✦
            </div>

            <div className="floating-card card-projects">
              <span>PROJECTS</span>
              <strong>{projects.length}</strong>
            </div>

            <div className="floating-card card-featured">
              <span>FEATURED</span>
              <strong>
                {projects.filter((p) => p.featured).length}
              </strong>
            </div>
          </div>
        </motion.section>

        {/* STATS */}
        <section className="premium-stats-grid">
          <motion.div
            className="premium-stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon purple">◈</div>
            <div>
              <span>Total Projects</span>
              <strong>{projects.length}</strong>
            </div>
            <small>Portfolio items</small>
          </motion.div>

          <motion.div
            className="premium-stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon cyan">★</div>
            <div>
              <span>Featured</span>
              <strong>
                {projects.filter((p) => p.featured).length}
              </strong>
            </div>
            <small>Highlighted work</small>
          </motion.div>

          <motion.div
            className="premium-stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon pink">⌘</div>
            <div>
              <span>Technologies</span>
              <strong>{totalTechnologies}</strong>
            </div>
            <small>Unique technologies</small>
          </motion.div>

          <motion.div
            className="premium-stat-card"
            whileHover={{ y: -5 }}
          >
            <div className="stat-icon green">✓</div>
            <div>
              <span>System</span>
              <strong>Live</strong>
            </div>
            <small>Backend connected</small>
          </motion.div>
        </section>

        {/* ACCOUNT SETTINGS */}
        <section className="premium-section">
          <div className="premium-section-heading">
            <div>
              <span className="section-kicker">SECURITY</span>
              <h2>Account Settings</h2>
              <p>
                Manage your administrator identity and
                authentication credentials.
              </p>
            </div>

            <div className="section-security-badge">
              <span>●</span>
              Protected
            </div>
          </div>

          {accountMessage && (
            <motion.div
              className="premium-success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✓ {accountMessage}
            </motion.div>
          )}

          {accountError && (
            <motion.div
              className="premium-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {accountError}
            </motion.div>
          )}

          <form
            className="premium-account-card"
            onSubmit={handleAccountSubmit}
          >
            <div className="account-profile-preview">
              <div className="large-admin-avatar">
                {currentAdmin?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "A"}
              </div>

              <div>
                <span>Administrator</span>
                <strong>
                  {currentAdmin?.name || "Admin"}
                </strong>
                <small>
                  {currentAdmin?.email || ""}
                </small>
              </div>
            </div>

            <div className="account-form-grid">
              <div className="premium-field">
                <label>Admin Name</label>
                <input
                  type="text"
                  name="name"
                  value={accountForm.name}
                  onChange={handleAccountChange}
                  placeholder="Your name"
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="premium-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={accountForm.email}
                  onChange={handleAccountChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="premium-field">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={accountForm.currentPassword}
                  onChange={handleAccountChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="premium-field">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={accountForm.newPassword}
                  onChange={handleAccountChange}
                  placeholder="Leave empty to keep current"
                  autoComplete="new-password"
                />
              </div>

              <div className="premium-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={accountForm.confirmPassword}
                  onChange={handleAccountChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="account-footer">
              <div className="password-hint">
                <span>ⓘ</span>
                Password requires 8+ characters,
                uppercase, lowercase, number and symbol.
              </div>

              <button
                type="submit"
                className="premium-primary-button"
                disabled={accountSaving}
              >
                {accountSaving
                  ? "Updating..."
                  : "Save Account"}
              </button>
            </div>
          </form>
        </section>

        {/* PROJECTS */}
        <section
          className="premium-section"
          id="projects-section"
        >
          <div className="premium-section-heading projects-heading">
            <div>
              <span className="section-kicker">PORTFOLIO CONTENT</span>
              <h2>Projects</h2>
              <p>
                Manage everything displayed in your
                public portfolio.
              </p>
            </div>

            <button
              className="premium-primary-button"
              onClick={openAddForm}
            >
              <span>＋</span>
              Add Project
            </button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                className="premium-success"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                ✓ {message}
              </motion.div>
            )}

            {error && (
              <motion.div
                className="premium-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOOLBAR */}
          <div className="projects-toolbar">
            <div className="project-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="project-filters">
              <button
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>

              <button
                className={
                  filter === "featured" ? "active" : ""
                }
                onClick={() => setFilter("featured")}
              >
                Featured
              </button>

              <button
                className={
                  filter === "regular" ? "active" : ""
                }
                onClick={() => setFilter("regular")}
              >
                Regular
              </button>
            </div>
          </div>

          {loading ? (
            <div className="premium-loading">
              <div className="premium-spinner" />
              <p>Loading your projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="premium-empty">
              <div className="empty-icon">◇</div>
              <h3>
                {projects.length === 0
                  ? "Your portfolio is empty"
                  : "No projects found"}
              </h3>
              <p>
                {projects.length === 0
                  ? "Create your first project and start building your portfolio."
                  : "Try changing your search or filter."}
              </p>

              {projects.length === 0 && (
                <button
                  className="premium-primary-button"
                  onClick={openAddForm}
                >
                  ＋ Create First Project
                </button>
              )}
            </div>
          ) : (
            <div className="premium-project-grid">
              {filteredProjects.map((project, index) => (
                <motion.article
                  className="premium-project-card"
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  whileHover={{ y: -6 }}
                >
                  <div className="premium-project-image">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        onError={(e) => {
                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="project-image-placeholder">
                        <span>&lt;/&gt;</span>
                      </div>
                    )}

                    <div className="image-overlay" />

                    <span className="project-type">
                      {project.type}
                    </span>

                    {project.featured && (
                      <span className="featured-project">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div className="premium-project-body">
                    <div className="project-number">
                      #{String(index + 1).padStart(2, "0")}
                    </div>

                    <h3>{project.title}</h3>

                    <p>{project.description}</p>

                    <div className="premium-tech-list">
                      {Array.isArray(project.tech) &&
                        project.tech.map((technology) => (
                          <span key={technology}>
                            {technology}
                          </span>
                        ))}
                    </div>

                    <div className="project-links">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub ↗
                        </a>
                      )}

                      {project.liveDemo && (
                        <a
                          href={project.liveDemo}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>

                    <div className="premium-project-actions">
                      <button
                        className="edit-project"
                        onClick={() =>
                          openEditForm(project)
                        }
                      >
                        ✎ Edit
                      </button>

                      <button
                        className="delete-project"
                        onClick={() =>
                          handleDelete(project._id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* PROJECT MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="premium-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeForm();
              }
            }}
          >
            <motion.div
              className="premium-modal"
              initial={{
                opacity: 0,
                y: 30,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.96,
              }}
            >
              <div className="modal-top">
                <div>
                  <span className="section-kicker">
                    {editingId
                      ? "EDIT PROJECT"
                      : "NEW PROJECT"}
                  </span>

                  <h2>
                    {editingId
                      ? "Update Project"
                      : "Create Project"}
                  </h2>

                  <p>
                    Add professional project details
                    to your portfolio.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={closeForm}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <form
                className="premium-project-form"
                onSubmit={handleSubmit}
              >
                <div className="premium-field">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Amazon Clone"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="premium-field">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe what you built..."
                    rows="5"
                    maxLength={1000}
                    required
                  />
                </div>

                <div className="modal-grid">
                  <div className="premium-field">
                    <label>Project Type *</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                    >
                      <option>Full Stack</option>
                      <option>Frontend</option>
                      <option>Backend</option>
                      <option>Mobile</option>
                      <option>Dashboard</option>
                      <option>AI / ML</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="premium-field">
                    <label>Display Order</label>
                    <input
                      type="number"
                      name="order"
                      value={form.order}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="premium-field">
                  <label>Technologies</label>
                  <input
                    type="text"
                    name="tech"
                    value={form.tech}
                    onChange={handleChange}
                    placeholder="React, Node.js, PostgreSQL"
                  />
                  <small>
                    Separate technologies with commas.
                  </small>
                </div>

                <div className="premium-field">
                  <label>Project Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://example.com/project.jpg"
                  />
                </div>

                <div className="modal-grid">
                  <div className="premium-field">
                    <label>GitHub URL</label>
                    <input
                      type="url"
                      name="github"
                      value={form.github}
                      onChange={handleChange}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="premium-field">
                    <label>Live Demo URL</label>
                    <input
                      type="url"
                      name="liveDemo"
                      value={form.liveDemo}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <label className="premium-featured-toggle">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={handleChange}
                  />

                  <span className="custom-checkbox">
                    ✓
                  </span>

                  <span>
                    <strong>Featured Project</strong>
                    <small>
                      Highlight this project on your
                      portfolio.
                    </small>
                  </span>
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="premium-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Project"
                      : "Create Project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;