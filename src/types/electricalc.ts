export interface Tarif {
  id: string;
  name: string;
  heuresPleines: number;
  heuresCreuses: number;
  isDefault?: boolean;
}

export interface Appareil {
  id: string;
  name: string;
  puissance: number;
  isEV?: boolean;
  batteryCapacity?: number;
}

export interface Calculation {
  id: string;
  date: string;
  appareilName: string;
  puissance: number;
  duree: number;
  dureeUnit: "minutes" | "heures";
  tarifType: "hp" | "hc" | "mixte";
  tarifName: string;
  consommationKwh: number;
  cout: number;
  isEV?: boolean;
  evDetails?: {
    batteryCapacity: number;
    chargeStart: number;
    chargeTarget: number;
    efficiency: number;
  };
}

export interface ElectriCalcSettings {
  tarifs: Tarif[];
  activeTarifId: string;
  appareils: Appareil[];
}

export const defaultTarifs: Tarif[] = [
  {
    id: "default",
    name: "Tarif Base EDF",
    heuresPleines: 0.2516,
    heuresCreuses: 0.2068,
    isDefault: true,
  },
];

export const defaultAppareils: Appareil[] = [
  { id: "1", name: "Ampoule LED", puissance: 10 },
  { id: "2", name: "Ordinateur portable", puissance: 65 },
  { id: "3", name: "Ordinateur fixe", puissance: 250 },
  { id: "4", name: "Télévision", puissance: 100 },
  { id: "5", name: "Réfrigérateur", puissance: 150 },
  { id: "6", name: "Lave-linge", puissance: 2000 },
  { id: "7", name: "Sèche-linge", puissance: 2500 },
  { id: "8", name: "Four électrique", puissance: 2500 },
  { id: "9", name: "Climatisation", puissance: 1500 },
  { id: "10", name: "Chauffage électrique", puissance: 2000 },
  { id: "11", name: "Tesla Model 3", puissance: 7400, isEV: true, batteryCapacity: 60 },
  { id: "12", name: "Renault Zoé", puissance: 7400, isEV: true, batteryCapacity: 52 },
];
