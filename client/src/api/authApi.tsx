import axios from "axios";

export class AuthApi {
  private base_url: string;

  constructor() {
    this.base_url = "/api/v1/auth";
  }

  async register(email: string, password: string): Promise<string> {
    try {
      const response: { data: { token: string } } = await axios.post(`${this.base_url}/register`, { email, password });
      return response.data.token;
    } catch (err) {
      throw new Error(extractError(err));
    }
  }

  async login(email: string, password: string): Promise<string> {
    try {
      const response: { data: { token: string } } = await axios.post(`${this.base_url}/login`, { email, password });
      return response.data.token;
    } catch (err) {
      throw new Error(extractError(err));
    }
  }
}

function extractError(err: unknown): string {
  const error = err as { response?: { data?: { message?: string }; statusText?: string } };
  return error.response?.data?.message || error.response?.statusText || "Something went wrong";
}
