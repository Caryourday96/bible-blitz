'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  Flag,
  Lightbulb,
  Pause,
  Play,
  SkipForward,
  Trophy,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import type { Action, GameView, Team } from '@/game/types';

export function Scoreboard({ teams, awardedTo }: { teams: Team[]; awardedTo: string | null }) {
  return (
    <div className="scoreboard">
      {teams.map((team, index) => (
        <div
          key={team.id}
          className={`score-card ${team.id === awardedTo ? 'scored' : ''}`}
          style={{ '--team': team.color } as React.CSSProperties}
        >
          <span className="team-dot" />
          <span className="team-name">
            <small>TEAM {String(index + 1).padStart(2, '0')}</small>
            {team.name}
          </span>
          <strong aria-label={`${team.name} score ${team.score}`}>{team.score}</strong>
        </div>
      ))}
    </div>
  );
}
function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 7) * 0.13}s`,
            background: ['#f8d477', '#85dad2', '#c4a8ef'][i % 3],
            transform: `rotate(${i * 17}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function GameScreen({
  view,
  onAction,
  onReplay,
  presentation = false,
  playerTeam,
  remote = false,
  connected = true,
  children,
  serverOffset = 0,
  best = 0,
}: {
  view: GameView;
  onAction: (a: Action) => void;
  onReplay: () => void;
  presentation?: boolean;
  playerTeam?: string;
  remote?: boolean;
  connected?: boolean;
  children?: React.ReactNode;
  serverOffset?: number;
  best?: number;
}) {
  const [now, setNow] = useState(0),
    [answer, setAnswer] = useState(''),
    [localTeam, setLocalTeam] = useState(view.teams[0].id),
    [confirmation, setConfirmation] = useState<'END_ROUND' | 'END_GAME' | null>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (confirmation && !confirmRef.current?.open) confirmRef.current?.showModal();
  }, [confirmation]);
  const isPlayer = Boolean(playerTeam),
    isHost = !isPlayer && !presentation;
  const solo = view.settings.mode === 'solo';
  const actingTeam = playerTeam || localTeam;
  const active = view.phase === 'QUESTION_ACTIVE',
    revealed = view.phase === 'ANSWER_REVEAL';
  const seconds =
    view.deadline === null
      ? null
      : Math.max(0, Math.ceil((view.deadline - now - serverOffset) / 1000));
  const paused = view.phase === 'PAUSED';
  const canAct =
    connected &&
    active &&
    !view.penalized.includes(actingTeam) &&
    view.eligibleTeams.includes(actingTeam);
  const hasBuzz = view.settings.answerMode.startsWith('buzz');
  const typed = ['typed', 'buzz-typed'].includes(view.settings.answerMode);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!isHost || presentation) return;
    const handle = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName) ||
          event.target.isContentEditable)
      )
        return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      const actions: Record<string, Action> = {
        ' ': { type: paused ? 'RESUME' : 'PAUSE' },
        r: { type: 'REVEAL' },
        n: { type: 'NEXT' },
        u: { type: 'UNDO' },
        s: { type: 'SKIP' },
      };
      if (actions[key]) {
        event.preventDefault();
        onAction(actions[key]);
      }
      const index = Number(key) - 1;
      if (index >= 0 && index < view.teams.length)
        onAction({ type: 'AWARD', teamId: view.teams[index].id });
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onAction, isHost, presentation, paused, view.teams]);
  const standings = [...view.teams].sort((a, b) => b.score - a.score);
  const isResults = ['ROUND_RESULTS', 'GAME_RESULTS', 'CANCELLED'].includes(view.phase);
  if (isResults)
    return (
      <main className={`game-page results ${presentation ? 'presentation' : ''}`}>
        {view.phase === 'GAME_RESULTS' && <Confetti />}
        <span className="eyebrow">
          {view.phase === 'ROUND_RESULTS'
            ? `ROUND ${view.round} / ${view.settings.rounds}`
            : 'THAT’S A BLITZ!'}
        </span>
        <div className="trophy-mark">
          <Trophy size={48} />
        </div>
        <h1>
          {view.phase === 'ROUND_RESULTS'
            ? 'The standings.'
            : solo
              ? 'Nice work, word wonder.'
              : view.winners.length > 1
                ? 'A shared victory!'
                : `${view.winners[0]?.name} wins!`}
        </h1>
        <p className="muted">
          {view.message}
          {solo && ` Personal best: ${Math.max(best, view.teams[0].score)} points.`}
        </p>
        <div className="standings" aria-label="Leaderboard">
          {standings.map((team, i) => (
            <div key={team.id} style={{ '--team': team.color } as React.CSSProperties}>
              <span className="rank">
                {i && team.score === standings[i - 1].score ? '=' : i + 1}
              </span>
              <span className="team-dot" />
              <b>{team.name}</b>
              <strong>
                {team.score}
                <small>PTS</small>
              </strong>
            </div>
          ))}
        </div>
        {!presentation &&
          (isHost ? (
            <div className="result-actions">
              {view.phase === 'ROUND_RESULTS' ? (
                <button className="button primary" onClick={() => onAction({ type: 'NEXT' })}>
                  Next round
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button className="button primary" onClick={onReplay}>
                  Play again
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          ) : (
            <p className="muted">Waiting for the host…</p>
          ))}
        {children}
      </main>
    );
  if (view.phase === 'LOBBY')
    return (
      <main className={`game-page lobby ${presentation ? 'presentation' : ''}`}>
        <span className="eyebrow">THE TEAMS ARE IN</span>
        <h1>
          Ready, set,<em> almost.</em>
        </h1>
        <p className="muted">
          {remote
            ? 'Share the room. Gather your people.'
            : 'Gather around. Say it first. Claim the points.'}
        </p>
        <Scoreboard teams={view.teams} awardedTo={null} />
        {children}
        {isHost ? (
          <button
            className="button primary large"
            disabled={!connected}
            onClick={() => onAction({ type: 'START' })}
          >
            Let’s play
            <Zap size={21} />
          </button>
        ) : (
          <p className="waiting">
            <span />
            Waiting for the host to start
          </p>
        )}
        <p className="small muted">
          {view.settings.rounds} rounds · {view.settings.questionsPerRound} words per round ·{' '}
          {view.settings.seconds ? `${view.settings.seconds} seconds` : 'Unlimited time'} ·{' '}
          {view.settings.points} points per word
        </p>
      </main>
    );
  return (
    <main className={`game-page ${presentation ? 'presentation' : ''}`}>
      <div className="game-topline">
        <span>
          <span className="live-dot" />
          {view.isTiebreak ? 'SUDDEN DEATH' : `ROUND ${view.round} OF ${view.settings.rounds}`}
        </span>
        <span>
          WORD {view.questionInRound}
          {!view.isTiebreak && ` / ${view.settings.questionsPerRound}`}
        </span>
        <span>{solo ? `${view.streak} IN A ROW` : remote ? 'LIVE ROOM' : 'PARTY MODE'}</span>
      </div>
      <section
        className={`word-stage ${revealed ? 'revealed' : ''} ${seconds !== null && seconds <= 5 && active ? 'urgent' : ''}`}
        aria-label="Current question"
      >
        {revealed && view.awardedTo && <Confetti />}
        <div className="stage-meta">
          <span className="pill">{view.question?.categories[0]}</span>
          <span className="muted small">{view.question?.difficulty}</span>
        </div>
        <div className="clock-wrap">
          <div
            className="timer"
            role="timer"
            aria-label={paused ? 'Timer paused' : `Time remaining: ${seconds ?? 'unlimited'}`}
          >
            <span>
              {paused
                ? 'Ⅱ'
                : seconds === null
                  ? '∞'
                  : Math.min(seconds, view.phase === 'COUNTDOWN' ? 3 : view.settings.seconds)}
            </span>
            <small>
              {view.phase === 'COUNTDOWN' ? 'GET READY' : paused ? 'PAUSED' : 'SECONDS'}
            </small>
          </div>
        </div>
        {view.phase === 'COUNTDOWN' ? (
          <div className="countdown-content">
            <span className="eyebrow">EYES UP. BRAINS ON.</span>
            <h1>
              Here we <em>go.</em>
            </h1>
            <p>The next word is on its way.</p>
          </div>
        ) : paused ? (
          <div className="countdown-content">
            <Pause size={48} />
            <h1>A little breather.</h1>
            <p>The clock is paused. Your points are safe.</p>
          </div>
        ) : (
          <>
            <p className="stage-instruction">{revealed ? 'THERE IT IS.' : 'UNSCRAMBLE THE WORD'}</p>
            <div
              className={`letter-tiles ${view.question && view.question.length > 12 ? 'long-word' : ''}`}
              aria-label={
                revealed
                  ? `Answer: ${view.question?.answer}`
                  : `Scrambled word: ${view.question?.scrambled}`
              }
            >
              {[
                ...(revealed ? (view.question?.answer ?? '') : (view.question?.scrambled ?? '')),
              ].map((char, i) =>
                char === ' ' ? (
                  <span key={i} className="tile-space" />
                ) : (
                  <span
                    key={`${view.question?.id}-${i}`}
                    className="letter-tile"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    {char.toUpperCase()}
                  </span>
                ),
              )}
            </div>
            <p
              className={`stage-message ${view.awardedTo ? 'correct-message' : ''}`}
              aria-live="polite"
            >
              {view.message}
            </p>
            {view.question?.reference && revealed && (
              <p className="small muted">{view.question.reference}</p>
            )}
            {view.question?.hint && (
              <p className="hint">
                Starts with <b>{view.question.hint}</b> · {view.question.length} tiles
              </p>
            )}
            {view.notice && (
              <p role="status" className="notice">
                {view.notice}
              </p>
            )}
          </>
        )}
        <div className="timer-track">
          <i
            style={{
              width: `${seconds === null || paused ? 100 : Math.max(0, Math.min(100, (seconds / (view.phase === 'COUNTDOWN' ? 3 : view.settings.seconds)) * 100))}%`,
            }}
          />
        </div>
      </section>
      <Scoreboard teams={view.teams} awardedTo={view.awardedTo} />
      {!presentation && (
        <>
          {active &&
            (typed || hasBuzz) &&
            (!remote || isPlayer || solo || view.settings.mode === 'host') && (
              <form
                className="answer-controls"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (answer.trim()) {
                    onAction({ type: 'ANSWER', teamId: actingTeam, answer });
                    setAnswer('');
                  }
                }}
              >
                {!isPlayer && !solo && (
                  <label className="answer-team">
                    <span className="sr-only">Answering team</span>
                    <select value={localTeam} onChange={(e) => setLocalTeam(e.target.value)}>
                      {view.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {hasBuzz && (
                  <button
                    type="button"
                    className="button buzz"
                    disabled={!canAct || Boolean(view.buzzTeam)}
                    onClick={() => onAction({ type: 'BUZZ', teamId: actingTeam })}
                  >
                    <Zap size={23} />
                    {view.buzzTeam === actingTeam ? 'You’re first!' : 'BUZZ IN'}
                  </button>
                )}
                {typed && (
                  <>
                    <label className="grow">
                      <span className="sr-only">Your answer</span>
                      <input
                        autoComplete="off"
                        autoCapitalize="characters"
                        maxLength={80}
                        placeholder={
                          hasBuzz && view.buzzTeam !== actingTeam
                            ? 'Buzz first, then answer'
                            : 'Your answer…'
                        }
                        value={answer}
                        disabled={!canAct || (hasBuzz && view.buzzTeam !== actingTeam)}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                    </label>
                    <button
                      className="button primary"
                      disabled={
                        !canAct || !answer.trim() || (hasBuzz && view.buzzTeam !== actingTeam)
                      }
                      type="submit"
                    >
                      Lock it in
                      <ArrowRight size={18} />
                    </button>
                  </>
                )}
              </form>
            )}
          {isPlayer && view.settings.answerMode === 'host' && active && (
            <p className="center muted">
              Say your answer aloud. The host will award your team’s points.
            </p>
          )}
          {isHost && (
            <div className="host-controls">
              {!solo && (
                <div className="scoring-controls">
                  {view.teams.map((team, i) => (
                    <div className="scoring-team" key={team.id}>
                      <button
                        className="award-button"
                        disabled={
                          !connected ||
                          (!active && !revealed) ||
                          Boolean(view.awardedTo) ||
                          view.penalized.includes(team.id) ||
                          !view.eligibleTeams.includes(team.id) ||
                          Boolean(view.buzzTeam && view.buzzTeam !== team.id)
                        }
                        onClick={() => onAction({ type: 'AWARD', teamId: team.id })}
                      >
                        <Check size={16} />
                        <span>{team.name}</span>
                        <b>+{view.settings.points}</b>
                        <kbd>{i + 1}</kbd>
                      </button>
                      <button
                        className="penalty-button"
                        aria-label={`Wrong answer for ${team.name}`}
                        disabled={
                          !connected ||
                          (!active && !revealed) ||
                          Boolean(view.awardedTo) ||
                          view.penalized.includes(team.id)
                        }
                        onClick={() => onAction({ type: 'PENALTY', teamId: team.id })}
                      >
                        <X size={15} />
                        {view.settings.penalty ? `−${view.settings.penalty}` : 'Miss'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="action-bar">
                <button
                  className="button secondary"
                  disabled={!connected || (!active && !paused && view.phase !== 'COUNTDOWN')}
                  onClick={() => onAction({ type: paused ? 'RESUME' : 'PAUSE' })}
                >
                  {paused ? <Play size={17} /> : <Pause size={17} />} {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  className="button secondary"
                  disabled={!connected || !active}
                  onClick={() => onAction({ type: 'REVEAL' })}
                >
                  <Eye size={17} /> Reveal
                </button>
                <button
                  className="button secondary"
                  disabled={!connected || (!active && !paused)}
                  onClick={() => onAction({ type: 'SKIP' })}
                >
                  <SkipForward size={17} /> Skip
                </button>
                <button
                  className="button secondary"
                  disabled={
                    !connected ||
                    !view.ledger.length ||
                    view.ledger.at(-1)?.question !== view.index ||
                    (!active && !revealed)
                  }
                  onClick={() => onAction({ type: 'UNDO' })}
                >
                  <Undo2 size={17} /> Undo score
                </button>
                {solo && (
                  <button
                    className="button secondary"
                    disabled={!active || view.hinted}
                    onClick={() => onAction({ type: 'HINT' })}
                  >
                    <Lightbulb size={17} /> Hint
                  </button>
                )}
                <button
                  className="button primary next-button"
                  disabled={!connected || !revealed}
                  onClick={() => onAction({ type: 'NEXT' })}
                >
                  {view.isTiebreak
                    ? 'Continue'
                    : view.questionInRound === view.settings.questionsPerRound
                      ? view.round === view.settings.rounds
                        ? 'See results'
                        : 'End round'
                      : 'Next word'}
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="host-footnote">
                <span>
                  HOST CONTROLS{' '}
                  <span className="shortcut-hint">· Space pause · R reveal · N next · U undo</span>
                </span>
                <div>
                  <button className="text-button" onClick={() => setConfirmation('END_ROUND')}>
                    End round
                  </button>
                  <button className="text-button" onClick={() => setConfirmation('END_GAME')}>
                    <Flag size={13} /> End game
                  </button>
                </div>
              </div>
            </div>
          )}
          {children}
          {confirmation && (
            <dialog
              ref={confirmRef}
              className="confirm-modal"
              aria-labelledby="confirm-title"
              onCancel={() => setConfirmation(null)}
            >
              <h2 id="confirm-title">
                {confirmation === 'END_GAME' ? 'Finish this game?' : 'Finish this round?'}
              </h2>
              <p>
                Current scores will be kept. Unplayed words in this{' '}
                {confirmation === 'END_GAME' ? 'game' : 'round'} will be skipped.
              </p>
              <div className="result-actions">
                <button
                  autoFocus
                  className="button secondary"
                  onClick={() => setConfirmation(null)}
                >
                  Keep playing
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    onAction({ type: confirmation });
                    setConfirmation(null);
                  }}
                >
                  Finish {confirmation === 'END_GAME' ? 'game' : 'round'}
                </button>
              </div>
            </dialog>
          )}
        </>
      )}
    </main>
  );
}
