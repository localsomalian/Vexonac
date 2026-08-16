"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: (vars: { username: string; password: string }) =>
      trpc.adminAuth.login.mutate(vars),
    onSuccess: () => {
      toast.success("Signed in to admin panel");
      router.push("/dashboard/admin");
      router.refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Invalid credentials"),
  });

  const handleSubmit = () => {
    if (!username.trim() || !password) return;
    login.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="border border-border/50 rounded-xl bg-card p-8 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <p className="text-xs text-muted-foreground text-center">
              Sign in with your admin credentials
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={login.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={login.isPending}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!username.trim() || !password || login.isPending}
          >
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
