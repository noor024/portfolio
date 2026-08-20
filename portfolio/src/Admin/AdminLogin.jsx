import { useState } from "react";
import { motion } from "framer-motion";
import { ADMIN_API_URL } from "../config/api";
import "./AdminLogin.css";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${ADMIN_API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password.");
      }

      localStorage.setItem("adminToken", data.token);

      localStorage.setItem(
        "adminUser",
        JSON.stringify(data.admin)
      );

      onLogin(data.admin);
    } catch (error) {
      setError(
        error.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      {/* BACKGROUND EFFECTS */}
      <div className="admin-login-bg">
        <div className="admin-login-orb orb-purple"></div>
        <div className="admin-login-orb orb-blue"></div>
        <div className="admin-login-grid"></div>
      </div>

      {/* TOP BRAND */}
      <motion.div
        className="admin-login-brand"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="admin-login-brand-icon">
          &lt;/&gt;
        </div>

        <div>
          <strong>Portfolio</strong>
          <span>ADMIN PANEL</span>
        </div>
      </motion.div>

      {/* LOGIN CARD */}
      <motion.div
        className="admin-login-card"
        initial={{
          opacity: 0,
          y: 35,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
      >

        {/* CARD HEADER */}
        <div className="admin-login-header">

          <motion.div
            className="admin-login-icon"
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.5,
            }}
          >
            <span>🔐</span>
          </motion.div>

          <div className="admin-login-title-area">

            <p className="admin-login-label">
              SECURE ACCESS
            </p>

            <h1>
              Welcome <span>Back.</span>
            </h1>

            <p className="admin-login-description">
              Sign in to manage your portfolio,
              projects and account.
            </p>

          </div>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="admin-login-form"
        >

          {/* EMAIL */}
          <div className="admin-login-field">

            <label htmlFor="admin-email">
              Email Address
            </label>

            <div className="admin-login-input-wrapper">

              <span className="admin-input-icon">
                @
              </span>

              <input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                disabled={loading}
              />

            </div>

          </div>

          {/* PASSWORD */}
          <div className="admin-login-field">

            <div className="admin-password-label">

              <label htmlFor="admin-password">
                Password
              </label>

            </div>

            <div className="admin-login-input-wrapper">

              <span className="admin-input-icon">
                •••
              </span>

              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "◉" : "○"}
              </button>

            </div>

          </div>

          {/* ERROR */}
          {error && (
            <motion.div
              className="admin-login-error"
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <span>!</span>

              <p>{error}</p>
            </motion.div>
          )}

          {/* LOGIN BUTTON */}
          <motion.button
            type="submit"
            className="admin-login-button"
            disabled={loading}
            whileHover={
              !loading
                ? {
                    y: -2,
                  }
                : {}
            }
            whileTap={
              !loading
                ? {
                    scale: 0.98,
                  }
                : {}
            }
          >

            {loading ? (
              <>
                <span className="login-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span className="login-arrow">
                  →
                </span>
              </>
            )}

          </motion.button>

        </form>

        {/* SECURITY INFO */}
        <div className="admin-security">

          <div className="security-dot"></div>

          <span>
            Protected admin authentication
          </span>

          <span className="security-lock">
            🔒
          </span>

        </div>

      </motion.div>

      {/* FOOTER */}
      <motion.p
        className="admin-login-footer"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.7,
        }}
      >
        © 2026 Portfolio Admin · Secure Dashboard
      </motion.p>

    </div>
  );
}

export default AdminLogin;