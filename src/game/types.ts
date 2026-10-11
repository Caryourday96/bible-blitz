export const categories = [
  'Bible Characters',
  'Old Testament',
  'New Testament',
  'Prophets',
  'Kings and Queens',
  'Apostles and Disciples',
  'Women of the Bible',
  'Books of the Bible',
  'Biblical Places',
  'Difficult Bible Names',
] as const;
export const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'] as const;
export type Category = (typeof categories)[number];
export type Difficulty = (typeof difficulties)[number];
export type Mode = 'party' | 'host' | 'online' | 'solo';
export type AnswerMode = 'host' | 'typed' | 'buzz-verbal' | 'buzz-typed';
export type Phase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'QUESTION_ACTIVE'
  | 'PAUSED'
  | 'ANSWER_REVEAL'
  | 'ROUND_RESULTS'
  | 'GAME_RESULTS'
  | 'CANCELLED';
export interface Question {
  id: string;
  answer: string;
  aliases: string[];
  categories: Category[];
  difficulty: Difficulty;
  reference?: string;
  fact?: string;
  scrambled: string;
}
export interface Settings {
  mode: Mode;
  categories: Category[];
  difficulty: Difficulty | 'All';
  rounds: number;
  questionsPerRound: number;
  seconds: number;
  points: number;
  penalty: number;
  steals: boolean;
  tiebreaker: boolean;
  answerMode: AnswerMode;
  sound: boolean;
  music: boolean;
  volume: number;
}
export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}
export interface ScoreEvent {
  id: number;
  teamId: string;
  delta: number;
  kind: 'correct' | 'wrong';
  question: number;
  previousStreak: number;
}
export interface Game {
  presentation: Presentation;
  id: string;
  revision: number;
  settings: Settings;
  teams: Team[];
  phase: Phase;
  deck: Question[];
  index: number;
  round: number;
  questionInRound: number;
  deadline: number | null;
  remainingMs: number | null;
  pausedPhase: 'COUNTDOWN' | 'QUESTION_ACTIVE' | null;
  awardedTo: string | null;
  penalized: string[];
  buzzTeam: string | null;
  ledger: ScoreEvent[];
  streak: number;
  hinted: boolean;
  isTiebreak: boolean;
  eligibleTeams: string[];
  message: string;
  notice: string;
}
export type Action =
  | { type: 'MOVE_QUESTION'; from: number; to: number }
  | { type: 'MOVE_ROUND'; from: number; to: number }
  | { type: 'REPLACE_QUESTION'; index: number; questionId: string }
  | { type: 'EDIT_TEAM'; teamId: string; name: string; color: string }
  | { type: 'PRESENTATION'; presentation: Presentation }
  | {
      type:
        | 'START'
        | 'TICK'
        | 'PAUSE'
        | 'RESUME'
        | 'REVEAL'
        | 'SKIP'
        | 'NEXT'
        | 'UNDO'
        | 'END_ROUND'
        | 'END_GAME'
        | 'HINT'
        | 'CANCEL';
    }
  | { type: 'AWARD' | 'PENALTY' | 'BUZZ'; teamId: string }
  | { type: 'ANSWER'; teamId: string; answer: string };
export interface PublicQuestion {
  id: string;
  scrambled: string;
  categories: Category[];
  difficulty: Difficulty;
  length: number;
  answer?: string;
  reference?: string;
  hint?: string;
}
export type GameView = Omit<Game, 'deck'> & {
  question: PublicQuestion | null;
  totalQuestions: number;
  winners: Team[];
};
export const defaultSettings: Settings = {
  mode: 'party',
  categories: [...categories],
  difficulty: 'All',
  rounds: 3,
  questionsPerRound: 5,
  seconds: 20,
  points: 100,
  penalty: 0,
  steals: true,
  tiebreaker: true,
  answerMode: 'host',
  sound: true,
  music: false,
  volume: 0.35,
};
export const teamColors = [
  '#f8d477',
  '#85dad2',
  '#c4a8ef',
  '#f29986',
  '#9ccc82',
  '#a5c7f7',
  '#ed9fc6',
  '#dbbaa0',
];

export interface Presentation {
  title: string;
  theme: 'forest' | 'midnight' | 'plum' | 'sunrise';
  background: 'solid' | 'spotlight' | 'grid';
  textSize: 'standard' | 'large' | 'extra-large';
  announcement: string;
  winnerMessage: string;
  confetti: boolean;
}
export const defaultPresentation: Presentation = {
  title: '',
  theme: 'forest',
  background: 'spotlight',
  textSize: 'standard',
  announcement: '',
  winnerMessage: 'Thanks for playing. See you next round!',
  confetti: true,
};
export interface HostPlan {
  queue: Pick<Question, 'id' | 'answer' | 'difficulty' | 'categories'>[];
  reserves: Pick<Question, 'id' | 'answer' | 'difficulty' | 'categories'>[];
}
