import { env } from "./env";

export const emitToServer = async (
  serverId: string,
  eventName: string,
  data?: any,
  shouldAwait = true
) => {
  try {
    const url = `${env.INGRESS_API_URL}/api/server/${serverId}/event`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INGRESS_API_KEY}`,
      },
      body: JSON.stringify({ eventName, data, shouldAwait }),
    });

    if (!response.ok) {
      throw new Error(`Failed to emit event to server: ${response.status} ${response.statusText}`);
    }

    const res = await response.json();
    return res.response;
  } catch (error) {
    console.error(`❌ Error emitting ${eventName} to server ${serverId}:`, error);
    return null;
  }
};
