export interface StrikeStatus {
  isStrikeActive: boolean;
  affectedLines: string[];
  lastUpdate: string;
  headline?: string;
}
