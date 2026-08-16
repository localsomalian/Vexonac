import React from "react";

/**
 * Formats a string with color codes (^0-^9) into colored text spans
 * @param text The string containing color codes to format
 * @returns React fragment with colored text spans
 */
export function formatServerName(text?: string): React.ReactNode {
  if (!text) return null;

  // Color mapping based on color codes
  const colorMap: Record<string, string> = {
    "^0": "text-foreground",
    "^1": "text-red-500",
    "^2": "text-green-500",
    "^3": "text-yellow-500",
    "^4": "text-violet-500",
    "^5": "text-sky-400", // Light blue
    "^6": "text-purple-500",
    "^7": "text-foreground",
    "^8": "text-orange-500",
    "^9": "text-gray-500",
  };

  // Split the string by color codes
  const colorRegex = /(\^[0-9])/g;
  const parts = text.split(colorRegex);

  // Start with default color if no color code at the beginning
  let currentColor = "text-foreground";
  const result: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    // If this part is a color code, update the current color
    if (colorMap[part]) {
      currentColor = colorMap[part];
      return;
    }

    // If there's text to display, create a colored span
    if (part.length > 0) {
      result.push(
        <span key={index} className={currentColor}>
          {part}
        </span>
      );
    }
  });

  return <>{result}</>;
}
