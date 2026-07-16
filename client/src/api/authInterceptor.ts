import axios from "axios";

interface ResponseError {
  response?: { status?: number };
  config?: { url?: string };
}

function isResponseError(error: unknown): error is ResponseError {
  return typeof error === "object" && error !== null;
}

export function onResponseError(error: unknown): Promise<never> {
  if (isResponseError(error)) {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    if (status === 401 && url.startsWith("/api")) {
      localStorage.removeItem("idToken");
      window.location.assign("/login");
    }
  }

  return Promise.reject(error);
}

export function registerAuthInterceptor(): void {
  axios.interceptors.response.use((response) => response, onResponseError);
}
