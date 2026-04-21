export type SectorId =
  | "subte"
  | "tren"
  | "colectivo"
  | "aeronautic"
  | "education"
  | "health"
  | "public-admin"
  | "banking"
  | "logistics"
  | "justice";

export interface SectorStatus {
  id: SectorId;
  isStrikeActive: boolean;
  affectedLines: string[];
  headline?: string;
  lastUpdate: string;
}
