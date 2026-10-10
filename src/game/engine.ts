import { matches, scramble, shuffle } from './scramble';
import { setupSchema } from './validation';
import type { Action, Game, GameView, Question, Settings, Team } from './types';

export function availableQuestions(bank: Question[], settings: Settings) {
  return bank.filter(
    (q) =>
      (settings.difficulty === 'All' || q.difficulty === settings.difficulty) &&
      q.categories.some((c) => settings.categories.includes(c)),
  );
}
export function createGame(
  settings: Settings,
  teams: Omit<Team, 'score'>[],
  bank: Question[],
  random = Math.random,
): Game {
  const parsed = setupSchema.parse({ settings, teams });
  const pool = availableQuestions(bank, parsed.settings);
  if (pool.length < settings.rounds * settings.questionsPerRound)
    throw new Error(
      `Only ${pool.length} questions match. Choose fewer questions or more categories.`,
    );
  return {
    id: crypto.randomUUID(),
    revision: 0,
    settings: parsed.settings,
    teams: parsed.teams.map((t) => ({ ...t, score: 0 })),
    phase: 'LOBBY',
    deck: shuffle(pool, random).map((q) => ({ ...q, scrambled: scramble(q.answer, random) })),
    index: 0,
    round: 1,
    questionInRound: 1,
    deadline: null,
    remainingMs: null,
    pausedPhase: null,
    awardedTo: null,
    penalized: [],
    buzzTeam: null,
    ledger: [],
    streak: 0,
    hinted: false,
    isTiebreak: false,
    eligibleTeams: teams.map((t) => t.id),
    message: 'Gather your teams. The next great guess is yours.',
    notice: '',
  };
}
export function leaders(g: Game): Team[] {
  const max = Math.max(...g.teams.map((t) => t.score));
  return g.teams.filter((t) => t.score === max);
}
function countdown(g: Game, now: number): void {
  g.phase = 'COUNTDOWN';
  g.deadline = now + 3000;
  g.remainingMs = null;
  g.pausedPhase = null;
  g.awardedTo = null;
  g.penalized = [];
  g.buzzTeam = null;
  g.hinted = false;
  g.notice = '';
  g.message = g.isTiebreak ? 'Sudden death. One more word!' : 'Get ready to blitz!';
}
function reveal(g: Game, message: string): void {
  g.phase = 'ANSWER_REVEAL';
  g.deadline = null;
  g.buzzTeam = null;
  g.message = message;
}
function finishOrTiebreak(g: Game, now: number): void {
  const tied = leaders(g);
  if (
    g.settings.tiebreaker &&
    g.settings.mode !== 'solo' &&
    tied.length > 1 &&
    g.index + 1 < g.deck.length
  ) {
    g.isTiebreak = true;
    g.eligibleTeams = tied.map((t) => t.id);
    g.index++;
    g.questionInRound++;
    countdown(g, now);
  } else {
    g.phase = 'GAME_RESULTS';
    g.deadline = null;
    g.message = tied.length > 1 ? 'A brilliant shared victory!' : 'What a finish!';
  }
}
function score(g: Game, teamId: string, kind: 'correct' | 'wrong') {
  const team = g.teams.find((t) => t.id === teamId);
  if (!team || !g.eligibleTeams.includes(teamId) || g.awardedTo || g.penalized.includes(teamId))
    return;
  const previousStreak = g.streak;
  if (kind === 'correct') g.streak++;
  else g.streak = 0;
  const bonus =
    g.settings.mode === 'solo' && kind === 'correct' ? Math.min(previousStreak, 5) * 20 : 0;
  const delta =
    kind === 'wrong'
      ? -g.settings.penalty
      : Math.max(1, g.settings.points + bonus - (g.hinted ? Math.ceil(g.settings.points / 2) : 0));
  team.score += delta;
  g.ledger.push({ id: g.revision, teamId, delta, kind, question: g.index, previousStreak });
  if (kind === 'correct') {
    g.awardedTo = teamId;
    reveal(g, `${team.name} gets +${delta}!`);
  } else {
    g.penalized.push(teamId);
    g.buzzTeam = null;
    g.notice = `${team.name}: not quite${delta ? ` (${delta})` : ''}.`;
    if (
      !g.settings.steals ||
      g.eligibleTeams.every((id) => g.penalized.includes(id)) ||
      g.settings.mode === 'solo'
    )
      reveal(g, 'Good try. Here’s the answer.');
  }
}

