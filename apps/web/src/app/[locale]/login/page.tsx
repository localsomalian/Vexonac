"use client";

import { LogInCard } from "@/components/log-in-card";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl");

  const { data: session } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      // Redirect to callback URL if provided, otherwise go to dashboard
      const redirectTo = callbackUrl || "/dashboard";
      router.push(redirectTo);
    }
  }, [session, callbackUrl, router]);

  return (
    <div className="flex w-full h-screen justify-center items-center">
      <LogInCard error={error} />
    </div>
  );
}
