"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpcClient } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Info, Send, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface ConfigOption {
  value: any;
  label: string;
  tooltip: string;
  type: string;
  placeholder?: string;
  values?: Array<{ value: number | string; label: string }>;
}

interface ConfigOptionCardProps {
  category: string;
  optionKey: string;
  option: ConfigOption;
  onChange: (value: any) => void;
  disabled?: boolean;
  serverId?: string;
}

function ConfigOptionCardComponent({
  category,
  optionKey,
  option,
  onChange,
  disabled,
  serverId,
}: ConfigOptionCardProps) {
  const [newItem, setNewItem] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const isWebhookField = optionKey.toLowerCase().includes("webhook") && option.type === "string";

  const handleTestWebhook = useCallback(async () => {
    if (!serverId || !option.value) return;
    setIsTesting(true);
    try {
      await trpcClient.servers.testWebhook.mutate({ serverId, webhookUrl: option.value, webhookName: option.label || optionKey });
      toast.success("Test message sent to webhook!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send test message");
    } finally {
      setIsTesting(false);
    }
  }, [serverId, option.value, option.label, optionKey]);

  const MAX_CHARACTERS = 100000; // 100k characters

  const clearError = useCallback(() => {
    if (errorMessage) {
      setErrorMessage("");
    }
  }, [errorMessage]);

  const processItems = useCallback(
    (items: string[]) => {
      // Filter out empty items and duplicates (case insensitive)
      const validItems = items
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .filter(
          (item) =>
            !option.value.some(
              (existingItem: string) =>
                existingItem.toLowerCase() === item.toLowerCase()
            )
        );

      // Remove duplicates from the new items themselves
      const uniqueItems = validItems.filter(
        (item, index, array) =>
          array.findIndex(
            (otherItem) => otherItem.toLowerCase() === item.toLowerCase()
          ) === index
      );

      return uniqueItems;
    },
    [option.value]
  );

  const handleAddItems = useCallback(
    (items: string[]) => {
      const processedItems = processItems(items);
      const currentCharCount = option.value.join('').length;
      const newCharCount = processedItems.join('').length;
      const totalCharactersAfterAdd = currentCharCount + newCharCount;

      if (totalCharactersAfterAdd > MAX_CHARACTERS) {
        const remainingCharacters = MAX_CHARACTERS - currentCharCount;
        setErrorMessage(
          `Cannot add items. Maximum limit of ${MAX_CHARACTERS.toLocaleString()} characters would be exceeded. You have ${remainingCharacters.toLocaleString()} characters remaining.`
        );
        return;
      }

      if (processedItems.length > 0) {
        onChange([...option.value, ...processedItems]);
        clearError();
      }
    },
    [processItems, option.value, onChange, clearError]
  );

  const handleAddItem = useCallback(() => {
    const trimmedItem = newItem.trim();
    if (trimmedItem) {
      handleAddItems([trimmedItem]);
      setNewItem("");
    }
  }, [newItem, handleAddItems]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");

      // Split by commas first, then by newlines
      const items = pastedText
        .split(/[,\n\r]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (items.length > 1) {
        // Multiple items detected, add them all
        handleAddItems(items);
        setNewItem("");
      } else {
        // Single item or empty, just set it in the input
        setNewItem(pastedText.trim());
      }
    },
    [handleAddItems]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const trimmedItem = newItem.trim();
        if (trimmedItem) {
          handleAddItems([trimmedItem]);
          setNewItem("");
        }
      }
    },
    [newItem, handleAddItems]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewItem(e.target.value);
      clearError();
    },
    [clearError]
  );

  const handleStringChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  const handleSwitchChange = useCallback(
    (checked: boolean) => {
      onChange(checked);
    },
    [onChange]
  );

  const handleRemoveItem = useCallback(
    (idx: number) => {
      onChange(option.value.filter((_: string, i: number) => i !== idx));
      clearError();
    },
    [onChange, option.value, clearError]
  );

  const handleClearAll = useCallback(() => {
    onChange([]);
    clearError();
  }, [onChange, clearError]);

  const handleSelectAllItems = useCallback(() => {
    onChange((option.values || []).map((v: any) => v.value));
  }, [onChange, option.values]);

  const handleSelectNoItems = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleToggleItem = useCallback(
    (itemValue: any, isSelected: boolean) => {
      if (isSelected) {
        onChange(option.value.filter((v: any) => v !== itemValue));
      } else {
        onChange([...option.value, itemValue]);
      }
    },
    [onChange, option.value]
  );

  const handleSelectChange = useCallback(
    (value: string) => {
      if (value === "all") {
        handleSelectAllItems();
      } else if (value === "none") {
        handleSelectNoItems();
      }
    },
    [handleSelectAllItems, handleSelectNoItems]
  );

  const renderInput = useMemo(() => {
    switch (option.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-end">
            <Switch
              id={`${category}-${optionKey}`}
              checked={option.value}
              onCheckedChange={handleSwitchChange}
              disabled={disabled}
            />
          </div>
        );

      case "string":
        return (
          <div className="pt-1 pb-2 px-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <Input
                id={`${category}-${optionKey}`}
                value={option.value}
                onChange={handleStringChange}
                placeholder={option.placeholder || ""}
                disabled={disabled}
                className="w-full"
              />
              {isWebhookField && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={disabled || isTesting || !option.value}
                  onClick={handleTestWebhook}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {isTesting ? "..." : "Test"}
                </Button>
              )}
            </div>
          </div>
        );

      case "number":
        return (
          <div className="pt-1 pb-2 px-3">
            <Input
              id={`${category}-${optionKey}`}
              type="number"
              value={option.value}
              onChange={handleNumberChange}
              disabled={disabled}
              className="w-full"
            />
          </div>
        );

      case "list":
        return (
          <div className="p-3">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <Input
                  value={newItem}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  placeholder={option.placeholder || "Add item or paste comma/newline separated items..."}
                  className="flex-1"
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={disabled}
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={disabled || option.value.length === 0}
                >
                  Clear All
                </Button>
              </div>
              
              {/* Character count and error message */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {option.value.join('').length.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} characters ({option.value.length} items)
                </span>
                {errorMessage && (
                  <span className="text-destructive">{errorMessage}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-1">
                {option.value.length === 0 ? (
                  <span className="text-sm text-muted-foreground italic">
                    No items added
                  </span>
                ) : (
                  option.value.map((item: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {item}
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="ml-1 rounded-full hover:bg-muted"
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case "transferlist":
        // For transferlists (like explosion types), show as a select
        return (
          <div className="p-3">
            <div className="flex flex-col gap-2 w-full">
              <Select
                value={String(option.value.length)}
                onValueChange={handleSelectChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={`${option.value.length} items selected`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select All</SelectItem>
                  <SelectItem value="none">Select None</SelectItem>
                  <SelectItem value={String(option.value.length)}>
                    {option.value.length} items selected
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                <div className="flex flex-wrap gap-2">
                  {(option.values || []).map((item: any) => {
                    const isSelected = option.value.includes(item.value);
                    return (
                      <Badge
                        key={item.value}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleToggleItem(item.value, isSelected)}
                      >
                        {item.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unsupported option type: {option.type}</div>;
    }
  }, [
    category,
    disabled,
    errorMessage,
    handleAddItem,
    handleClearAll,
    handleInputChange,
    handleKeyDown,
    handleNumberChange,
    handlePaste,
    handleRemoveItem,
    handleSelectChange,
    handleStringChange,
    handleSwitchChange,
    handleToggleItem,
    newItem,
    option,
    optionKey,
  ]);

  const renderTooltip = useCallback(
    (content: string) => (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center justify-center"
              aria-label="More information"
              onClick={(e) => e.preventDefault()}
            >
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs text-xs"
            sideOffset={5}
          >
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    []
  );

  // For boolean options, render a more compact layout
  if (option.type === "boolean") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-2 px-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors",
          disabled && "opacity-70"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Label
            htmlFor={`${category}-${optionKey}`}
            className="font-medium cursor-pointer truncate text-sm"
          >
            {option.label}
          </Label>
          {renderTooltip(option.tooltip)}
        </div>
        {renderInput}
      </div>
    );
  }

  // For other option types, use a different layout
  return (
    <div className={cn("border-b last:border-b-0", disabled && "opacity-70")}>
      <div className="p-3 pb-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{option.label}</h4>
          {renderTooltip(option.tooltip)}
        </div>
      </div>
      {renderInput}
    </div>
  );
}

// Custom equality function to prevent unnecessary re-renders
function configOptionPropsAreEqual(
  prevProps: ConfigOptionCardProps,
  nextProps: ConfigOptionCardProps
): boolean {
  // Always re-render if disabled state changes
  if (prevProps.disabled !== nextProps.disabled) {
    return false;
  }

  // Always re-render if category or key changes (should be rare)
  if (
    prevProps.category !== nextProps.category ||
    prevProps.optionKey !== nextProps.optionKey
  ) {
    return false;
  }

  // Check if the label or tooltip changed
  if (
    prevProps.option.label !== nextProps.option.label ||
    prevProps.option.tooltip !== nextProps.option.tooltip
  ) {
    return false;
  }

  // For most input types, we only care if the value changed
  if (
    prevProps.option.type !== "transferlist" &&
    prevProps.option.type !== "list"
  ) {
    return prevProps.option.value === nextProps.option.value;
  }

  // For array types (list/transferlist), do shallow array comparison
  if (
    Array.isArray(prevProps.option.value) &&
    Array.isArray(nextProps.option.value)
  ) {
    // If lengths differ, they're definitely different
    if (prevProps.option.value.length !== nextProps.option.value.length) {
      return false;
    }

    // For small arrays, simple comparison is fast
    if (prevProps.option.value.length < 20) {
      return prevProps.option.value.every(
        (val, idx) => val === nextProps.option.value[idx]
      );
    }

    // For larger arrays, convert to string for faster comparison
    // This is a safe optimization for primitive values
    return (
      JSON.stringify(prevProps.option.value) ===
      JSON.stringify(nextProps.option.value)
    );
  }

  // Default case - deep comparison
  return JSON.stringify(prevProps.option) === JSON.stringify(nextProps.option);
}

// Memoize the component to prevent unnecessary re-renders
export const ConfigOptionCard = React.memo(
  ConfigOptionCardComponent,
  configOptionPropsAreEqual
);
