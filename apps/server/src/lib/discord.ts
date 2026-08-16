import { env } from "./env";

interface CrackAttemptData {
  licenseKey: string;
  ip: string;
  reason: string;
  details: string;
  version: string;
}

interface ErrorLogData {
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  ip?: string;
  requestBody?: any;
  requestQuery?: any;
  timestamp: Date;
  environment: string;
}

/**
 * Sends an alert to Discord about a crack attempt
 * @param data Information about the crack attempt
 * @returns Whether the alert was successfully sent
 */
export async function sendDiscordAlert(
  data: CrackAttemptData
): Promise<boolean> {
  try {
    const webhookUrl = env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("Discord webhook URL not configured");
      return false;
    }

    const hookObject = {
      content: "@everyone",
      username: "Anti Crackar",
      tts: true,
      embeds: [
        {
          title: "Someone tried to crack vexonac (v3) :/",
          type: "rich",
          description: `**License: ${data.licenseKey}\nIP: ${data.ip}\nVersion: ${data.version}\nReason: ${data.reason}\nDetails: \`\`\`${data.details}\`\`\`**`,
          color: parseInt("FFFFFF", 16),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hookObject),
    });

    if (!response.ok) {
      console.warn("Discord webhook failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord alert", error);
    return false;
  }
}

/**
 * Sends an error log to Discord
 * @param data Information about the error
 * @returns Whether the error log was successfully sent
 */
export async function sendErrorLog(data: ErrorLogData): Promise<boolean> {
  try {
    const webhookUrl = env.DISCORD_ERROR_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("Discord error webhook URL not configured");
      return false;
    }

    // Format request data if present
    let requestInfo = "";
    if (data.path) {
      requestInfo += `**Path:** ${data.path}\n`;
      requestInfo += `**Method:** ${data.method || "N/A"}\n`;
      requestInfo += `**IP:** ${data.ip || "Unknown"}\n`;

      if (data.requestQuery && Object.keys(data.requestQuery).length > 0) {
        requestInfo += `**Query Params:**\n\`\`\`json\n${JSON.stringify(
          data.requestQuery,
          null,
          2
        )}\n\`\`\`\n`;
      }

      if (data.requestBody && Object.keys(data.requestBody).length > 0) {
        requestInfo += `**Request Body:**\n\`\`\`json\n${JSON.stringify(
          data.requestBody,
          null,
          2
        )}\n\`\`\`\n`;
      }
    }

    // Create the Discord embed
    const hookObject = {
      username: "VexonAC Error Monitor",
      embeds: [
        {
          title: `âŒ Error in ${data.environment} environment`,
          color: 15158332, // Red color
          description: `**Error:** ${data.message}\n\n${requestInfo}`,
          fields: data.stack
            ? [
                {
                  name: "Stack Trace",
                  value: `\`\`\`\n${data.stack.substring(0, 1000)}${
                    data.stack.length > 1000 ? "..." : ""
                  }\n\`\`\``,
                },
              ]
            : [],
          timestamp: data.timestamp.toISOString(),
          footer: {
            text: `VexonAC Panel API v3 â€¢ ${data.environment}`,
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hookObject),
    });

    if (!response.ok) {
      console.warn("Discord error webhook failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord error alert", error);
    return false;
  }
}

