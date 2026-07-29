import axios from "axios";

// Environment setup for Vite / CRA / Node fallback
const envMode =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.MODE) ||
    (typeof process !== "undefined" && process.env && process.env.NODE_ENV) ||
    "dev";
const APP_ENV = envMode === "production" ? "production" : "dev";

let server = "";

switch (APP_ENV) {
    case "production":
        server = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || "https://ukl-backend-uda2.onrender.com";
        break;

    case "dev":
    case "local":
    default:
        server = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:5000";
        break;
}

// Ensure no trailing slash
server = server.replace(/\/$/, "");

const IMAGE_BASE_URL = `${server}/uploads`;
const BASE_URL = `${server}/api/admin`;
const API_BASE = server;

export { IMAGE_BASE_URL, BASE_URL, server, API_BASE };

// Create Axios Instance
export const apiClient = axios.create({
    baseURL: BASE_URL,
});

// Request Interceptor: Attach Auth Token & Set Headers
apiClient.interceptors.request.use(
    function (config) {
        const token =
            localStorage.getItem("adminToken") || localStorage.getItem("userToken");

        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            config.headers["Content-Type"] = "multipart/form-data";
        } else {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Unauthorized (401) responses
apiClient.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        if (
            error.response?.status === 401 &&
            !error.config?.url?.includes("/auth/login")
        ) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            localStorage.removeItem("adminSessionId");
            localStorage.removeItem("userToken");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default apiClient;