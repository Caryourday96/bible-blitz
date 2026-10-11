import { z } from 'zod';
import { categories, difficulties } from './types';
export const settingsSchema = z.object({
  mode: z.enum(['party', 'host', 'online', 'solo']),
  categories: z
    .array(z.enum(categories))
    .min(1)
    .max(10)
    .transform((v) => [...new Set(v)]),
  difficulty: z.enum(['All', ...difficulties]),
  rounds: z.number().int().min(1).max(10),
  questionsPerRound: z.number().int().min(1).max(20),
  seconds: z.union([
    z.literal(0),
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(30),
    z.literal(60),
  ]),
  points: z.number().int().min(1).max(1000),
  penalty: z.number().int().min(0).max(1000),
  steals: z.boolean(),
  tiebreaker: z.boolean(),
  answerMode: z.enum(['host', 'typed', 'buzz-verbal', 'buzz-typed']),
  sound: z.boolean(),
  music: z.boolean(),
  volume: z.number().min(0).max(1),
});
export const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .refine(
    (value) =>
      ![...value].some(
        (char) =>
          char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 || char === '<' || char === '>',
      ),
    'Use a name without control characters or angle brackets.',
  );
export const teamSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,40}$/),
  name: nameSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export const setupSchema = z
  .object({ settings: settingsSchema, teams: z.array(teamSchema).min(1).max(8) })
  .superRefine((value, ctx) => {
    if (value.settings.mode !== 'solo' && value.teams.length < 2)
      ctx.addIssue({ code: 'custom', message: 'Add at least two teams.' });
    if (value.settings.mode === 'solo' && value.teams.length !== 1)
      ctx.addIssue({ code: 'custom', message: 'Solo games need exactly one player.' });
    if (
      new Set(value.teams.map((t) => t.id)).size !== value.teams.length ||
      new Set(value.teams.map((t) => t.name.toLowerCase())).size !== value.teams.length
    )
      ctx.addIssue({ code: 'custom', message: 'Give every team a unique name and ID.' });
  });
const displayText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) =>
        ![...v].some(
          (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || c === '<' || c === '>',
        ),
      'Use plain text without control characters.',
    );
export const presentationSchema = z.object({
  title: displayText(80),
  theme: z.enum(['forest', 'midnight', 'plum', 'sunrise']),
  background: z.enum(['solid', 'spotlight', 'grid']),
  textSize: z.enum(['standard', 'large', 'extra-large']),
  announcement: displayText(160),
  winnerMessage: displayText(120),
  confetti: z.boolean(),
});
const position = z.number().int().min(0).max(199);
export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('MOVE_QUESTION'), from: position, to: position }),
  z.object({
    type: z.literal('MOVE_ROUND'),
    from: z.number().int().min(0).max(9),
    to: z.number().int().min(0).max(9),
  }),
  z.object({
    type: z.literal('REPLACE_QUESTION'),
    index: position,
    questionId: z.string().max(80),
  }),
  z.object({
    type: z.literal('EDIT_TEAM'),
    teamId: z.string().max(40),
    name: nameSchema,
    color: teamSchema.shape.color,
  }),
  z.object({ type: z.literal('PRESENTATION'), presentation: presentationSchema }),
  z.object({
    type: z.enum([
      'START',
      'PAUSE',
      'RESUME',
      'REVEAL',
      'SKIP',
      'NEXT',
      'UNDO',
      'END_ROUND',
      'END_GAME',
      'HINT',
      'CANCEL',
    ]),
  }),
  z.object({ type: z.literal('AWARD'), teamId: z.string().max(40) }),
  z.object({ type: z.literal('PENALTY'), teamId: z.string().max(40) }),
  z.object({ type: z.literal('BUZZ'), teamId: z.string().max(40) }),
  z.object({ type: z.literal('ANSWER'), teamId: z.string().max(40), answer: z.string().max(80) }),
]);
