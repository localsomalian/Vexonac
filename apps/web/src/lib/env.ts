export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  API_URL: process.env.NEXT_PUBLIC_API_URL as string,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL as string,
  WEB_APP_WEBSOCKET_URL: process.env
    .NEXT_PUBLIC_WEB_APP_WEBSOCKET_URL as string,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN as string,
  INGRESS_API_URL: process.env.NEXT_PUBLIC_INGRESS_API_URL as string,
  INGRESS_API_WEBSOCKET_URL: process.env
    .NEXT_PUBLIC_INGRESS_API_WEBSOCKET_URL as string,
  PORT: (process.env.PORT_SERVER || 3000) as string,
};

if (typeof window === "undefined") {
  console.log(`Running in ${env.NODE_ENV} environment`);
}
