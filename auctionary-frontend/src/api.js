import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers["X-Authorization"] = token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
