import { BRANCHES, CATEGORIES, DEFAULT_POINT_RULES } from "@/lib/circuit";
import { normalizeText } from "@/lib/normalize";
import type {
  CategoryId,
  BranchId,
  CircuitDate,
  CircuitSnapshot,
  ImportedResult,
  Player,
  School,
} from "@/lib/types";

export const demoDates: CircuitDate[] = [
  { id: "fecha-1", name: "Fecha 1", round: 1, date: "2026-03-14", status: "importada" },
  { id: "fecha-2", name: "Fecha 2", round: 2, date: "2026-04-11", status: "importada" },
  { id: "fecha-3", name: "Fecha 3", round: 3, date: "2026-05-09", status: "pendiente" },
];

export const demoSchools: School[] = [
  {
    id: "school-san-jose",
    officialName: "Colegio San Jose",
    normalizedName: normalizeText("Colegio San Jose"),
    city: "Ciudad del Este",
    aliases: ["San Jose", "Col. San Jose"],
  },
  {
    id: "school-santa-maria",
    officialName: "Colegio Santa Maria",
    normalizedName: normalizeText("Colegio Santa Maria"),
    city: "Presidente Franco",
    aliases: ["Santa Maria", "Sta Maria"],
  },
  {
    id: "school-nacional-parana",
    officialName: "Colegio Nacional Parana",
    normalizedName: normalizeText("Colegio Nacional Parana"),
    city: "Ciudad del Este",
    aliases: ["Nacional Parana", "Col. Nac. Parana"],
  },
  {
    id: "school-del-sol",
    officialName: "Colegio del Sol",
    normalizedName: normalizeText("Colegio del Sol"),
    city: "Hernandarias",
    aliases: ["Del Sol"],
  },
  {
    id: "school-municipal",
    officialName: "Escuela Municipal de Ajedrez",
    normalizedName: normalizeText("Escuela Municipal de Ajedrez"),
    city: "Minga Guazu",
    aliases: ["Municipal de Ajedrez", "EMA"],
  },
];

export const demoPlayers: Player[] = [
  player("player-ana-rojas", "Ana Rojas", "school-santa-maria", 2016, "femenino"),
  player("player-mateo-silva", "Mateo Silva", "school-san-jose", 2015, "absoluto"),
  player("player-lucia-benitez", "Lucia Benitez", "school-del-sol", 2014, "femenino"),
  player("player-diego-acosta", "Diego Acosta", "school-nacional-parana", 2014, "absoluto"),
  player("player-valentina-meza", "Valentina Meza", "school-municipal", 2013, "femenino"),
  player("player-bruno-gomez", "Bruno Gomez", "school-san-jose", 2013, "absoluto"),
  player("player-emma-villalba", "Emma Villalba", "school-santa-maria", 2012, "femenino"),
  player("player-tomas-ferreira", "Tomas Ferreira", "school-nacional-parana", 2012, "absoluto"),
  player("player-sofia-duarte", "Sofia Duarte", "school-del-sol", 2011, "femenino"),
  player("player-nicolas-ortiz", "Nicolas Ortiz", "school-municipal", 2011, "absoluto"),
  player("player-camila-nunez", "Camila Nunez", "school-san-jose", 2010, "femenino"),
  player("player-julian-riveros", "Julian Riveros", "school-santa-maria", 2010, "absoluto"),
  player("player-isabella-torres", "Isabella Torres", "school-del-sol", 2009, "femenino"),
  player("player-federico-almada", "Federico Almada", "school-nacional-parana", 2009, "absoluto"),
  player("player-agustina-cardozo", "Agustina Cardozo", "school-municipal", 2008, "femenino"),
  player("player-santiago-rios", "Santiago Rios", "school-san-jose", 2008, "absoluto"),
  player("player-galeano-mateo", "Galeano, Mateo", "school-municipal", 2014, "absoluto"),
  player("player-ramirez-ana-paula", "Ramírez, Bentos Ana Paula", "school-san-jose", 2014, "femenino"),
  player("player-reyes-santiago", "Reyes, Velázquez Santiago Emmanuel", "school-santa-maria", 2014, "absoluto"),
  player("player-sabrina-samudio", "Sabrina, Sahari Samudio Santacruz", "school-del-sol", 2014, "femenino"),
];

