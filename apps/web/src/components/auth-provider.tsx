"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: any;
  user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthProvider({
  children,
  requireAuth = false,
  redirectTo = "/login",
  fallback,
}: AuthProviderProps) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(requireAuth);

  useEffect(() => {
    if (!isPending) {
      setIsLoading(false);

      if (requireAuth) {
        if (!session) {
          router.push(redirectTo);
        } else {
          setIsChecking(false);
        }
      }
    }
  }, [session, isPending, requireAuth, redirectTo, router]);

  const value: AuthContextType = {
    isAuthenticated: !!session,
    isLoading: isLoading || isPending,
    session,
    user: session?.user,
  };

  // Show loading state while checking authentication
  if (isPending || isLoading || (requireAuth && isChecking)) {
    return (
      <AuthContext.Provider value={value}>
        {fallback || (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">
                {requireAuth ? "Checking authentication..." : "Loading..."}
              </p>
            </div>
          </div>
        )}
      </AuthContext.Provider>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !session) {
    return <AuthContext.Provider value={value}>{null}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
