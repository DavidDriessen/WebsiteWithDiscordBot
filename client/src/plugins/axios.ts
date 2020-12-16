import axios from "axios";

axios.interceptors.request.use(
  request => {
    if (request.headers && request.url && request.url.startsWith("/")) {
      request.headers.Authorization = localStorage.token
        ? `Bearer ${localStorage.token}`
        : undefined;
    }
    return request;
  },
  error => {
    return error;
  }
);

export default axios;