const demoResultsInput: Array<{
  tournamentId: string;
  categoryId: CategoryId;
  branchId: BranchId;
  rows: Array<[number, string, number, Record<string, number>]>;
}> = [
  {
    tournamentId: "fecha-1",
    categoryId: "sub-10",
    branchId: "absoluto",
    rows: [
      [1, "player-mateo-silva", 5, { buch: 18, sb: 14 }],
      [2, "player-diego-acosta", 4, { buch: 17, sb: 12 }],
      [3, "player-bruno-gomez", 4, { buch: 16, sb: 11 }],
      [4, "player-lucia-benitez", 3.5, { buch: 15, sb: 10 }],
      [5, "player-valentina-meza", 3, { buch: 14, sb: 8 }],
    ],
  },
  {
    tournamentId: "fecha-1",
    categoryId: "sub-12",
    branchId: "femenino",
    rows: [
      [1, "player-emma-villalba", 5, { buch: 19, sb: 15 }],
      [2, "player-sofia-duarte", 4, { buch: 18, sb: 13 }],
      [3, "player-camila-nunez", 3.5, { buch: 17, sb: 11 }],
      [4, "player-ana-rojas", 3, { buch: 16, sb: 9 }],
    ],
  },
  {
    tournamentId: "fecha-1",
    categoryId: "abierto",
    branchId: "absoluto",
    rows: [
      [1, "player-santiago-rios", 5.5, { buch: 22, sb: 18 }],
      [2, "player-federico-almada", 5, { buch: 21, sb: 16 }],
      [3, "player-julian-riveros", 4.5, { buch: 20, sb: 15 }],
      [4, "player-nicolas-ortiz", 4, { buch: 19, sb: 13 }],
      [5, "player-isabella-torres", 3.5, { buch: 18, sb: 12 }],
    ],
  },
  {
    tournamentId: "fecha-2",
    categoryId: "sub-10",
    branchId: "absoluto",
    rows: [
      [1, "player-diego-acosta", 5, { buch: 19, sb: 14 }],
      [2, "player-mateo-silva", 4.5, { buch: 18, sb: 13 }],
      [3, "player-lucia-benitez", 4, { buch: 17, sb: 12 }],
      [4, "player-bruno-gomez", 3.5, { buch: 16, sb: 10 }],
      [5, "player-valentina-meza", 3, { buch: 15, sb: 9 }],
    ],
  },
  {
    tournamentId: "fecha-2",
    categoryId: "sub-12",
    branchId: "femenino",
    rows: [
      [1, "player-sofia-duarte", 5, { buch: 19, sb: 16 }],
      [2, "player-emma-villalba", 4.5, { buch: 18, sb: 14 }],
      [3, "player-ana-rojas", 4, { buch: 17, sb: 12 }],
      [4, "player-camila-nunez", 3, { buch: 16, sb: 9 }],
    ],
  },
  {
    tournamentId: "fecha-2",
    categoryId: "abierto",
    branchId: "absoluto",
    rows: [
      [1, "player-santiago-rios", 5.5, { buch: 22, sb: 19 }],
      [2, "player-julian-riveros", 5, { buch: 21, sb: 17 }],
      [3, "player-federico-almada", 4.5, { buch: 20, sb: 15 }],
      [4, "player-agustina-cardozo", 4, { buch: 19, sb: 13 }],
      [5, "player-nicolas-ortiz", 3.5, { buch: 18, sb: 12 }],
    ],
  },
];

export const demoImportedResults: ImportedResult[] = demoResultsInput.flatMap((group) =>
  group.rows.map(([place, playerId, tournamentPoints, tieBreaks]) => {
    const foundPlayer = demoPlayers.find((item) => item.id === playerId);
    const foundSchool = demoSchools.find((item) => item.id === foundPlayer?.schoolId);

    if (!foundPlayer || !foundSchool) {
      throw new Error(`Demo player or school not found for ${playerId}`);
    }

    return {
      id: `result-${group.tournamentId}-${group.categoryId}-${group.branchId}-${place}`,
      tournamentId: group.tournamentId,
      categoryId: group.categoryId,
      branchId: group.branchId,
      place,
      playerId,
      schoolId: foundPlayer.schoolId,
      playerName: foundPlayer.fullName,
      schoolName: foundSchool.officialName,
      tournamentPoints,
      tieBreaks,
      sourceUrl: "https://chess-results.com/demo",
      rawRow: {},
      importedAt: "2026-04-11T18:30:00.000Z",
    };
  }),
);

export const demoSnapshot: CircuitSnapshot = {
  categories: CATEGORIES,
  branches: BRANCHES,
  dates: demoDates,
  schools: demoSchools,
  players: demoPlayers,
  importedResults: demoImportedResults,
  pointRules: DEFAULT_POINT_RULES,
  auditLogs: [
    {
      id: "audit-demo-1",
      action: "import.confirmed",
      entityType: "imported_results",
      summary: "Carga demo confirmada para Fecha 2.",
      createdAt: "2026-04-11T18:31:00.000Z",
      actorEmail: "admin@circuito.local",
    },
  ],
};

function player(id: string, fullName: string, schoolId: string, birthYear: number, branchId: BranchId): Player {
  return {
    id,
    fullName,
    normalizedName: normalizeText(fullName),
    schoolId,
    branchId,
    birthYear,
  };
}
