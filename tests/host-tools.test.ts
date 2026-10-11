import { expect, it } from 'vitest';
import { createGame, gameView, hostPlan, transition } from '../src/game/engine';
import { questions } from '../src/game/questions';
import { defaultPresentation, defaultSettings } from '../src/game/types';
const make = () =>
  createGame(
    { ...defaultSettings, rounds: 3, questionsPerRound: 2, penalty: 10 },
    [
      { id: 'a', name: 'Grace', color: '#f8d477' },
      { id: 'b', name: 'Faith', color: '#85dad2' },
    ],
    questions,
  );
it('moves full rounds and individual words without losing or duplicating questions', () => {
  const game = make();
  const moved = transition(game, { type: 'MOVE_ROUND', from: 2, to: 0 }, 0);
  expect(moved.deck.slice(0, 2)).toEqual(game.deck.slice(4, 6));
  expect(moved.deck.slice(2, 6)).toEqual(game.deck.slice(0, 4));
  const word = transition(moved, { type: 'MOVE_QUESTION', from: 0, to: 5 }, 0);
  expect(word.deck[5]).toEqual(moved.deck[0]);
  expect(new Set(word.deck.map((q) => q.id)).size).toBe(game.deck.length);
  expect(gameView(word)).not.toHaveProperty('deck');
  expect(gameView(word)).not.toHaveProperty('hostPlan');
});
it('locks started rounds and current/played questions while allowing future changes', () => {
  const game = transition(make(), { type: 'START' }, 0);
  expect(transition(game, { type: 'MOVE_ROUND', from: 0, to: 1 }, 1)).toBe(game);
  expect(transition(game, { type: 'MOVE_QUESTION', from: 1, to: 0 }, 1)).toBe(game);
  expect(transition(game, { type: 'MOVE_ROUND', from: 1, to: 2 }, 1)).not.toBe(game);
  const ended = transition(game, { type: 'END_GAME' }, 1);
  expect(transition(ended, { type: 'MOVE_QUESTION', from: 1, to: 2 }, 1)).toBe(ended);
});
it('replaces from unused matching reserves and requires pause before replacing a live word', () => {
  const game = transition(transition(make(), { type: 'START' }, 0), { type: 'TICK' }, 3000);
  const reserve = hostPlan(game).reserves[0];
  const action = { type: 'REPLACE_QUESTION' as const, index: 0, questionId: reserve.id };
  expect(transition(game, action, 3001)).toBe(game);
  const paused = transition(game, { type: 'PAUSE' }, 3001);
  const replaced = transition(paused, action, 3002);
  expect(replaced.deck[0].id).toBe(reserve.id);
  expect(replaced.remainingMs).toBe(paused.remainingMs);
  expect(new Set(replaced.deck.map((q) => q.id)).size).toBe(game.deck.length);
  expect(transition(paused, { ...action, questionId: game.deck[1].id }, 3002)).toBe(paused);
  const penalized = transition(game, { type: 'PENALTY', teamId: 'a' }, 3001);
  const pausedPenalty = transition(penalized, { type: 'PAUSE' }, 3002);
  expect(transition(pausedPenalty, action, 3003)).toBe(pausedPenalty);
});
it('edits team branding while preserving identity, ledger and score; rejects duplicate names', () => {
  const active = transition(transition(make(), { type: 'START' }, 0), { type: 'TICK' }, 3000);
  const scored = transition(active, { type: 'AWARD', teamId: 'a' }, 3001);
  const renamed = transition(
    scored,
    { type: 'EDIT_TEAM', teamId: 'a', name: 'Champions', color: '#abcdef' },
    3002,
  );
  expect(renamed.teams[0]).toEqual({ id: 'a', name: 'Champions', color: '#abcdef', score: 100 });
  expect(renamed.ledger).toEqual(scored.ledger);
  expect(
    transition(
      renamed,
      { type: 'EDIT_TEAM', teamId: 'b', name: 'champions', color: '#ffffff' },
      3002,
    ),
  ).toBe(renamed);
});
it('validates display settings and rejects malformed positions or injected style values', () => {
  const game = make();
  const updated = transition(
    game,
    {
      type: 'PRESENTATION',
      presentation: {
        ...defaultPresentation,
        theme: 'midnight',
        title: 'Youth night',
        announcement: 'Welcome!',
        confetti: false,
      },
    },
    0,
  );
  expect(gameView(updated).presentation.theme).toBe('midnight');
  expect(
    transition(
      game,
      { type: 'PRESENTATION', presentation: { ...defaultPresentation, title: '<script>' } },
      0,
    ),
  ).toBe(game);
  expect(
    transition(game, { type: 'EDIT_TEAM', teamId: 'a', name: 'Grace', color: 'url(bad)' }, 0),
  ).toBe(game);
  expect(transition(game, { type: 'MOVE_QUESTION', from: -1, to: 0 }, 0)).toBe(game);
  expect(
    transition(game, { type: 'REPLACE_QUESTION', index: 200, questionId: game.deck[6].id }, 0),
  ).toBe(game);
});
