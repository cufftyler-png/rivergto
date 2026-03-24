export type SolvePayload = {
  heroCards: string[];
  boardCards: string[];
  matrix: Record<string, number>;
  iterations: number;
  pot: number;
  callAmount: number;
  betSizes: number[];
  allowOverbet: boolean;
};

export type SolverResult = {
  equity?: number;
  recommendation?: string;
  progress?: number;
  error?: string;
  heroWins?: number;
  villainWins?: number;
  ties?: number;
  topMatchups?: { hand: string; count: number }[];
  convergence?: { sims: number; equity: number }[];
  actionMix?: { action: string; freq: number }[];
  backendMeta?: {
    service: string;
    pipeline: string[];
    batchSize: number;
  };
};

export type WorkerMessage = {
  requestId: number;
  progress?: number;
  status?: string;
  result?: SolverResult;
};