const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const PROJECTS_API_URL = `${API_BASE_URL}/projects`;
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;
export const SETTINGS_API_URL = `${API_BASE_URL}/settings`;