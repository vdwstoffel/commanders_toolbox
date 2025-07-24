import { AxiosError } from "axios";

export function axiosErrorWrapper(error: AxiosError) {
  if (error.response) {
    throw new Error(`${error.response.status}: ${error.response.statusText}`);
  } else if (error.request) {
    throw new Error("Network error: Unable to reach server");
  } else {
    throw new Error("An unknown error occurred");
  }
}
