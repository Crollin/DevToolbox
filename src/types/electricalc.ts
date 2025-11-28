export interface TimeSlot {
  start: string; // Format "HH:mm"
  end: string;   // Format "HH:mm"
}

export interface Tarif {
  id: string;
  name: string;
  heuresPleines: number;
  heuresCreuses: number;
  plagesHC: TimeSlot[];
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
  tarifType: "hp" | "hc" | "mixte" | "auto";
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
    plagesHC: [
      { start: "00:38", end: "06:38" },
      { start: "14:38", end: "16:38" },
    ],
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

// Utility function to check if current time is in HC
export function isInHeuresCreuses(tarif: Tarif, date: Date = new Date()): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  
  for (const plage of tarif.plagesHC) {
    const [startH, startM] = plage.start.split(":").map(Number);
    const [endH, endM] = plage.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    // Handle overnight slots (e.g., 22:00 - 06:00)
    if (endMinutes < startMinutes) {
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
        return true;
      }
    } else {
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return true;
      }
    }
  }
  
  return false;
}

// Calculate total HC hours per day
export function calculateHCHoursPerDay(plages: TimeSlot[]): number {
  let totalMinutes = 0;
  
  for (const plage of plages) {
    const [startH, startM] = plage.start.split(":").map(Number);
    const [endH, endM] = plage.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (endMinutes < startMinutes) {
      // Overnight slot
      totalMinutes += (24 * 60 - startMinutes) + endMinutes;
    } else {
      totalMinutes += endMinutes - startMinutes;
    }
  }
  
  return totalMinutes / 60;
}
