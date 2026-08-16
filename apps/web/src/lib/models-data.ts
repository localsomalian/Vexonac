// Import JSON data files
import objectsData from "../models/objects.json";
import pedsData from "../models/peds.json";
import vehiclesData from "../models/vehicles.json";
import weaponsData from "../models/weapons.json";
import { explosionsList } from "@vexonac/config";

// Model types
export type ModelType = "vehicle" | "ped" | "weapon" | "object" | "explosion";

export interface Model {
  name: string;
  hash: string | number; // number for explosions, string for others
  type: ModelType;
}

// Convert JSON object to Model array
const convertToModelArray = (
  data: Record<string, string>,
  type: ModelType
): Model[] => {
  return Object.entries(data).map(([name, hash]) => ({
    name: name.toLowerCase(),
    hash: hash,
    type,
  }));
};

// Convert explosions list to Model array
const convertExplosionsToModelArray = (): Model[] => {
  return explosionsList.map((explosion: { value: number; label: string }) => ({
    name: explosion.label.toLowerCase().replace(/\s+/g, '_'),
    hash: explosion.value,
    type: "explosion" as ModelType,
  }));
};

// Parse all data
export const VEHICLE_DATA: Model[] = convertToModelArray(
  vehiclesData,
  "vehicle"
);
export const PED_DATA: Model[] = convertToModelArray(pedsData, "ped");
export const WEAPON_DATA: Model[] = convertToModelArray(weaponsData, "weapon");
export const OBJECT_DATA: Model[] = convertToModelArray(objectsData, "object");
export const EXPLOSION_DATA: Model[] = convertExplosionsToModelArray();

// Combined data
export const getAllModels = (): Model[] => {
  return [...VEHICLE_DATA, ...PED_DATA, ...WEAPON_DATA, ...OBJECT_DATA, ...EXPLOSION_DATA];
};

// Get models by type
export const getModelsByType = (type: ModelType): Model[] => {
  switch (type) {
    case "vehicle":
      return VEHICLE_DATA;
    case "ped":
      return PED_DATA;
    case "weapon":
      return WEAPON_DATA;
    case "object":
      return OBJECT_DATA;
    case "explosion":
      return EXPLOSION_DATA;
    default:
      return [];
  }
};

// Search models with optional type filter
export const searchModels = (query: string, type?: ModelType): Model[] => {
  const data = type ? getModelsByType(type) : getAllModels();
  const searchTerm = query.toLowerCase();

  return data.filter(
    (model) => {
      const nameMatch = model.name.includes(searchTerm);
      const hashMatch = typeof model.hash === 'number' 
        ? model.hash.toString().includes(searchTerm)
        : model.hash.toLowerCase().includes(searchTerm);
      return nameMatch || hashMatch;
    }
  );
};

// Get model by hash
export const getModelByHash = (hash: string): Model | undefined => {
  return getAllModels().find((model) => {
    if (typeof model.hash === 'number') {
      return model.hash.toString() === hash || model.hash === parseInt(hash);
    }
    return model.hash.toLowerCase() === hash.toLowerCase();
  });
};

// Get model by name
export const getModelByName = (name: string): Model | undefined => {
  return getAllModels().find((model) => model.name.toLowerCase() === name.toLowerCase());
};

