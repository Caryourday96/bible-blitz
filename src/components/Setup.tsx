'use client';
import { useState } from 'react';
import { ArrowRight, Check, Plus, Trash2, Users, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import {
  categories,
  defaultSettings,
  difficulties,
  teamColors,
  type Mode,
  type Settings,
  type Team,
} from '@/game/types';
import { questions } from '@/game/questions';
import { availableQuestions } from '@/game/engine';
import { setupSchema } from '@/game/validation';
const modeTitles = {
  party: 'Make it a game night.',
  solo: 'A little faith. A little speed.',
  host: 'Set the stage.',
  online: 'Your people. Any place.',
};
export function Setup({
  mode,
  onCreate,
  onBack,
  busy,
}: {
  mode: Mode;
  onCreate: (settings: Settings, teams: Omit<Team, 'score'>[]) => void;
  onBack: () => void;
  busy: boolean;
}) {
  const [settings, setSettings] = useState<Settings>({
    ...defaultSettings,
    mode,
    answerMode: mode === 'solo' ? 'typed' : mode === 'online' ? 'buzz-typed' : 'host',
    rounds: mode === 'solo' ? 1 : 3,
    questionsPerRound: mode === 'solo' ? 10 : 5,
  });
  const [teams, setTeams] = useState<Omit<Team, 'score'>[]>(
    mode === 'solo'
      ? [{ id: 'team-1', name: 'You', color: teamColors[0] }]
      : [
          { id: 'team-1', name: 'Team Grace', color: teamColors[0] },
          { id: 'team-2', name: 'Team Faith', color: teamColors[1] },
        ],
  );
  const [error, setError] = useState('');
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));
  const available = availableQuestions(questions, settings).length;
  const total = settings.rounds * settings.questionsPerRound;
  const start = () => {
    const result = setupSchema.safeParse({ settings, teams });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (total > available) {
      setError(`Choose ${available} or fewer questions, or broaden your categories.`);
      return;
    }
    setError('');
    onCreate(result.data.settings, result.data.teams);
  };
  return (
    <main className="setup page-enter">
      <button className="text-button back" onClick={onBack}>
        <ArrowLeft size={16} /> Choose a mode
      </button>
      <div className="page-heading">
        <span className="eyebrow">
          {mode === 'solo'
            ? 'SOLO CHALLENGE'
            : mode === 'host'
              ? 'HOST + BIG SCREEN'
              : mode === 'online'
                ? 'ONLINE MULTIPLAYER'
                : 'PARTY MODE'}{' '}
          / GAME SETUP
        </span>
        <h1>{modeTitles[mode]}</h1>
        <p>A few quick picks. Then it’s anybody’s game.</p>
      </div>
      <div className="setup-grid">
        <div className="setup-main">
          <section className="panel">
            <h2>
              <Users size={20} /> {mode === 'solo' ? 'Your player' : 'Meet the teams'}
              <span className="section-number">01</span>
            </h2>
            <p className="muted">
              {mode === 'solo'
                ? 'Make your next personal best.'
                : 'Pick a name, claim a color, gather your people.'}
            </p>
            <div className="team-fields">
              {teams.map((team, index) => (
                <div className="team-field" key={team.id}>
                  <label
                    className="color-picker"
                    title={`Team ${index + 1} color`}
                    style={{ background: team.color }}
                  >
                    <input
                      aria-label={`Team ${index + 1} color`}
                      type="color"
                      value={team.color}
                      onChange={(e) =>
                        setTeams((ts) =>
                          ts.map((t) => (t.id === team.id ? { ...t, color: e.target.value } : t)),
                        )
                      }
                    />
                  </label>
                  <label className="grow">
                    <span className="sr-only">
                      {mode === 'solo' ? 'Player name' : `Team ${index + 1} name`}
                    </span>
                    <input
                      maxLength={24}
                      value={team.name}
                      onChange={(e) =>
                        setTeams((ts) =>
                          ts.map((t) => (t.id === team.id ? { ...t, name: e.target.value } : t)),
                        )
                      }
                    />
                  </label>
                  {mode !== 'solo' && (
                    <button
                      className="icon-button"
                      aria-label={`Remove team ${index + 1}`}
                      disabled={teams.length <= 2}
                      onClick={() => setTeams((ts) => ts.filter((t) => t.id !== team.id))}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {mode !== 'solo' && (
              <button
                className="add-team"
                disabled={teams.length >= 8}
                onClick={() =>
                  setTeams((ts) => [
                    ...ts,
                    {
                      id: crypto.randomUUID(),
                      name: `Team ${ts.length + 1}`,
                      color: teamColors[ts.length],
                    },
                  ])
                }
              >
                <Plus size={16} /> Add a team <span>{teams.length}/8</span>
              </button>
            )}
          </section>
          <section className="panel">
            <h2>
              Choose your territory<span className="section-number">02</span>
            </h2>
            <p className="muted">Mix your favorites. Every word appears only once.</p>
            <div className="category-toolbar">
              <button className="text-button" onClick={() => set('categories', [...categories])}>
                Select all
              </button>
              <button className="text-button" onClick={() => set('categories', [])}>
                Clear
              </button>
            </div>
            <div className="category-grid">
              {categories.map((category, i) => (
                <button
                  className={`category-chip ${settings.categories.includes(category) ? 'selected' : ''}`}
                  aria-pressed={settings.categories.includes(category)}
                  key={category}
                  onClick={() =>
                    set(
                      'categories',
                      settings.categories.includes(category)
                        ? settings.categories.filter((c) => c !== category)
                        : [...settings.categories, category],
                    )
                  }
                >
                  <span className="category-index">{String(i + 1).padStart(2, '0')}</span>
                  {category}
                  <Check size={15} />
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={settings.difficulty}
                onChange={(e) => set('difficulty', e.target.value as Settings['difficulty'])}
              >
                {['All', ...difficulties].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <p className={available < total ? 'error-text' : 'muted small'}>
              {available} matching words · {total} needed for this game
            </p>
          </section>
        </div>
        <aside className="panel settings-panel">
          <h2>
            <SlidersHorizontal size={19} /> The house rules
            <span className="section-number">03</span>
          </h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="rounds">Rounds</label>
              <input
                id="rounds"
                type="number"
                min={1}
                max={10}
                value={settings.rounds}
                onChange={(e) => set('rounds', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="questions">Words / round</label>
              <input
                id="questions"
                type="number"
                min={1}
                max={20}
                value={settings.questionsPerRound}
                onChange={(e) => set('questionsPerRound', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="timer">Time per word</label>
            <select
              id="timer"
              value={settings.seconds}
              onChange={(e) => set('seconds', Number(e.target.value))}
            >
              {[5, 10, 15, 20, 30, 60, 0].map((v) => (
                <option key={v} value={v}>
                  {v ? `${v} seconds` : 'Unlimited'}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="points">Correct answer</label>
              <input
                id="points"
                type="number"
                min={1}
                max={1000}
                value={settings.points}
                onChange={(e) => set('points', Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="penalty">Wrong penalty</label>
              <input
                id="penalty"
                type="number"
                min={0}
                max={1000}
                value={settings.penalty}
                onChange={(e) => set('penalty', Number(e.target.value))}
              />
            </div>
          </div>
          {mode !== 'solo' && (
            <>
              <div className="field">
                <label htmlFor="answer-mode">How you answer</label>
                <select
                  id="answer-mode"
                  value={settings.answerMode}
                  onChange={(e) => set('answerMode', e.target.value as Settings['answerMode'])}
                >
                  <option value="host">Say it · host scores</option>
                  <option value="typed">Type the answer</option>
                  <option value="buzz-verbal">Buzz + say it</option>
                  <option value="buzz-typed">Buzz + type it</option>
                </select>
              </div>
              <label className="toggle">
                <span>
                  Allow steals<small>Another team gets a shot after a miss</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.steals}
                  onChange={(e) => set('steals', e.target.checked)}
                />
              </label>
              <label className="toggle">
                <span>
                  Sudden-death tiebreaker<small>Keep going until one team leads</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.tiebreaker}
                  onChange={(e) => set('tiebreaker', e.target.checked)}
                />
              </label>
            </>
          )}
          <label className="toggle">
            <span>Sound effects</span>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => set('sound', e.target.checked)}
            />
          </label>
          <label className="toggle">
            <span>Background beat</span>
            <input
              type="checkbox"
              checked={settings.music}
              onChange={(e) => set('music', e.target.checked)}
            />
          </label>
          <div className="field">
            <label htmlFor="volume">Volume</label>
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => set('volume', Number(e.target.value))}
            />
          </div>
          <div className="setup-summary">
            <b>{total} words</b>
            <span>
              {settings.seconds
                ? `About ${Math.ceil((total * (settings.seconds + 8)) / 60)} minutes`
                : 'At your own pace'}
            </span>
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button
            className="button primary wide"
            disabled={busy || available < total || !available}
            onClick={start}
          >
            {busy ? 'Setting the stage…' : mode === 'solo' ? 'Start my challenge' : 'Create game'}
            <ArrowRight size={19} />
          </button>
          <p className="small muted center">No accounts. Just a little friendly competition.</p>
        </aside>
      </div>
    </main>
  );
}
