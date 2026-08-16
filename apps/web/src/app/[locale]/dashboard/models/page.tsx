"use client";
import { ContentLayout } from "@/components/content-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllModels, type Model, type ModelType } from "@/lib/models-data";
import { useScopedI18n } from "@/locales/client";
import {
  Bomb,
  Car,
  Copy,
  Filter,
  Grid3X3,
  Hash,
  List,
  Package,
  Search,
  User,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";
import Head from "next/head";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { WhitelistBlacklistButtons } from "@/components/whitelist-blacklist-buttons";

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
    case "explosion":
      return `https://docs.fivem.net/explosions/${name}.webp`;
    default:
      return "";
  }
};

export default function ServerModelsPage() {
  const t = useScopedI18n("models");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Model type icons and labels with translations
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

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ModelType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fullscreenImage, setFullscreenImage] = useState<{
    url: string;
    model: Model;
  } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const itemsPerPage = 35;

  // Initialize state from URL parameters
  useEffect(() => {
    if (!hasInitialized) {
      const urlSearch = searchParams.get("search") || "";
      const urlType = searchParams.get("type") as ModelType | "all" || "all";
      const urlPage = parseInt(searchParams.get("page") || "1", 10);
      const urlView = searchParams.get("view") as "grid" | "list" || "grid";

      // Validate type parameter
      const validTypes: (ModelType | "all")[] = ["all", "vehicle", "ped", "weapon", "object", "explosion"];
      const validType = validTypes.includes(urlType) ? urlType : "all";

      // Validate view parameter  
      const validView = ["grid", "list"].includes(urlView) ? urlView : "grid";

      setSearchQuery(urlSearch);
      setFilterType(validType);
      setCurrentPage(Math.max(1, urlPage));
      setViewMode(validView);
      setHasInitialized(true);
    }
  }, [searchParams, hasInitialized]);

  // Update URL when state changes
  const updateUrl = useCallback((updates: {
    search?: string;
    type?: ModelType | "all";
    page?: number;
    view?: "grid" | "list";
  }) => {
    if (!hasInitialized) return;
    
    const params = new URLSearchParams(searchParams);
    
    // Update search parameter
    if (updates.search !== undefined) {
      if (updates.search.trim()) {
        params.set("search", updates.search.trim());
      } else {
        params.delete("search");
      }
    }
    
    // Update type parameter
    if (updates.type !== undefined) {
      if (updates.type !== "all") {
        params.set("type", updates.type);
      } else {
        params.delete("type");
      }
    }
    
    // Update page parameter
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set("page", updates.page.toString());
      } else {
        params.delete("page");
      }
    }
    
    // Update view parameter
    if (updates.view !== undefined) {
      if (updates.view !== "grid") {
        params.set("view", updates.view);
      } else {
        params.delete("view");
      }
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router, hasInitialized]);

  // Get all models
  const allModels = useMemo(() => getAllModels(), []);

  // Filter and search models
  const filteredModels = useMemo(() => {
    let filtered = allModels;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((model) => model.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          (typeof model.hash === 'string' ? model.hash.toLowerCase() : model.hash.toString()).includes(query)
      );
    }

    return filtered;
  }, [allModels, filterType, searchQuery]);

  // Paginated results
  const paginatedModels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredModels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredModels, currentPage]);

  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);

  // Copy to clipboard function
  const copyToClipboard = (text: string, type: "name" | "hash") => {
    navigator.clipboard.writeText(text);
    const message = type === "name" ? t("name_copied") : t("hash_copied");
    toast.success(message);
  };

  // Quick filter function
  const quickFilter = (type: ModelType | "all") => {
    setFilterType(type);
    setCurrentPage(1);
    updateUrl({ type, page: 1 });
  };

  // Handle image click for fullscreen view
  const handleImageClick = (model: Model) => {
    const imageUrl = getModelImageUrl(model);
    setFullscreenImage({ url: imageUrl, model });
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const parent = img.parentElement;

    if (parent && !parent.querySelector(".fallback-icon")) {
      // Hide the broken image
      img.style.display = "none";

      // Get model type from the nearest element with data-model-type
      const card = img.closest("[data-model-type]");
      const modelType = card?.getAttribute("data-model-type") || "object";

      // Create fallback content
      const fallback = document.createElement("div");
      fallback.className =
        "fallback-icon absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/50";

      let iconSvg = "";
      switch (modelType) {
        case "vehicle":
          iconSvg =
            '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>';
          break;
        case "ped":
          iconSvg =
            '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
          break;
        case "weapon":
          iconSvg =
            '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
          break;
        case "explosion":
          iconSvg =
            '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm7.07-5.93L7.05 8.09A3.5 3.5 0 005.5 11.5c0 .28.03.55.08.82l1.42-1.42a1.5 1.5 0 011.06-.44zm3.36 0l2.02 2.02a3.5 3.5 0 011.55 3.41c0-.28-.03-.55-.08-.82l-1.42 1.42a1.5 1.5 0 01-1.06.44zM12 19a7 7 0 007-7c0-.34-.03-.67-.08-1L12 18z"></path></svg>';
          break;
        default:
          iconSvg =
            '<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
      }

      fallback.innerHTML = iconSvg;
      parent.appendChild(fallback);
    }
  };

  // SEO data
  const pageTitle = `GTA V Models Database - VexonAC"
  )}`;
  const pageDescription =
    "Complete GTA V models database with over 22,000+ vehicles, peds, weapons, and objects. Search by name or hash with images and identifiers.";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const defaultImage = getModelImageUrl(
    allModels[0] || {
      name: "adder",
      type: "vehicle" as ModelType,
      hash: "0xB779A091",
    }
  );

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GTA V Models Database",
    description: pageDescription,
    url: currentUrl,
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    featureList: [
      "Search GTA V models by name or hash",
      "Browse vehicles, peds, weapons, and objects",
      "View model images and identifiers",
      "Copy model names and hashes",
      "Filter by model type",
    ],
    keywords:
      "GTA V, Grand Theft Auto, models, vehicles, peds, weapons, objects, database, lookup, search, hash, identifiers",
  };

  return (
    <ContentLayout
      title={t("title")}
      breadcrumb={{
        title: t("dashboard"),
        url: `/dashboard`,
      }}
    >
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content="GTA V models, Grand Theft Auto models, vehicle database, ped database, weapon database, object database, GTA V lookup, game models, 3D models, GTA modding, FiveM models"
        />
        <meta name="author" content="VexonAC" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content={defaultImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:site_name"
          content="VexonAC - GTA V Models Database"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={defaultImage} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete database with {allModels.length.toLocaleString()} GTA V
              models including vehicles, peds, weapons, and objects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {t("models_count", {
                count: filteredModels.length.toLocaleString(),
              })}
            </Badge>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("grid");
                  updateUrl({ view: "grid" });
                }}
                className="h-8 w-8 p-0"
                title={t("grid_view")}
                aria-label="Switch to grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("list");
                  updateUrl({ view: "list" });
                }}
                className="h-8 w-8 p-0"
                title={t("list_view")}
                aria-label="Switch to list view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Quick Category Filters */}
        <nav
          aria-label="Model category filters"
          className="flex flex-wrap gap-2"
        >
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => quickFilter("all")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            aria-pressed={filterType === "all"}
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">
              {t("all_models", { count: allModels.length })}
            </span>
            <span className="xs:hidden">All ({allModels.length})</span>
          </Button>
          <Button
            variant={filterType === "vehicle" ? "default" : "outline"}
            size="sm"
            onClick={() => quickFilter("vehicle")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            aria-pressed={filterType === "vehicle"}
          >
            <Car className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">
              {t("vehicles_count", {
                count: allModels.filter((m) => m.type === "vehicle").length,
              })}
            </span>
            <span className="xs:hidden">
              Cars ({allModels.filter((m) => m.type === "vehicle").length})
            </span>
          </Button>
          <Button
            variant={filterType === "ped" ? "default" : "outline"}
            size="sm"
            onClick={() => quickFilter("ped")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            aria-pressed={filterType === "ped"}
          >
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">
              {t("peds_count", {
                count: allModels.filter((m) => m.type === "ped").length,
              })}
            </span>
            <span className="xs:hidden">
              Peds ({allModels.filter((m) => m.type === "ped").length})
            </span>
          </Button>
          <Button
            variant={filterType === "weapon" ? "default" : "outline"}
            size="sm"
            onClick={() => quickFilter("weapon")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            aria-pressed={filterType === "weapon"}
          >
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">
              {t("weapons_count", {
                count: allModels.filter((m) => m.type === "weapon").length,
              })}
            </span>
            <span className="xs:hidden">
              Weapons ({allModels.filter((m) => m.type === "weapon").length})
            </span>
          </Button>
          <Button
            variant={filterType === "object" ? "default" : "outline"}
            size="sm"
            onClick={() => quickFilter("object")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            aria-pressed={filterType === "object"}
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">
              {t("objects_count", {
                count: allModels.filter((m) => m.type === "object").length,
              })}
            </span>
            <span className="xs:hidden">
              Objects ({allModels.filter((m) => m.type === "object").length})
            </span>
          </Button>
          <Button
            variant={filterType === "explosion" ? "default" : "outline"}
            size="sm"
            onClick={() => quickFilter("explosion")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            aria-pressed={filterType === "explosion"}
          >
            <Bomb className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">
              {t("explosions_count", {
                count: allModels.filter((m) => m.type === "explosion").length,
              })}
            </span>
            <span className="xs:hidden">
              Explosions ({allModels.filter((m) => m.type === "explosion").length})
            </span>
          </Button>
        </nav>

        {/* Search and Filter Controls */}
        <section aria-label="Search and filters">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {t("search_filters")}
              </CardTitle>
              <CardDescription>
                {t("search_filters_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("search_placeholder")}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                        updateUrl({ search: e.target.value, page: 1 });
                      }}
                      className="pl-10 pr-10"
                      aria-label="Search GTA V models by name or hash"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                          updateUrl({ search: "", page: 1 });
                        }}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Type Filter */}
                <div className="w-full md:w-48">
                  <Select
                    value={filterType}
                    onValueChange={(value) => {
                      setFilterType(value as ModelType | "all");
                      setCurrentPage(1);
                      updateUrl({ type: value as ModelType | "all", page: 1 });
                    }}
                  >
                    <SelectTrigger aria-label="Filter by model type">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all_types")}</SelectItem>
                      <SelectItem value="vehicle">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          {t("vehicles")}
                        </div>
                      </SelectItem>
                      <SelectItem value="ped">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t("peds")}
                        </div>
                      </SelectItem>
                      <SelectItem value="weapon">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {t("weapons")}
                        </div>
                      </SelectItem>
                      <SelectItem value="object">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {t("objects")}
                        </div>
                      </SelectItem>
                      <SelectItem value="explosion">
                        <div className="flex items-center gap-2">
                          <Bomb className="h-4 w-4" />
                          {t("explosions")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchQuery || filterType !== "all") && (
                <div
                  className="flex flex-wrap items-center gap-2"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-sm text-muted-foreground">
                    {t("active_filters")}
                  </span>
                  {searchQuery && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {t("search_filter", { query: searchQuery })}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          updateUrl({ search: "" });
                        }}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        aria-label={`Remove search filter: ${searchQuery}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filterType !== "all" && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {t("type_filter", {
                        type: MODEL_TYPE_CONFIG[filterType].label,
                      })}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilterType("all");
                          updateUrl({ type: "all" });
                        }}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        aria-label={`Remove type filter: ${MODEL_TYPE_CONFIG[filterType].label}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Results */}
        <main role="main" aria-live="polite" aria-label="Models search results">
          {filteredModels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  {t("no_models_found")}
                </h2>
                <p className="text-muted-foreground text-center">
                  {searchQuery
                    ? t("no_models_search", { query: searchQuery })
                    : t("no_models_filter")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Models Grid/List */}
              {viewMode === "grid" ? (
                <section
                  aria-label={`${filteredModels.length} models found in grid view`}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4">
                    {paginatedModels.map((model, index) => {
                      const typeConfig = MODEL_TYPE_CONFIG[model.type];
                      const imageUrl = getModelImageUrl(model);

                      return (
                        <article
                          key={`${model.hash}-${index}`}
                          data-model-type={model.type}
                          className="overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <Card className="h-full flex flex-col pt-0 pb-2 gap-2">
                            <div className="aspect-square relative bg-muted/50">
                              <img
                                src={imageUrl}
                                alt={`${model.name} - ${typeConfig.label} model from GTA V`}
                                className="absolute inset-0 w-full h-full object-contain p-1.5 cursor-pointer hover:scale-105 transition-transform duration-200"
                                onError={handleImageError}
                                loading="lazy"
                                onClick={() => handleImageClick(model)}
                              />
                              <div className="absolute top-2 right-2">
                                <Badge
                                  variant="secondary"
                                  className={`${typeConfig.color} flex items-center gap-1 text-xs h-6 px-2`}
                                >
                                  {typeConfig.icon}
                                  <span className="hidden lg:inline text-xs">
                                    {typeConfig.label}
                                  </span>
                                </Badge>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <div className="bg-black/50 rounded-full p-2">
                                  <ZoomIn className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                            <CardContent className="p-2 flex-1 flex flex-col">
                              <div className="space-y-1.5 flex-1">
                                {/* Model Name */}
                                <div>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono flex-1 min-w-0 truncate">
                                      {model.name}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(model.name, "name")
                                      }
                                      className="h-5 w-5 p-0 flex-shrink-0"
                                      aria-label={`Copy model name: ${model.name}`}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Model Hash */}
                                <div>
                                  <div className="flex items-center gap-1">
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono flex-1 min-w-0 truncate">
                                      {typeof model.hash === 'number' ? model.hash.toString() : model.hash}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(typeof model.hash === 'number' ? model.hash.toString() : model.hash, "hash")
                                      }
                                      className="h-5 w-5 p-0 flex-shrink-0"
                                      aria-label={`Copy hash: ${model.hash}`}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Whitelist/Blacklist Buttons */}
                              <div className="pt-4 border-border/40 mt-auto">
                                <WhitelistBlacklistButtons
                                  model={model}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">
                              {t("preview")}
                            </th>
                            <th className="text-left p-4 font-medium">
                              {t("model_name")}
                            </th>
                            <th className="text-left p-4 font-medium">
                              {t("hash")}
                            </th>
                            <th className="text-left p-4 font-medium">
                              {t("type")}
                            </th>
                            <th className="text-left p-4 font-medium">
                              {t("actions")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedModels.map((model, index) => {
                            const typeConfig = MODEL_TYPE_CONFIG[model.type];
                            const imageUrl = getModelImageUrl(model);

                            return (
                              <tr
                                key={`${model.hash}-${index}`}
                                data-model-type={model.type}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="p-4">
                                  <div
                                    className="w-16 h-16 relative bg-muted/50 rounded group cursor-pointer"
                                    onClick={() => handleImageClick(model)}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={model.name}
                                      className="absolute inset-0 w-full h-full object-contain p-1 rounded group-hover:scale-105 transition-transform duration-200"
                                      onError={handleImageError}
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <div className="bg-black/50 rounded-full p-1">
                                        <ZoomIn className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                    {model.name}
                                  </code>
                                </td>
                                <td className="p-4">
                                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                    {typeof model.hash === 'number' ? model.hash.toString() : model.hash}
                                  </code>
                                </td>
                                <td className="p-4">
                                  <Badge
                                    variant="secondary"
                                    className={`${typeConfig.color} flex items-center gap-1 w-fit`}
                                  >
                                    {typeConfig.icon}
                                    {typeConfig.label}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(model.name, "name")
                                      }
                                      className="h-8 w-8 p-0"
                                      title={`Copy model name: ${model.name}`}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(typeof model.hash === 'number' ? model.hash.toString() : model.hash, "hash")
                                      }
                                      className="h-8 w-8 p-0"
                                      title={`Copy hash: ${model.hash}`}
                                    >
                                      <Hash className="h-4 w-4" />
                                    </Button>
                                    <WhitelistBlacklistButtons
                                      model={model}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    {t("showing_results", {
                      start: (currentPage - 1) * itemsPerPage + 1,
                      end: Math.min(
                        currentPage * itemsPerPage,
                        filteredModels.length
                      ),
                      total: filteredModels.length,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                        updateUrl({ page: newPage });
                      }}
                      disabled={currentPage === 1}
                    >
                      {t("previous")}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setCurrentPage(pageNum);
                                updateUrl({ page: pageNum });
                              }}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setCurrentPage(newPage);
                        updateUrl({ page: newPage });
                      }}
                      disabled={currentPage === totalPages}
                    >
                      {t("next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <Dialog
          open={!!fullscreenImage}
          onOpenChange={() => setFullscreenImage(null)}
        >
          <DialogContent
            className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            aria-describedby={undefined}
          >
            <DialogHeader className="p-4 sm:p-6 pb-2">
              <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {MODEL_TYPE_CONFIG[fullscreenImage.model.type].icon}
                  <span className="truncate">{fullscreenImage.model.name}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`${
                    MODEL_TYPE_CONFIG[fullscreenImage.model.type].color
                  } flex items-center gap-1 w-fit`}
                >
                  {MODEL_TYPE_CONFIG[fullscreenImage.model.type].label}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 bg-gradient-to-br from-background to-muted/20 m-4 sm:m-6 mt-2 rounded-lg flex items-center justify-center min-h-[300px] sm:min-h-[400px] border">
                <img
                  src={fullscreenImage.url}
                  alt={fullscreenImage.model.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    const img = e.currentTarget;
                    const parent = img.parentElement;

                    if (parent && !parent.querySelector(".fallback-icon")) {
                      img.style.display = "none";

                      const fallback = document.createElement("div");
                      fallback.className =
                        "fallback-icon flex flex-col items-center justify-center text-muted-foreground";

                      const modelType = fullscreenImage.model.type;
                      let iconSvg = "";
                      switch (modelType) {
                        case "vehicle":
                          iconSvg =
                            '<svg class="h-12 w-12 sm:h-16 sm:w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>';
                          break;
                        case "ped":
                          iconSvg =
                            '<svg class="h-12 w-12 sm:h-16 sm:w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                          break;
                        case "weapon":
                          iconSvg =
                            '<svg class="h-12 w-12 sm:h-16 sm:w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>';
                          break;
                        case "explosion":
                          iconSvg =
                            '<svg class="h-12 w-12 sm:h-16 sm:w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm7.07-5.93L7.05 8.09A3.5 3.5 0 005.5 11.5c0 .28.03.55.08.82l1.42-1.42a1.5 1.5 0 011.06-.44zm3.36 0l2.02 2.02a3.5 3.5 0 011.55 3.41c0-.28-.03-.55-.08-.82l-1.42 1.42a1.5 1.5 0 01-1.06.44zM12 19a7 7 0 007-7c0-.34-.03-.67-.08-1L12 18z"></path></svg>';
                          break;
                        default:
                          iconSvg =
                            '<svg class="h-12 w-12 sm:h-16 sm:w-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                      }

                      fallback.innerHTML = `${iconSvg}<p class="text-xs sm:text-sm text-center">${t(
                        "image_not_available"
                      )}</p>`;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>

              <div className="p-4 sm:p-6 pt-2 border-t bg-background">
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {t("model_name")}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs sm:text-sm font-mono flex-1 min-w-0 break-all">
                        {fullscreenImage.model.name}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(fullscreenImage.model.name, "name")
                        }
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {t("hash")}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs sm:text-sm font-mono flex-1 min-w-0 break-all">
                        {typeof fullscreenImage.model.hash === 'number' ? fullscreenImage.model.hash.toString() : fullscreenImage.model.hash}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(typeof fullscreenImage.model.hash === 'number' ? fullscreenImage.model.hash.toString() : fullscreenImage.model.hash, "hash")
                        }
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ContentLayout>
  );
}

