import { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../../public/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/components/user/useUser";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useUser();
  const navigate = useNavigate();

  async function submitHandler(event: FormEvent) {
    event.preventDefault();
    try {
      await register(email, password);
      navigate("/decks");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="Commander's Toolbox logo" className="mx-auto h-14 w-auto" />
          <CardTitle className="font-display text-2xl text-primary">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitHandler} className="grid gap-4">
            {error && <p className="text-destructive font-bold text-sm">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              Register
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <NavLink to="/login" className="text-primary underline">
                Login
              </NavLink>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
