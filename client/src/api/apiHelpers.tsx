import { AxiosError } from "axios";

export function axiosErrorWrapper(err: Error) {
  const error = err as AxiosError;
  if (error.response) {
    throw new Error(`${error.response.status}: ${error.response.statusText}`);
  } else if (error.request) {
    throw new Error(`${error.request}`);
  } else {
    throw new Error("An unknown error occurred");
  }
}
