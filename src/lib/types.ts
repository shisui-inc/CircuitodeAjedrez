export type CategoryId =
  | "sub-6"
  | "sub-8"
  | "sub-10"
  | "sub-12"
  | "sub-14"
  | "abierto";

export type BranchId = "absoluto" | "femenino";

export type TournamentStatus = "pendiente" | "importada" | "cerrada";

export type ValidationIssueType =
  | "duplicate-place"
  | "missing-school"
  | "duplicate-player"
  | "similar-player"
  | "missing-place";

export interface Category {
  id: CategoryId;
  name: string;
  sortOrder: number;
}

export interface Branch {
  id: BranchId;
  name: string;
  sortOrder: number;
}

export interface CircuitDate {
  id: string;
  name: string;
  round: number;
  date: string;
  status: TournamentStatus;
  sourceUrl?: string;
}

export interface School {
  id: string;
  officialName: string;
  normalizedName: string;
  city?: string;
  aliases: string[];
}

export interface Player {
  id: string;
  fullName: string;
  normalizedName: string;
  schoolId: string;
  branchId?: BranchId;
  birthYear?: number;
}

export interface ImportedResult {
  id: string;
  tournamentId: string;
  categoryId: CategoryId;
  branchId: BranchId;
  place: number | null;
  playerId: string;
  schoolId: string;
  playerName: string;
  schoolName: string;
  tournamentPoints: number;
  tieBreaks: Record<string, number | string>;
  sourceUrl?: string;
  rawRow?: Record<string, string>;
  importedAt: string;
  needsReview?: boolean;
}

export interface CircuitPoint {
  id: string;
  importedResultId: string;
  tournamentId: string;
  categoryId: CategoryId;
  branchId: BranchId;
  playerId: string;
  schoolId: string;
  place: number;
  points: number;
}

export interface PointRule {
  place: number;
  points: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorEmail?: string;
  summary: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface CircuitSnapshot {
  categories: Category[];
  branches: Branch[];
  dates: CircuitDate[];
  schools: School[];
  players: Player[];
  importedResults: ImportedResult[];
  circuitPoints?: CircuitPoint[];
  pointRules: PointRule[];
  auditLogs: AuditLog[];
}

export interface ImportRow {
  tempId: string;
  place: number | null;
  playerName: string;
  schoolName: string;
  branchId?: BranchId | "pendiente";
  tournamentPoints: number;
  tieBreaks: Record<string, number | string>;
  raw: Record<string, string>;
  detected: {
    place: boolean;
    player: boolean;
    school: boolean;
  };
  warnings: string[];
}

export interface ImportPayload {
  sourceUrl: string;
  tournamentId: string;
  categoryId: CategoryId;
  branchId: BranchId;
  rows: ImportRow[];
}

export interface ValidationIssue {
  type: ValidationIssueType;
  message: string;
  rowIds: string[];
  severity: "error" | "warning";
}

export interface RankingFilters {
  categoryId?: CategoryId | "general";
  branchId?: BranchId | "general";
}

export interface IndividualRankingRow {
  rank: number;
  playerId: string;
  playerName: string;
  schoolId: string;
  schoolName: string;
  categoryId: CategoryId | "general";
  branchId: BranchId | "general";
  totalPoints: number;
  firstPlaces: number;
  podiums: number;
  datesPlayed: number;
  recentBestPlace: number | null;
  pointsByDate: Record<string, number>;
  bestPlace: number | null;
}

export interface SchoolRankingRow {
  rank: number;
  schoolId: string;
  schoolName: string;
  totalPoints: number;
  firstPlaces: number;
  podiums: number;
  datesWithPoints: number;
  playersWithPoints: number;
  pointsByDate: Record<string, number>;
}

export interface DashboardSummary {
  totalPlayers: number;
  totalSchools: number;
  completedDates: number;
  importedResults: number;
  topPlayer?: IndividualRankingRow;
  topSchool?: SchoolRankingRow;
}
