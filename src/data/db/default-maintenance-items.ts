export interface DefaultMaintenanceItem {
  name: string;
  intervalKm: number | null;
  intervalMonths: number | null;
}

export const DEFAULT_MAINTENANCE_ITEMS: readonly DefaultMaintenanceItem[] = [
  { name: 'óleo do motor', intervalKm: 10000, intervalMonths: 12 },
  { name: 'filtro de óleo', intervalKm: 10000, intervalMonths: 12 },
  { name: 'filtro de ar', intervalKm: 20000, intervalMonths: 12 },
  { name: 'filtro de combustível', intervalKm: 20000, intervalMonths: 24 },
  { name: 'filtro de cabine', intervalKm: 15000, intervalMonths: 12 },
  { name: 'correia dentada', intervalKm: 60000, intervalMonths: 60 },
  { name: 'velas', intervalKm: 30000, intervalMonths: 36 },
  { name: 'pastilhas de freio', intervalKm: 30000, intervalMonths: 24 },
  { name: 'fluido de freio', intervalKm: 40000, intervalMonths: 24 },
  { name: 'líquido de arrefecimento', intervalKm: 40000, intervalMonths: 24 },
  { name: 'rodízio de pneus', intervalKm: 10000, intervalMonths: 6 },
  { name: 'alinhamento/balanceamento', intervalKm: 10000, intervalMonths: 12 },
  { name: 'bateria', intervalKm: null, intervalMonths: 48 },
];

export const DEFAULT_MAINTENANCE_ITEM_NAMES = DEFAULT_MAINTENANCE_ITEMS.map((item) => item.name);
