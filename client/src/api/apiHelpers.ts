import { AxiosError, isAxiosError } from "axios";

export function axiosErrorWrapper(err: Error) {
  const error = err as AxiosError;

  if (!isAxiosError(err)) {
    throw new Error("An unknown error occurred");
  }

  if (error.response) {
    throw new Error(`${error.response.status}: ${error.response.statusText}`);
  } else if (error.request) {
    throw new Error("Network error: Unable to reach server");
  } else {
    throw new Error("An unknown error occurred");
  }
}