/** Invalid actions return the original state. The caller supplies the authoritative clock. */
export function transition(state: Game, action: Action, now: number): Game {
  // Settle a deadline before processing any action, including a late answer or buzz.
  if (action.type !== 'TICK' && state.deadline !== null && now >= state.deadline)
    state = transition(state, { type: 'TICK' }, now);
  const g = structuredClone(state);
  const active = g.phase === 'QUESTION_ACTIVE';
  switch (action.type) {
    case 'TICK':
      if (g.deadline === null || now < g.deadline) return state;
      if (g.phase === 'COUNTDOWN') {
        g.phase = 'QUESTION_ACTIVE';
        g.deadline = g.settings.seconds ? g.deadline + g.settings.seconds * 1000 : null;
        g.message = 'Know it? Call it!';
        if (g.deadline !== null && now >= g.deadline) reveal(g, 'Time’s up!');
      } else if (active) {
        g.streak = 0;
        reveal(g, 'Time’s up!');
      } else return state;
      break;
    case 'START':
      if (g.phase !== 'LOBBY') return state;
      countdown(g, now);
      break;
    case 'PAUSE':
      if (!active && g.phase !== 'COUNTDOWN') return state;
      g.pausedPhase = g.phase as 'COUNTDOWN' | 'QUESTION_ACTIVE';
      g.remainingMs = g.deadline === null ? null : Math.max(0, g.deadline - now);
      g.deadline = null;
      g.phase = 'PAUSED';
      break;
    case 'RESUME':
      if (g.phase !== 'PAUSED' || !g.pausedPhase) return state;
      g.phase = g.pausedPhase;
      g.deadline = g.remainingMs === null ? null : now + g.remainingMs;
      g.pausedPhase = null;
      break;
    case 'REVEAL':
      if (!active) return state;
      g.streak = 0;
      reveal(g, 'The answer is…');
      break;
    case 'SKIP':
      if (!active && g.phase !== 'PAUSED') return state;
      g.streak = 0;
      reveal(g, 'Skipped. A fresh word is up next.');
      break;
    case 'BUZZ':
      if (
        !active ||
        !g.settings.answerMode.startsWith('buzz') ||
        g.buzzTeam ||
        g.penalized.includes(action.teamId) ||
        !g.eligibleTeams.includes(action.teamId)
      )
        return state;
      g.buzzTeam = action.teamId;
      g.message = `${g.teams.find((t) => t.id === action.teamId)?.name} buzzed first!`;
      break;
    case 'ANSWER':
      if (
        !active ||
        !['typed', 'buzz-typed'].includes(g.settings.answerMode) ||
        (g.settings.answerMode === 'buzz-typed' && g.buzzTeam !== action.teamId)
      )
        return state;
      score(
        g,
        action.teamId,
        matches(action.answer, g.deck[g.index].answer, g.deck[g.index].aliases)
          ? 'correct'
          : 'wrong',
      );
      break;
    case 'AWARD':
    case 'PENALTY':
      if (!active && g.phase !== 'ANSWER_REVEAL') return state;
      if (g.buzzTeam && g.buzzTeam !== action.teamId) return state;
      score(g, action.teamId, action.type === 'AWARD' ? 'correct' : 'wrong');
      break;
    case 'UNDO': {
      if (!active && g.phase !== 'ANSWER_REVEAL') return state;
      const last = g.ledger.at(-1);
      if (!last || last.question !== g.index) return state;
      g.ledger.pop();
      g.teams.find((t) => t.id === last.teamId)!.score -= last.delta;
      g.streak = last.previousStreak;
      if (last.kind === 'correct') g.awardedTo = null;
      else g.penalized = g.penalized.filter((t) => t !== last.teamId);
      // Keep a revealed answer revealed; never reopen it for online typing.
      g.message = 'Last score undone.';
      g.notice = '';
      break;
    }
    case 'HINT':
      if (!active || g.settings.mode !== 'solo' || g.hinted) return state;
      g.hinted = true;
      g.notice = 'Hint used: half the base points for this word.';
      break;
    case 'NEXT':
      if (g.phase === 'ROUND_RESULTS') {
        g.index++;
        g.round++;
        g.questionInRound = 1;
        countdown(g, now);
      } else if (g.phase === 'ANSWER_REVEAL') {
        if (
          g.isTiebreak ||
          (g.round === g.settings.rounds && g.questionInRound === g.settings.questionsPerRound)
        )
          finishOrTiebreak(g, now);
        else if (g.questionInRound === g.settings.questionsPerRound) {
          g.phase = 'ROUND_RESULTS';
          g.message = 'Take a breath. Check the standings.';
        } else {
          g.index++;
          g.questionInRound++;
          countdown(g, now);
        }
      } else return state;
      break;
    case 'END_ROUND':
      if (!['QUESTION_ACTIVE', 'PAUSED', 'ANSWER_REVEAL', 'COUNTDOWN'].includes(g.phase))
        return state;
      if (!g.isTiebreak) {
        g.index += g.settings.questionsPerRound - g.questionInRound;
        g.questionInRound = g.settings.questionsPerRound;
      }
      if (g.round === g.settings.rounds || g.isTiebreak) {
        g.phase = 'GAME_RESULTS';
        g.message = 'Game ended by the host.';
      } else {
        g.phase = 'ROUND_RESULTS';
        g.message = 'Round ended by the host.';
      }
      g.deadline = null;
      break;
    case 'END_GAME':
      if (['GAME_RESULTS', 'CANCELLED'].includes(g.phase)) return state;
      g.phase = 'GAME_RESULTS';
      g.deadline = null;
      g.message = 'Thanks for playing!';
      break;
    case 'CANCEL':
      if (g.phase !== 'LOBBY') return state;
      g.phase = 'CANCELLED';
      g.deadline = null;
      break;
  }
  if (JSON.stringify(g) === JSON.stringify(state)) return state;
  g.revision = state.revision + 1;
  return g;
}

export function gameView(g: Game): GameView {
  const { deck, ...rest } = g;
  const q = deck[g.index];
  const revealed = ['ANSWER_REVEAL', 'ROUND_RESULTS', 'GAME_RESULTS'].includes(g.phase);
  const visible =
    !['LOBBY', 'COUNTDOWN', 'CANCELLED'].includes(g.phase) &&
    !(g.phase === 'PAUSED' && g.pausedPhase === 'COUNTDOWN');
  return {
    ...rest,
    totalQuestions: g.settings.rounds * g.settings.questionsPerRound,
    question:
      q && visible
        ? {
            id: q.id,
            scrambled: q.scrambled,
            categories: q.categories,
            difficulty: q.difficulty,
            length: q.scrambled.length,
            ...(revealed ? { answer: q.answer, reference: q.reference } : {}),
            ...(g.hinted ? { hint: q.answer[0] } : {}),
          }
        : null,
    winners: leaders(g),
  };
}
