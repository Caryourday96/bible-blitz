'use client';
import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  Monitor,
  Users,
  ListOrdered,
  X,
} from 'lucide-react';
import {
  defaultPresentation,
  type Action,
  type GameView,
  type HostPlan,
  type Team,
} from '@/game/types';
import { PresentationFrame } from './PresentationFrame';
import { presentationSchema, teamSchema } from '@/game/validation';

export function HostTools({
  view,
  plan,
  connected,
  onAction,
}: {
  view: GameView;
  plan: HostPlan;
  connected: boolean;
  onAction: (a: Action) => void;
}) {
  const [tab, setTab] = useState<'plan' | 'teams' | 'studio' | null>(null);
  const [round, setRound] = useState(0);
  const [replace, setReplace] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(view.presentation ?? defaultPresentation);
  const [validationError, setValidationError] = useState('');
  const total = view.settings.rounds * view.settings.questionsPerRound;
  const size = view.settings.questionsPerRound;
  const ended = ['GAME_RESULTS', 'CANCELLED'].includes(view.phase) || view.isTiebreak;
  const first = view.phase === 'LOBBY' ? 0 : view.index + 1;
  const firstRound = view.phase === 'LOBBY' ? 0 : Math.ceil((view.index + 1) / size);
  const canReplace = (index: number) =>
    !ended &&
    (index >= first ||
      (index === view.index &&
        view.phase === 'PAUSED' &&
        !view.ledger.some((e) => e.question === index)));
  const live = JSON.stringify(draft) === JSON.stringify(view.presentation);
  return (
    <section className="host-tools" aria-label="Host tools">
      <div className="host-tool-bar">
        <button
          className={`button secondary ${tab && tab !== 'studio' ? 'selected' : ''}`}
          aria-expanded={tab === 'plan' || tab === 'teams'}
          onClick={() => setTab(tab === 'plan' || tab === 'teams' ? null : 'plan')}
        >
          <SlidersHorizontal size={18} /> Host Control Center
        </button>
        <button
          className={`button secondary ${tab === 'studio' ? 'selected' : ''}`}
          aria-expanded={tab === 'studio'}
          onClick={() => setTab(tab === 'studio' ? null : 'studio')}
        >
          <Monitor size={18} /> TV Presentation Studio
        </button>
      </div>
      {tab && (
        <div className="tool-workspace">
          <div className="tool-heading">
            <div>
              <span className="eyebrow">YOUR SHOW. YOUR WAY.</span>
              <h2>{tab === 'studio' ? 'TV Presentation Studio' : 'Host Control Center'}</h2>
            </div>
            <button
              className="icon-button"
              aria-label="Close host tools"
              onClick={() => setTab(null)}
            >
              <X size={20} />
            </button>
          </div>
          {tab !== 'studio' && (
            <>
              <p className="small muted">
                Host-only planning contains answers. Keep this screen off the TV; use the separate
                display.
              </p>
              <div className="tool-tabs">
                <button
                  className="button secondary"
                  aria-pressed={tab === 'plan'}
                  onClick={() => setTab('plan')}
                >
                  <ListOrdered size={16} /> Run of show
                </button>
                <button
                  className="button secondary"
                  aria-pressed={tab === 'teams'}
                  onClick={() => setTab('teams')}
                >
                  <Users size={16} /> Teams
                </button>
              </div>
            </>
          )}
          <fieldset disabled={!connected} className="tool-fields">
            {tab !== 'studio' && (
              <div className="desk-controls" aria-label="Live host controls">
                {view.phase === 'LOBBY' && (
                  <button className="button primary" onClick={() => onAction({ type: 'START' })}>
                    Start game
                  </button>
                )}
                {['QUESTION_ACTIVE', 'COUNTDOWN', 'PAUSED'].includes(view.phase) && (
                  <button
                    className="button secondary"
                    onClick={() => onAction({ type: view.phase === 'PAUSED' ? 'RESUME' : 'PAUSE' })}
                  >
                    {view.phase === 'PAUSED' ? 'Resume clock' : 'Pause clock'}
                  </button>
                )}
                {view.phase === 'QUESTION_ACTIVE' && (
                  <button className="button secondary" onClick={() => onAction({ type: 'REVEAL' })}>
                    Reveal answer
                  </button>
                )}
                {['ANSWER_REVEAL', 'ROUND_RESULTS'].includes(view.phase) && (
                  <button className="button primary" onClick={() => onAction({ type: 'NEXT' })}>
                    Advance game
                  </button>
                )}
                {['QUESTION_ACTIVE', 'ANSWER_REVEAL'].includes(view.phase) &&
                  view.teams.map((t) => (
                    <button
                      className="button secondary"
                      key={t.id}
                      disabled={
                        Boolean(view.awardedTo) ||
                        view.penalized.includes(t.id) ||
                        !view.eligibleTeams.includes(t.id) ||
                        Boolean(view.buzzTeam && view.buzzTeam !== t.id)
                      }
                      onClick={() => onAction({ type: 'AWARD', teamId: t.id })}
                    >
                      Award {t.name}
                    </button>
                  ))}
              </div>
            )}
            {tab === 'plan' && (
              <>
                <div className="run-summary">
                  <strong>
                    {view.phase === 'LOBBY'
                      ? 'Ready to prepare'
                      : `Live: round ${view.round}, word ${view.questionInRound}`}
                  </strong>
                  <span>
                    {total} planned words · {plan.reserves.length} alternatives
                  </span>
                </div>
                <label className="field">
                  View round
                  <select
                    aria-label="View round"
                    value={round}
                    onChange={(e) => {
                      setRound(Number(e.target.value));
                      setReplace(null);
                    }}
                  >
                    {Array.from({ length: view.settings.rounds }, (_, i) => (
                      <option key={i} value={i}>
                        Round {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="tool-actions">
                  <button
                    className="button secondary"
                    disabled={ended || round <= firstRound}
                    onClick={() => {
                      onAction({ type: 'MOVE_ROUND', from: round, to: round - 1 });
                      setRound(round - 1);
                    }}
                  >
                    <ArrowUp size={15} /> Move round earlier
                  </button>
                  <button
                    className="button secondary"
                    disabled={ended || round < firstRound || round >= view.settings.rounds - 1}
                    onClick={() => {
                      onAction({ type: 'MOVE_ROUND', from: round, to: round + 1 });
                      setRound(round + 1);
                    }}
                  >
                    <ArrowDown size={15} /> Move round later
                  </button>
                </div>
                <p className="small muted">
                  Reorder upcoming words and unstarted rounds. To replace the current word, pause
                  before any score is recorded.
                </p>
                <ol className="question-plan">
                  {plan.queue.slice(round * size, (round + 1) * size).map((q, i) => {
                    const index = round * size + i;
                    return (
                      <li key={`${index}-${q.id}`}>
                        <span className="plan-position">{index + 1}</span>
                        <div className="plan-word">
                          <strong>{q.answer}</strong>
                          <small>
                            {q.difficulty} · {q.categories[0]}{' '}
                            {index === view.index && view.phase !== 'LOBBY'
                              ? '· Current word'
                              : index < first
                                ? '· Locked'
                                : ''}
                          </small>
                        </div>
                        <div className="plan-actions">
                          <button
                            className="icon-button"
                            aria-label={`Move word ${index + 1} earlier`}
                            disabled={ended || index <= first}
                            onClick={() =>
                              onAction({ type: 'MOVE_QUESTION', from: index, to: index - 1 })
                            }
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Move word ${index + 1} later`}
                            disabled={ended || index < first || index >= total - 1}
                            onClick={() =>
                              onAction({ type: 'MOVE_QUESTION', from: index, to: index + 1 })
                            }
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            className="button secondary"
                            disabled={!canReplace(index) || !plan.reserves.length}
                            onClick={() => {
                              setReplace(index);
                              setSearch('');
                            }}
                          >
                            Replace word {index + 1}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {replace !== null && (
                  <section className="replacement-picker" aria-label="Choose replacement">
                    <h3>Replace word {replace + 1}</h3>
                    <p className="small muted">
                      Unused words matching this game’s categories and difficulty.
                    </p>
                    <label className="field">
                      Find an alternative
                      <input
                        aria-label="Find an alternative"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        maxLength={80}
                      />
                    </label>
                    <div className="replacement-list">
                      {plan.reserves
                        .filter((q) => q.answer.toLowerCase().includes(search.toLowerCase()))
                        .map((q) => (
                          <button
                            key={q.id}
                            className="replacement-option"
                            disabled={!canReplace(replace)}
                            onClick={() => {
                              onAction({
                                type: 'REPLACE_QUESTION',
                                index: replace,
                                questionId: q.id,
                              });
                              setReplace(null);
                            }}
                          >
                            <strong>{q.answer}</strong>
                            <small>{q.difficulty}</small>
                          </button>
                        ))}
                    </div>
                    <button className="text-button" onClick={() => setReplace(null)}>
                      Cancel replacement
                    </button>
                  </section>
                )}
              </>
            )}
            {tab === 'teams' && (
              <>
                <p className="muted">
                  Update team names and colors without changing their scores or player assignments.
                </p>
                <div className="team-editor-list">
                  {view.teams.map((team) => (
                    <TeamEditor key={team.id} team={team} teams={view.teams} onAction={onAction} />
                  ))}
                </div>
              </>
            )}
            {tab === 'studio' && (
              <div className="studio-layout">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = presentationSchema.safeParse(draft);
                    if (!parsed.success) {
                      setValidationError('Use plain text within the displayed length limits.');
                      return;
                    }
                    setValidationError('');
                    setDraft(parsed.data);
                    onAction({ type: 'PRESENTATION', presentation: parsed.data });
                  }}
                  className="studio-form"
                >
                  <label className="field">
                    Event title
                    <input
                      value={draft.title}
                      maxLength={80}
                      placeholder="Friday night Bible Blitz"
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    />
                  </label>
                  <div className="studio-pair">
                    <label className="field">
                      Theme
                      <select
                        value={draft.theme}
                        onChange={(e) =>
                          setDraft({ ...draft, theme: e.target.value as typeof draft.theme })
                        }
                      >
                        <option value="forest">Forest & gold</option>
                        <option value="midnight">Midnight blue</option>
                        <option value="plum">Royal plum</option>
                        <option value="sunrise">Warm sunrise</option>
                      </select>
                    </label>
                    <label className="field">
                      Background
                      <select
                        value={draft.background}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            background: e.target.value as typeof draft.background,
                          })
                        }
                      >
                        <option value="spotlight">Spotlight</option>
                        <option value="solid">Solid</option>
                        <option value="grid">Grid</option>
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    TV text size
                    <select
                      value={draft.textSize}
                      onChange={(e) =>
                        setDraft({ ...draft, textSize: e.target.value as typeof draft.textSize })
                      }
                    >
                      <option value="standard">Standard</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra large</option>
                    </select>
                  </label>
                  <label className="field">
                    Announcement
                    <textarea
                      value={draft.announcement}
                      maxLength={160}
                      rows={2}
                      placeholder="Refreshments after round two"
                      onChange={(e) =>
                        setDraft({ ...draft, announcement: e.target.value.replace(/\n/g, ' ') })
                      }
                    />
                  </label>
                  <label className="field">
                    Winner screen message
                    <input
                      value={draft.winnerMessage}
                      maxLength={120}
                      onChange={(e) => setDraft({ ...draft, winnerMessage: e.target.value })}
                    />
                  </label>
                  <label className="toggle">
                    <span>Celebration confetti</span>
                    <input
                      type="checkbox"
                      checked={draft.confetti}
                      onChange={(e) => setDraft({ ...draft, confetti: e.target.checked })}
                    />
                  </label>
                  <div className="tool-actions">
                    <button className="button primary" type="submit" disabled={live}>
                      Apply to TV
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setDraft({ ...defaultPresentation })}
                    >
                      Reset draft
                    </button>
                  </div>
                  {validationError && <p role="alert">{validationError}</p>}
                  <p className="small muted" role="status">
                    {live
                      ? 'These settings are live on connected displays.'
                      : 'Preview only. Apply when you’re ready.'}
                  </p>
                </form>
                <div className="studio-preview">
                  <span className="eyebrow">DISPLAY PREVIEW · SAMPLE WORD</span>
                  <PresentationFrame settings={draft} finished>
                    <div className="preview-game">
                      <span className="eyebrow">UNSCRAMBLE THE WORD</span>
                      <div className="preview-sample">FAITH</div>
                      <div className="preview-teams">
                        {view.teams.map((t) => (
                          <span key={t.id} style={{ borderColor: t.color }}>
                            {t.name}
                            <b>{t.score}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  </PresentationFrame>
                  <p className="small muted">
                    Applies to Cast, remote big screens and local presentation windows. Team colors
                    are edited in the Control Center.
                  </p>
                </div>
              </div>
            )}
          </fieldset>
          {!connected && <p role="status">Connect to the game to use host tools.</p>}
        </div>
      )}
    </section>
  );
}
function TeamEditor({
  team,
  teams,
  onAction,
}: {
  team: Team;
  teams: Team[];
  onAction: (a: Action) => void;
}) {
  const [name, setName] = useState(team.name),
    [color, setColor] = useState(team.color);
  const [error, setError] = useState('');
  return (
    <form
      className="team-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = teamSchema.safeParse({ id: team.id, name, color });
        if (
          !parsed.success ||
          teams.some((t) => t.id !== team.id && t.name.toLowerCase() === name.trim().toLowerCase())
        ) {
          setError('Use a unique team name of 1–24 plain-text characters.');
          return;
        }
        setError('');
        setName(parsed.data.name);
        onAction({ type: 'EDIT_TEAM', teamId: team.id, name: parsed.data.name, color });
      }}
    >
      <label className="field">
        Team name
        <input
          aria-label={`Name for ${team.name}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={24}
        />
      </label>
      <label className="field">
        Color
        <input
          type="color"
          aria-label={`Color for ${team.name}`}
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <strong>{team.score} pts</strong>
      <button className="button secondary" disabled={name === team.name && color === team.color}>
        Save team
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
