import { describe, it, expect } from 'vitest';
import { questions } from '../src/game/questions';
import { matches, normalize, scramble } from '../src/game/scramble';
import { availableQuestions, createGame, gameView, transition } from '../src/game/engine';
import { categories, defaultSettings, difficulties, type Game } from '../src/game/types';
import { setupSchema } from '../src/game/validation';
const teams = [
  { id: 'a', name: 'Grace', color: '#f8d477' },
  { id: 'b', name: 'Faith', color: '#85dad2' },
];
const setup = (overrides: Partial<typeof defaultSettings> = {}) =>
  createGame(
    { ...defaultSettings, rounds: 1, questionsPerRound: 2, tiebreaker: false, ...overrides },
    teams,
    questions,
  );
const active = (g = setup()) =>
  transition(transition(g, { type: 'START' }, 1000), { type: 'TICK' }, 4000);
describe('validated question bank', () => {
  it('has 200+ distinct answers and IDs and all required categories', () => {
    expect(questions.length).toBeGreaterThanOrEqual(200);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    expect(new Set(questions.map((q) => normalize(q.answer))).size).toBe(questions.length);
    expect(new Set(questions.flatMap((q) => q.categories))).toEqual(new Set(categories));
  });
  it.each(questions.map((q) => [q.id, q] as const))(
    '%s preserves every character and all accepted spellings',
    (id, q) => {
      expect(id).toBeTruthy();
      expect(difficulties).toContain(q.difficulty);
      expect(q.scrambled).not.toBe(normalize(q.answer));
      expect([...q.scrambled].sort()).toEqual([...normalize(q.answer)].sort());
      for (const random of [() => 0, () => 0.999999, Math.random]) {
        const shuffled = scramble(q.answer, random);
        expect(shuffled).not.toBe(normalize(q.answer));
        expect([...shuffled].sort()).toEqual([...normalize(q.answer)].sort());
      }
      expect(matches(q.answer.toLowerCase(), q.answer, q.aliases)).toBe(true);
      for (const alias of q.aliases) expect(matches(alias, q.answer, q.aliases)).toBe(true);
    },
  );
  it('normalizes punctuation, spaces and accents deterministically', () => {
    expect(normalize('  Mary—Magdalene! ')).toBe('MARYMAGDALENE');
    expect(normalize('Éphésüs')).toBe('EPHESUS');
    expect(matches('Mo ses!!', 'Moses')).toBe(true);
    expect(matches('', 'Moses')).toBe(false);
    expect(() => scramble('AAA')).toThrow();
  });
  it('deduplicates categories and filters without repeats', () => {
    const g = setup();
    expect(new Set(g.deck.map((q) => q.id)).size).toBe(g.deck.length);
    const filtered = availableQuestions(questions, {
      ...defaultSettings,
      categories: ['Women of the Bible'],
      difficulty: 'Easy',
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((q) => q.categories.includes('Women of the Bible') && q.difficulty === 'Easy'),
    ).toBe(true);
  });
  it('rejects impossible decks and malformed settings', () => {
    expect(() =>
      setup({
        rounds: 10,
        questionsPerRound: 20,
        categories: ['Women of the Bible'],
        difficulty: 'Expert',
      }),
    ).toThrow();
    expect(
      setupSchema.safeParse({ settings: { ...defaultSettings, seconds: -1 }, teams }).success,
    ).toBe(false);
    expect(
      setupSchema.safeParse({ settings: defaultSettings, teams: [teams[0], teams[0]] }).success,
    ).toBe(false);
  });
});
describe('game state, time and scores', () => {
  it('hides the next scramble during the lobby, countdown and a paused countdown', () => {
    const g = setup();
    expect(gameView(g).question).toBeNull();
    const started = transition(g, { type: 'START' }, 1000);
    expect(gameView(started).question).toBeNull();
    expect(gameView(transition(started, { type: 'PAUSE' }, 1100)).question).toBeNull();
  });
  it('only starts from lobby and ignores invalid commands', () => {
    const g = setup();
    expect(transition(g, { type: 'NEXT' }, 0)).toBe(g);
    expect(transition(g, { type: 'AWARD', teamId: 'a' }, 0)).toBe(g);
    const started = transition(g, { type: 'START' }, 1000);
    expect(started.phase).toBe('COUNTDOWN');
    expect(transition(started, { type: 'START' }, 1001)).toBe(started);
  });
  it('uses elapsed wall time and settles a late typed answer before awarding', () => {
    const g = active(setup({ answerMode: 'typed', seconds: 5 }));
    const late = transition(g, { type: 'ANSWER', teamId: 'a', answer: g.deck[0].answer }, 9000);
    expect(late.phase).toBe('ANSWER_REVEAL');
    expect(late.teams[0].score).toBe(0);
    expect(transition(g, { type: 'TICK' }, 8999).phase).toBe('QUESTION_ACTIVE');
  });
  it('pauses countdown and active clocks without drift, including unlimited', () => {
    let g = transition(setup(), { type: 'START' }, 1000);
    g = transition(g, { type: 'PAUSE' }, 2000);
    expect(g.remainingMs).toBe(2000);
    g = transition(g, { type: 'RESUME' }, 20000);
    expect(g.deadline).toBe(22000);
    g = transition(g, { type: 'TICK' }, 22000);
    g = transition(g, { type: 'PAUSE' }, 24000);
    expect(g.remainingMs).toBe(18000);
    g = transition(g, { type: 'RESUME' }, 100000);
    expect(g.deadline).toBe(118000);
    const unlimited = active(setup({ seconds: 0 }));
    expect(unlimited.deadline).toBeNull();
    expect(
      transition(transition(unlimited, { type: 'PAUSE' }, 5000), { type: 'RESUME' }, 999999)
        .deadline,
    ).toBeNull();
  });
  it('prevents double scoring, applies a penalty once, permits a steal and undo', () => {
    let g = active(setup({ penalty: 25 }));
    g = transition(g, { type: 'PENALTY', teamId: 'a' }, 4100);
    expect(g.teams[0].score).toBe(-25);
    expect(transition(g, { type: 'PENALTY', teamId: 'a' }, 4200)).toBe(g);
    g = transition(g, { type: 'AWARD', teamId: 'b' }, 4300);
    expect(g.teams[1].score).toBe(100);
    expect(transition(g, { type: 'AWARD', teamId: 'a' }, 4400)).toBe(g);
    g = transition(g, { type: 'UNDO' }, 4500);
    expect(g.teams[1].score).toBe(0);
    expect(g.phase).toBe('ANSWER_REVEAL');
    g = transition(g, { type: 'UNDO' }, 4501);
    expect(g.teams[0].score).toBe(0);
    expect(g.penalized).toEqual([]);
  });
  it('locks first buzz and releases only after a wrong answer for a steal', () => {
    let g = active(setup({ answerMode: 'buzz-typed' }));
    g = transition(g, { type: 'BUZZ', teamId: 'a' }, 4100);
    expect(g.buzzTeam).toBe('a');
    expect(transition(g, { type: 'BUZZ', teamId: 'b' }, 4100)).toBe(g);
    expect(transition(g, { type: 'ANSWER', teamId: 'b', answer: g.deck[0].answer }, 4101)).toBe(g);
    g = transition(g, { type: 'ANSWER', teamId: 'a', answer: 'wrong' }, 4200);
    expect(g.buzzTeam).toBeNull();
    expect(g.penalized).toContain('a');
    g = transition(g, { type: 'BUZZ', teamId: 'b' }, 4300);
    g = transition(g, { type: 'ANSWER', teamId: 'b', answer: g.deck[0].answer }, 4400);
    expect(g.awardedTo).toBe('b');
  });
  it('reveals after a miss when steals are disabled', () => {
    let g = active(setup({ steals: false, answerMode: 'typed' }));
    g = transition(g, { type: 'ANSWER', teamId: 'a', answer: 'wrong' }, 4100);
    expect(g.phase).toBe('ANSWER_REVEAL');
  });
  it('does not send an unrevealed answer or future deck to the public view', () => {
    const g = active();
    const publicView = gameView(g);
    expect(publicView).not.toHaveProperty('deck');
    expect(publicView.question).not.toHaveProperty('answer');
    expect(publicView.question).not.toHaveProperty('reference');
    expect(JSON.stringify(publicView)).not.toContain('aliases');
    expect(gameView(transition(g, { type: 'REVEAL' }, 4100)).question?.answer).toBe(
      g.deck[0].answer,
    );
  });
  it('finishes a full two-round session then creates a clean replay', () => {
    let g = setup({ rounds: 2, questionsPerRound: 2 });
    const ids: string[] = [];
    let now = 0;
    g = transition(g, { type: 'START' }, now);
    for (let i = 0; i < 4; i++) {
      now += 3000;
      g = transition(g, { type: 'TICK' }, now);
      ids.push(g.deck[g.index].id);
      g = transition(g, { type: 'AWARD', teamId: 'a' }, now + 1);
      g = transition(g, { type: 'NEXT' }, now + 2);
      if (i === 1) {
        expect(g.phase).toBe('ROUND_RESULTS');
        g = transition(g, { type: 'NEXT' }, now + 3);
        now += 3;
      } else now += 2;
    }
    expect(g.phase).toBe('GAME_RESULTS');
    expect(g.teams[0].score).toBe(400);
    expect(new Set(ids).size).toBe(4);
    expect(gameView(g).winners.map((t) => t.id)).toEqual(['a']);
    const replay = createGame(g.settings, g.teams, questions);
    expect(replay.phase).toBe('LOBBY');
    expect(replay.teams[0].score).toBe(0);
    expect(replay.id).not.toBe(g.id);
  });
  it('restricts sudden death to leaders and ends once the tie breaks', () => {
    let g = active(setup({ questionsPerRound: 1, tiebreaker: true }));
    g = transition(g, { type: 'REVEAL' }, 4100);
    g = transition(g, { type: 'NEXT' }, 4200);
    expect(g.isTiebreak).toBe(true);
    expect(g.index).toBe(1);
    g = transition(g, { type: 'TICK' }, 7200);
    g = transition(g, { type: 'AWARD', teamId: 'b' }, 7300);
    g = transition(g, { type: 'NEXT' }, 7400);
    expect(g.phase).toBe('GAME_RESULTS');
    expect(gameView(g).winners[0].id).toBe('b');
  });
  it('can end a round or game and safely ignores post-game actions', () => {
    let g = active(setup({ rounds: 2, questionsPerRound: 3 }));
    g = transition(g, { type: 'END_ROUND' }, 4100);
    expect(g.phase).toBe('ROUND_RESULTS');
    expect(g.index).toBe(2);
    g = transition(g, { type: 'NEXT' }, 4200);
    expect(g.index).toBe(3);
    expect(g.round).toBe(2);
    g = transition(g, { type: 'END_GAME' }, 4300);
    expect(transition(g, { type: 'AWARD', teamId: 'a' }, 4400)).toBe(g);
  });
  it('scores solo streak bonuses and hint cost correctly', () => {
    const settings = {
      ...defaultSettings,
      mode: 'solo' as const,
      answerMode: 'typed' as const,
      rounds: 1,
      questionsPerRound: 2,
    };
    let g = createGame(settings, [teams[0]], questions);
    g = active(g);
    g = transition(g, { type: 'ANSWER', teamId: 'a', answer: g.deck[0].answer }, 4100);
    expect(g.teams[0].score).toBe(100);
    g = transition(g, { type: 'NEXT' }, 4200);
    g = transition(g, { type: 'TICK' }, 7200);
    g = transition(g, { type: 'HINT' }, 7300);
    g = transition(g, { type: 'ANSWER', teamId: 'a', answer: g.deck[1].answer }, 7400);
    expect(g.teams[0].score).toBe(170);
    expect(g.streak).toBe(2);
  });
  it('never repeats a completed question on duplicate next', () => {
    const g = transition(active(), { type: 'REVEAL' }, 4100);
    const next = transition(g, { type: 'NEXT' }, 4200);
    expect(transition(next, { type: 'NEXT' }, 4201)).toBe(next);
  });
  it('shares a victory if tiebreaker pool is exhausted', () => {
    let g = active(setup({ questionsPerRound: 1, tiebreaker: true }));
    g = { ...g, deck: g.deck.slice(0, 1) } as Game;
    g = transition(transition(g, { type: 'REVEAL' }, 4100), { type: 'NEXT' }, 4200);
    expect(g.phase).toBe('GAME_RESULTS');
    expect(gameView(g).winners.length).toBe(2);
  });
});
