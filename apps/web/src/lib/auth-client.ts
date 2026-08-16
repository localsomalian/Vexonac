import { createAuthClient } from "better-auth/react";
import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.API_URL,
});

export const signIn = async () => {
  await authClient.signIn.social({
    provider: "discord",
    callbackURL: `${env.APP_URL}/dashboard`,
    errorCallbackURL: `${env.APP_URL}/login`,
    newUserCallbackURL: `${env.APP_URL}/dashboard?newUser=true`,
  });
};

export const signOut = async (onSuccess: () => void) => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess,
    },
  });
};
