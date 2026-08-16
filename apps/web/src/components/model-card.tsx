"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllModels, type Model, type ModelType } from "@/lib/models-data";
import { useScopedI18n } from "@/locales/client";
import {
  Bomb,
  Car,
  Copy,
  Hash,
  Package,
  User,
  ZoomIn,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// Get model image URL
const getModelImageUrl = (model: Model): string => {
  const name = model.name.toLowerCase();

  switch (model.type) {
    case "vehicle":
      return `https://docs.fivem.net/vehicles/${name}.webp`;
    case "ped":
      return `https://docs.fivem.net/peds/${name}.webp`;
    case "weapon":
      return `https://docs.fivem.net/weapons/${name.toUpperCase()}.png`;
    case "object":
      return `https://gta-objects.xyz/gallery/objects/${name}.jpg`;
    default:
      return "";
  }
};

interface ModelCardProps {
  modelName: string;
  compact?: boolean;
  onClick?: (model: Model) => void;
  showActions?: boolean;
}

export function ModelCard({ 
  modelName, 
  compact = false, 
  onClick,
  showActions = true 
}: ModelCardProps) {
  const t = useScopedI18n("models");
  
  // Find the model in the data
  const allModels = getAllModels();
  const model = allModels.find(m => {
    // Check by name (case insensitive)
    if (m.name.toLowerCase() === modelName.toLowerCase()) return true;
    
    // Check by hash (handle both string and number types)
    if (typeof m.hash === 'number') {
      // For numeric hashes (explosions), compare with both string and number forms
      return m.hash.toString() === modelName || m.hash === parseInt(modelName);
    } else {
      // For string hashes, direct comparison
      return m.hash === modelName;
    }
  });

  if (!model) {
    return (
      <Card className={`${compact ? 'w-64' : 'w-full'} border-destructive/20`}>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Model not found: <code>{modelName}</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Model type configuration
  const MODEL_TYPE_CONFIG = {
    vehicle: {
      icon: <Car className="h-4 w-4" />,
      label: t("vehicle"),
      color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    },
    ped: {
      icon: <User className="h-4 w-4" />,
      label: t("ped"),
      color: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    weapon: {
      icon: <Zap className="h-4 w-4" />,
      label: t("weapon"),
      color: "bg-red-500/10 text-red-600 border-red-500/20",
    },
    object: {
      icon: <Package className="h-4 w-4" />,
      label: t("object"),
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    },
    explosion: {
      icon: <Bomb className="h-4 w-4" />,
      label: t("explosion"),
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
  };

  const typeConfig = MODEL_TYPE_CONFIG[model.type];
  const imageUrl = getModelImageUrl(model);

  const copyToClipboard = (text: string, type: "name" | "hash") => {
    navigator.clipboard.writeText(text);
    toast.success(type === "name" ? t("name_copied") : t("hash_copied"));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = "none";
    
    // Show fallback
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  if (compact) {
    return (
      <Card className="w-64 overflow-hidden hover:shadow-md transition-shadow pt-0 gap-2 pb-1">
        <div className="aspect-square relative bg-muted/50">
          {model.type === 'explosion' ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground cursor-pointer hover:scale-105 transition-transform duration-200"
                 onClick={() => onClick?.(model)}>
              <Bomb className="h-12 w-12" />
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={`${model.name} - ${typeConfig.label} model`}
              className="absolute inset-0 w-full h-full object-contain p-2 cursor-pointer hover:scale-105 transition-transform duration-200"
              onError={handleImageError}
              onClick={() => onClick?.(model)}
            />
          )}
          <div className="absolute inset-0 items-center justify-center hidden text-muted-foreground">
            <Package className="h-8 w-8" />
          </div>
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className={`${typeConfig.color} flex items-center gap-1 text-xs h-6 px-2`}
            >
              {typeConfig.icon}
              <span className="text-xs">{typeConfig.label}</span>
            </Badge>
          </div>
          {onClick && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black/50 rounded-full p-2">
                <ZoomIn className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-3 space-y-2">
          {/* Model Name */}
          <div className="flex items-center gap-1">
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono flex-1 min-w-0 truncate">
              {model.name}
            </code>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(model.name, "name")}
                className="h-6 w-6 p-0 flex-shrink-0"
                title={`Copy model name: ${model.name}`}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Model Hash */}
          <div className="flex items-center gap-1">
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono flex-1 min-w-0 truncate">
              {typeof model.hash === 'number' ? model.hash.toString() : model.hash}
            </code>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(typeof model.hash === 'number' ? model.hash.toString() : model.hash, "hash")}
                className="h-6 w-6 p-0 flex-shrink-0"
                title={`Copy hash: ${typeof model.hash === 'number' ? model.hash.toString() : model.hash}`}
              >
                <Hash className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full size card (for regular models page)
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-muted/50">
        {model.type === 'explosion' ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground cursor-pointer hover:scale-105 transition-transform duration-200"
               onClick={() => onClick?.(model)}>
            <Bomb className="h-16 w-16" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`${model.name} - ${typeConfig.label} model`}
            className="absolute inset-0 w-full h-full object-contain p-1.5 cursor-pointer hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
            onClick={() => onClick?.(model)}
          />
        )}
        <div className="absolute inset-0 items-center justify-center hidden text-muted-foreground">
          <Package className="h-8 w-8" />
        </div>
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className={`${typeConfig.color} flex items-center gap-1 text-xs h-6 px-2`}
          >
            {typeConfig.icon}
            <span className="hidden lg:inline text-xs">{typeConfig.label}</span>
          </Badge>
        </div>
        {onClick && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black/50 rounded-full p-2">
              <ZoomIn className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-2 flex-1 flex flex-col">
        <div className="space-y-1.5 flex-1">
          {/* Model Name */}
          <div className="flex items-center gap-1">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono flex-1 min-w-0 truncate">
              {model.name}
            </code>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(model.name, "name")}
                className="h-5 w-5 p-0 flex-shrink-0"
                title={`Copy model name: ${model.name}`}
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Model Hash */}
          <div className="flex items-center gap-1">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono flex-1 min-w-0 truncate">
              {typeof model.hash === 'number' ? model.hash.toString() : model.hash}
            </code>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(typeof model.hash === 'number' ? model.hash.toString() : model.hash, "hash")}
                className="h-5 w-5 p-0 flex-shrink-0"
                title={`Copy hash: ${typeof model.hash === 'number' ? model.hash.toString() : model.hash}`}
              >
                <Hash className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { type Model, type ModelType, getAllModels }; 