import axios from "axios";

// ✅ Set the base URL and ensure cookies are sent with each request
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

// ✅ Axios response interceptor to handle 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data &&
      error.response.data.error === "Not authenticated"
    ) {
      // Clear token & redirect
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
    }
    return Promise.reject(error);
  }
);

export default axios;
