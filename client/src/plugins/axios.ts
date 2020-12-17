import axios from "axios";

axios.interceptors.request.use(
  request => {
    if (localStorage.token && request.headers && request.url && request.url.startsWith("/")) {
      request.headers.Authorization = `Bearer ${localStorage.token}`;
    }
    return request;
  },
  error => {
    return error;
  }
);

export default axios;
