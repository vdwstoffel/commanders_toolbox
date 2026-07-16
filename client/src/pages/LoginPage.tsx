import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/components/user/useUser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useUser();
  const navigate = useNavigate();

  async function submitHandler(event: FormEvent) {
    event.preventDefault();
    try {
      await login(email, password);
      navigate("/decks");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={submitHandler} className="w-72 sm:w-90 mx-auto mt-10">
      <div className="grid gap-4 py-4">
        {error && <p className="text-red-500 font-bold">{error}</p>}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit">Login</Button>
        <p className="text-sm text-center">
          No account?{" "}
          <NavLink to="/register" className="underline">
            Register
          </NavLink>
        </p>
      </div>
    </form>
  );
}
