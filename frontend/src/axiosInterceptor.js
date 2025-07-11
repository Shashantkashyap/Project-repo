import axios from "axios";

axios.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data &&
      error.response.data.error === "Not authenticated"
    ) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
    }
    return Promise.reject(error);
  }
);
