import axios from "axios";

const TOKEN_KEY = "auth_token";

const api = axios.create({
  baseURL: (window as any).APP_CONFIG?.API_BASE_URL || "/api", // Default to relative path if no config found
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers["X-Auth-Token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized access");
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem("user_data");
      // window.location.href = "/login"; // Disabled auto-redirect
    }
    return Promise.reject(error);
  },
);

export default api;
