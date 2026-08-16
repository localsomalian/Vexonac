"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ModelCard } from "./model-card";
import { useState } from "react";

interface ModelHoverCardProps {
  modelName: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function ModelHoverCard({
  modelName,
  children,
  side = "top",
  align = "center",
}: ModelHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    // Prevent the click from bubbling up
    e.stopPropagation();
    
    // Toggle the hover card on mobile
    if ('ontouchstart' in window) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleTriggerTouch = (e: React.TouchEvent) => {
    // Handle touch events for mobile
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <HoverCard 
      open={isOpen} 
      onOpenChange={setIsOpen}
      openDelay={100} 
      closeDelay={200}
    >
      <HoverCardTrigger asChild>
        <div
          onClick={handleTriggerClick}
          onTouchEnd={handleTriggerTouch}
          style={{ touchAction: 'manipulation' }}
        >
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        className="w-auto p-0 border-0 shadow-lg"
        sideOffset={8}
        onPointerDownOutside={() => setIsOpen(false)}
        onEscapeKeyDown={() => setIsOpen(false)}
      >
        <ModelCard 
          modelName={modelName} 
          compact={true} 
          showActions={false}
        />
      </HoverCardContent>
    </HoverCard>
  );
} 