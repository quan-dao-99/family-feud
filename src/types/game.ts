export interface Answer {
  id: string;
  text: string;
  points: number;
  revealed?: boolean;
}

export interface Question {
  id: string;
  question: string;
  multiplier: number; // 1, 2, 3
  answers: Answer[];
  category?: string;
}

export interface FastMoneyQuestion {
  id: string;
  question: string;
  answers: { text: string; points: number }[];
}

export interface FastMoneyPlayerEntry {
  answer: string;
  points: number;
  revealedAnswer: boolean;
  revealedPoints: boolean;
}

export interface FastMoneyState {
  player1: {
    name: string;
    entries: FastMoneyPlayerEntry[];
    timer: number;
    timerActive: boolean;
    totalPoints: number;
  };
  player2: {
    name: string;
    entries: FastMoneyPlayerEntry[];
    timer: number;
    timerActive: boolean;
    totalPoints: number;
  };
  activePlayer: 1 | 2;
  questions: FastMoneyQuestion[];
  isCompleted: boolean;
  wonGrandPrize: boolean;
}

export interface Team {
  id: 'teamA' | 'teamB';
  name: string;
  score: number;
  color: string;
}

export type ViewMode = 'board' | 'host' | 'fast-money' | 'questions' | 'buzzer';

export interface GameState {
  teams: {
    teamA: Team;
    teamB: Team;
  };
  currentRoundIndex: number;
  questions: Question[];
  // Active round state
  activeQuestionId: string;
  revealedAnswers: string[]; // IDs of revealed answers
  strikes: number; // 0, 1, 2, 3
  strikeOverlay: {
    visible: boolean;
    count: number; // 1, 2, 3
  };
  roundBank: number;
  controllingTeam: 'teamA' | 'teamB' | null;
  
  // Fast money state
  fastMoney: FastMoneyState;
  
  // Sound settings
  soundEnabled: boolean;
  
  // Buzzer state
  buzzerWinner: 'teamA' | 'teamB' | null;
  buzzerLocked: boolean;
}

export type SyncAction =
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'REVEAL_ANSWER'; answerId: string }
  | { type: 'HIDE_ANSWER'; answerId: string }
  | { type: 'REVEAL_ALL' }
  | { type: 'HIDE_ALL' }
  | { type: 'ADD_STRIKE'; count: number }
  | { type: 'CLEAR_STRIKES' }
  | { type: 'AWARD_BANK'; team: 'teamA' | 'teamB' }
  | { type: 'SET_ROUND'; roundIndex: number }
  | { type: 'UPDATE_TEAM_NAME'; team: 'teamA' | 'teamB'; name: string }
  | { type: 'UPDATE_TEAM_SCORE'; team: 'teamA' | 'teamB'; score: number }
  | { type: 'SET_CONTROLLING_TEAM'; team: 'teamA' | 'teamB' | null }
  | { type: 'RESET_GAME' }
  | { type: 'TRIGGER_BUZZER'; team: 'teamA' | 'teamB' }
  | { type: 'RESET_BUZZER' }
  | { type: 'UPDATE_FAST_MONEY'; fastMoney: FastMoneyState }
  | { type: 'UPDATE_QUESTIONS'; questions: Question[]; fastMoneyQuestions?: FastMoneyQuestion[] };
