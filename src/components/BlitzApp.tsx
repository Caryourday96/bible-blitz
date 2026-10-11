'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Globe2,
  HelpCircle,
  Maximize,
  Monitor,
  Play,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { createGame, gameView, hostPlan, transition } from '@/game/engine';
import { questions } from '@/game/questions';
import type { Action, Game, Mode, Settings, Team } from '@/game/types';
import { Setup } from './Setup';
import { GameScreen } from './GameScreen';
import { startMusic, tone, unlockAudio } from './audio';
import { useRoom } from './useRoom';
import { appPath } from './paths';
import { CastControls } from './CastControls';
import { HostTools } from './HostTools';

const modes = [
  {
    id: 'party' as Mode,
    icon: Users,
    kicker: 'ONE SCREEN. EVERYONE IN.',
    title: 'Party mode',
    description: 'Gather around, call it out, and let the host keep score.',
    tag: 'The game-night classic',
  },
  {
    id: 'host' as Mode,
    icon: Monitor,
    kicker: 'MAKE IT A MAIN EVENT.',
    title: 'Host + big screen',
    description: 'You run the show. The TV brings the big-word energy.',
    tag: 'Made for a crowd',
  },
  {
    id: 'online' as Mode,
    icon: Globe2,
    kicker: 'SAME GAME. ANYWHERE.',
    title: 'Play online',
    description: 'Share a code. Buzz in from your own device. Race your friends.',
    tag: 'A little friendly rivalry',
  },
  {
    id: 'solo' as Mode,
    icon: Zap,
    kicker: 'JUST YOU VS. THE CLOCK.',
    title: 'Solo challenge',
    description: 'Find your flow, build a streak, and beat your personal best.',
    tag: 'One more round?',
  },
];
type Screen = 'home' | 'setup' | 'how' | 'join' | 'game';
function safeBest() {
  try {
    return Number(localStorage.getItem('bb-personal-best') || 0) || 0;
  } catch {
    return 0;
  }
}
export function BlitzApp() {
  const [screen, setScreen] = useState<Screen>('home'),
    [mode, setMode] = useState<Mode>('party'),
    [game, setGame] = useState<Game | null>(null),
    [localDisplay, setLocalDisplay] = useState(false),
    [displayView, setDisplayView] = useState<ReturnType<typeof gameView> | null>(null),
    [muted, setMuted] = useState(false),
    [error, setError] = useState(''),
    [best, setBest] = useState(0),
    [demoRevealed, setDemoRevealed] = useState(false);
  const [joinCode, setJoinCode] = useState(''),
    [playerName, setPlayerName] = useState(''),
    [joinDisplay, setJoinDisplay] = useState(false),
    [qr, setQr] = useState(''),
    [copied, setCopied] = useState(false),
    [origin, setOrigin] = useState('');
  const [localChannel, setLocalChannel] = useState('');
  const room = useRoom();
  const init = useRef(false),
    previousEvent = useRef(''),
    channel = useRef<BroadcastChannel | null>(null);
  const connectedView = room.snapshot?.game;
  const view = localDisplay ? displayView : connectedView || (game ? gameView(game) : null);
  const presentation = localDisplay || room.credential?.role === 'display';
  const { snapshot: roomSnapshot, action: roomAction } = room;
  const onAction = useCallback(
    (action: Action) => {
      unlockAudio();
      if (roomSnapshot) roomAction(action);
      else setGame((current) => (current ? transition(current, action, Date.now()) : null));
    },
    [roomSnapshot, roomAction],
  );
  useEffect(() => {
    if (init.current) return;
    init.current = true;
    queueMicrotask(() => {
      setOrigin(window.location.origin);
      setBest(safeBest());
      const params = new URLSearchParams(window.location.search),
        code = params.get('room')?.toUpperCase(),
        display = params.get('display') === '1';
      if (params.get('localDisplay')) {
        setLocalChannel(params.get('localDisplay')!);
        setLocalDisplay(true);
        setScreen('game');
        return;
      }
      if (code) {
        setJoinCode(code);
        setJoinDisplay(display);
        setScreen('join');
        void room.resume(code).then((ok) => {
          if (ok) setScreen('game');
        });
      }
    });
  }, [room]);
  useEffect(() => {
    if (!game || room.snapshot || localDisplay) return;
    const timer = setInterval(
      () =>
        setGame((current) => (current ? transition(current, { type: 'TICK' }, Date.now()) : null)),
      100,
    );
    return () => clearInterval(timer);
  }, [game?.id, Boolean(room.snapshot), localDisplay]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined' || !localChannel) return;
    const c = new BroadcastChannel(`bible-blitz-display-${localChannel}`);
    channel.current = c;
    c.onmessage = (event) => {
      if (localDisplay && event.data?.view) setDisplayView(event.data.view);
    };
    if (localDisplay) c.postMessage({ request: true });
    return () => {
      c.close();
      channel.current = null;
    };
  }, [localDisplay, localChannel]);
  useEffect(() => {
    if (!game || localDisplay) return;
    const v = gameView(game);
    channel.current?.postMessage({ view: v });
    const c = channel.current;
    if (c)
      c.onmessage = (e) => {
        if (e.data?.request) c.postMessage({ view: v });
      };
  }, [game, localDisplay]);
  useEffect(() => {
    if (!view) return;
    const key = `${view.id}:${view.phase}:${view.ledger.length}:${view.index}`;
    if (previousEvent.current === key) return;
    previousEvent.current = key;
    if (!muted && view.settings.sound && !presentation) {
      if (view.phase === 'GAME_RESULTS') tone('winner', view.settings.volume);
      else if (view.phase === 'ANSWER_REVEAL')
        tone(view.awardedTo ? 'correct' : 'wrong', view.settings.volume);
      else if (view.phase === 'COUNTDOWN') tone('tick', view.settings.volume);
    }
    if (view.phase === 'GAME_RESULTS' && view.settings.mode === 'solo') {
      const score = view.teams[0].score;
      const high = Math.max(safeBest(), score);
      try {
        localStorage.setItem('bb-personal-best', String(high));
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
      queueMicrotask(() => setBest(high));
    }
  }, [view, muted, presentation]);
  useEffect(() => {
    if (
      view?.settings.music &&
      !muted &&
      !presentation &&
      ['COUNTDOWN', 'QUESTION_ACTIVE'].includes(view.phase)
    )
      return startMusic(view.settings.volume);
  }, [view?.settings.music, view?.settings.volume, view?.phase, muted, presentation]);
  const code = room.snapshot?.code;
  const joinLink = code ? `${origin}${appPath}?room=${code}` : '';
  useEffect(() => {
    if (code && room.credential)
      window.history.replaceState(
        {},
        '',
        `${appPath}?room=${code}${room.credential.role === 'display' ? '&display=1' : ''}`,
      );
  }, [code, room.credential]);
  useEffect(() => {
    if (!joinLink) return;
    let live = true;
    void QRCode.toDataURL(joinLink, {
      margin: 2,
      width: 180,
      color: { dark: '#18201b', light: '#fff9eb' },
    }).then((value) => {
      if (live) setQr(value);
    });
    return () => {
      live = false;
    };
  }, [joinLink]);
  const choose = (selected: Mode) => {
    unlockAudio();
    setMode(selected);
    setScreen('setup');
    setError('');
  };
  const home = () => {
    room.leave();
    setGame(null);
    setScreen('home');
    setLocalDisplay(false);
    setError('');
    window.history.replaceState({}, '', appPath);
  };
  const create = async (settings: Settings, teams: Omit<Team, 'score'>[]) => {
    unlockAudio();
    setError('');
    try {
      if (settings.mode === 'online' || settings.mode === 'host') {
        if (await room.create(settings, teams)) setScreen('game');
      } else {
        setLocalChannel(crypto.randomUUID());
        setGame(createGame(settings, teams, questions));
        setScreen('game');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the game.');
    }
  };
  const replay = () => {
    if (room.snapshot) {
      room.replay();
      return;
    }
    if (game) {
      setGame({
        ...createGame(game.settings, game.teams, questions),
        presentation: game.presentation,
      });
      setScreen('game');
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      room.setError('Copy the room link below to invite your friends.');
    }
  };
  const remotePanel = room.snapshot && (
    <section
      className={`room-panel ${presentation ? 'display-room-panel' : ''}`}
      aria-label="Room details"
    >
      <div className="room-code">
        <span className="eyebrow">
          {room.snapshot.game.settings.mode === 'host' ? 'BIG SCREEN CODE' : 'ROOM CODE'}
        </span>
        <strong>{code}</strong>
        <span className="small muted">Room lasts up to 6 hours</span>
      </div>
      {!presentation && (
        <>
          <div className="room-details">
            <p className="small muted">
              {room.credential?.role === 'host'
                ? 'Your room. Your people. Share the link to get everyone in.'
                : `You’re in, ${room.credential?.name}.`}
            </p>
            {room.credential?.role === 'host' && (
              <>
                <div className="share-actions">
                  <button className="button secondary" onClick={copy}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
                    {copied ? 'Copied' : 'Copy invite'}
                  </button>
                  <a
                    className="button secondary"
                    href={`${joinLink}&display=1`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Monitor size={17} /> Open big screen
                  </a>
                </div>
                <input readOnly aria-label="Room invite link" value={joinLink} />
              </>
            )}
            {room.credential?.role === 'player' && view?.phase === 'LOBBY' && (
              <div className="field">
                <label htmlFor="switch-team">Your team</label>
                <select
                  id="switch-team"
                  value={room.credential.teamId}
                  onChange={(e) => room.switchTeam(e.target.value)}
                >
                  {view.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {room.snapshot.members.length > 0 && (
              <div className="members" aria-label="Players">
                {room.snapshot.members.map((m) => (
                  <span key={m.id} className={m.connected ? '' : 'disconnected'}>
                    {m.name}
                    <small>
                      {view?.teams.find((t) => t.id === m.teamId)?.name} ·{' '}
                      {m.connected ? 'here' : 'reconnecting'}
                    </small>
                  </span>
                ))}
              </div>
            )}
          </div>
          {qr && room.credential?.role === 'host' && (
            <Image
              unoptimized
              className="qr"
              src={qr}
              width={120}
              height={120}
              alt="QR code for joining this game"
            />
          )}
        </>
      )}
    </section>
  );
  return (
    <div
      className={`app-shell ${presentation ? 'is-presentation' : ''}`}
      onPointerDown={unlockAudio}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand"
          aria-label="Bible Blitz home"
          onClick={() => {
            if (!view || ['LOBBY', 'GAME_RESULTS', 'CANCELLED'].includes(view.phase)) home();
          }}
        >
          <span className="brand-mark">
            <Zap size={24} fill="currentColor" />
          </span>
          <span>
            BIBLE<span>BLITZ</span>
          </span>
          <span className="brand-star">✳</span>
        </button>
        {!presentation && (
          <nav aria-label="Main navigation">
            {screen === 'home' ? (
              <>
                <button className="nav-how" onClick={() => setScreen('how')}>
                  How to play
                </button>
                <button
                  className="button secondary join-nav"
                  onClick={() => {
                    setJoinDisplay(false);
                    setScreen('join');
                  }}
                >
                  Join a game
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="icon-button"
                  aria-label={muted ? 'Unmute sound' : 'Mute sound'}
                  onClick={() => setMuted((v) => !v)}
                >
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                {!view && (
                  <button className="text-button" onClick={home}>
                    Back home
                  </button>
                )}
                {view?.phase === 'GAME_RESULTS' && (
                  <button className="text-button" onClick={home}>
                    Home
                  </button>
                )}
                {view && (
                  <button
                    className="icon-button"
                    aria-label="Fullscreen"
                    onClick={() => {
                      if (document.fullscreenElement) void document.exitFullscreen();
                      else
                        void document.documentElement
                          .requestFullscreen()
                          .catch(() => setError('Fullscreen isn’t available in this browser.'));
                    }}
                  >
                    <Maximize size={19} />
                  </button>
                )}
              </>
            )}
          </nav>
        )}
        {presentation && <span className="eyebrow">THE BIG SCREEN</span>}
      </header>
      <div id="main-content" tabIndex={-1}>
        {screen === 'game' &&
          view &&
          !presentation &&
          view.settings.mode !== 'solo' &&
          (room.credential?.role === 'host'
            ? room.snapshot?.hostPlan
            : game
              ? hostPlan(game)
              : null) && (
            <HostTools
              key={view.id}
              view={view}
              plan={room.snapshot?.hostPlan ?? hostPlan(game!)}
              connected={!room.snapshot || room.connected}
              onAction={onAction}
            />
          )}
        {room.credential?.role === 'host' && code && (
          <CastControls key={code} code={code} displayUrl={`${joinLink}&display=1`} />
        )}
        {(error || room.error) && (
          <div className="error-banner" role="alert">
            {error || room.error}
            <button
              aria-label="Dismiss message"
              className="icon-button"
              onClick={() => {
                setError('');
                room.setError('');
              }}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {room.snapshot && !room.connected && (
          <p className="connection-banner" role="status">
            Connection interrupted. Reconnecting… Controls will return when you’re back.
          </p>
        )}
        {room.snapshot && !room.snapshot.hostConnected && room.credential?.role !== 'host' && (
          <p className="connection-banner" role="status">
            The host disconnected. The clock is paused until they return.
          </p>
        )}
        {screen === 'home' && (
          <main className="home page-enter">
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="live-dot" /> GOOD COMPANY. GREAT COMPETITION.
                </span>
                <h1>
                  Know the Word.
                  <br />
                  Beat the <em>clock.</em>
                  <svg
                    className="underline"
                    width="350"
                    height="22"
                    viewBox="0 0 350 22"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 15Q150-2 340 11M50 20Q200 5 320 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </h1>
                <p>
                  Your favorite Bible names. All mixed up.
                  <br />
                  Gather your people for a fast, joy-filled scramble
                  <br className="desktop-break" /> where every second—and every letter—counts.
                </p>
                <div className="hero-actions">
                  <button className="button primary large" onClick={() => choose('party')}>
                    Let’s play
                    <ArrowRight size={20} />
                  </button>
                  <button className="play-how" onClick={() => setScreen('how')}>
                    <span>
                      <Play size={13} fill="currentColor" />
                    </span>{' '}
                    How it works
                  </button>
                </div>
                <div className="hero-benefits">
                  <span>
                    <Check size={15} /> No sign-up
                  </span>
                  <span>
                    <Check size={15} /> All ages welcome
                  </span>
                  <span>
                    <Check size={15} /> Big-screen ready
                  </span>
                </div>
              </div>
              <div className="hero-art">
                <div className="scribble-star star-one" aria-hidden="true">
                  ✳
                </div>
                <div className="preview-note">
                  a little scramble.
                  <br />a lot of <i>“I KNOW THIS!”</i>
                  <svg viewBox="0 0 80 70" aria-hidden="true">
                    <path d="M8 2Q5 42 64 52M48 42L67 52 52 64" />
                  </svg>
                </div>
                <div className="demo-board">
                  <div className="demo-top">
                    <span>
                      <span className="live-dot" /> BIBLE CHARACTERS
                    </span>
                    <span>
                      <Zap size={13} /> 20<span className="small">s</span>
                    </span>
                  </div>
                  <p>YOUR NEXT “AHA!” MOMENT</p>
                  <div
                    className={`demo-letters ${demoRevealed ? 'demo-solved' : ''}`}
                    aria-label={demoRevealed ? 'Esther' : 'S T H E R E'}
                  >
                    {[...(demoRevealed ? 'ESTHER' : 'STHERE')].map((letter, i) => (
                      <span key={i}>{letter}</span>
                    ))}
                  </div>
                  <button className="demo-reveal" onClick={() => setDemoRevealed((v) => !v)}>
                    {demoRevealed ? (
                      <>
                        <Check size={16} /> Esther! You’ve got the idea.
                      </>
                    ) : (
                      <>
                        Know this one? Tap to reveal
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                  <div className="demo-score">
                    <span>
                      <i /> Team Grace
                    </span>
                    <b>VS.</b>
                    <span>
                      <i /> Team Faith
                    </span>
                  </div>
                </div>
                <div className="float-badge">
                  <Trophy size={23} />
                  <div>
                    Bragging rights?
                    <br />
                    <b>Absolutely biblical.</b>
                  </div>
                </div>
                <div className="scribble-star star-two" aria-hidden="true">
                  ✧
                </div>
              </div>
            </section>
            <div className="gather-strip">
              <span>MADE FOR YOUR KIND OF GATHERING</span>
              <p>
                Family nights <i>✳</i> Youth groups <i>✳</i> Bible studies <i>✳</i> Just-because
                nights
              </p>
            </div>
            <section className="mode-section" id="modes">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">FOUR WAYS TO FIND YOUR BLITZ</span>
                  <h2>
                    However you gather,
                    <br />
                    <em>there’s a game for that.</em>
                  </h2>
                </div>
                <p>
                  One word. So many ways to play.
                  <br />
                  Choose your kind of competition. <ArrowDown size={18} />
                </p>
              </div>
              <div className="mode-grid">
                {modes.map((m, i) => (
                  <button
                    className={`mode-card mode-${m.id}`}
                    onClick={() => choose(m.id)}
                    key={m.id}
                  >
                    <div className="mode-card-top">
                      <span className="mode-icon">
                        <m.icon size={23} />
                      </span>
                      <span className="mode-number">0{i + 1}</span>
                    </div>
                    <small>{m.kicker}</small>
                    <h3>{m.title}</h3>
                    <p>{m.description}</p>
                    <div className="mode-card-footer">
                      <span>{m.tag}</span>
                      <ArrowRight size={19} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="home-bottom">
              <BookOpen size={23} />
              <p>
                <b>{questions.length} words. Endless “one more round.”</b>
                <span>
                  From familiar faces to the names that really test you. Easy to expert, all in one
                  game.
                </span>
              </p>
              <span className="eyebrow">READY WHEN YOU ARE.</span>
            </section>
          </main>
        )}
        {screen === 'how' && (
          <main className="how-page page-enter">
            <button className="text-button back" onClick={home}>
              <ArrowLeft size={16} /> Back home
            </button>
            <span className="eyebrow">SIMPLE RULES. SERIOUSLY GOOD TIMES.</span>
            <h1>
              A scramble.
              <br />A shout.<em> A celebration.</em>
            </h1>
            <div className="how-steps">
              {[
                [
                  'Gather your people',
                  'Choose a mode, name your teams, and pick your favorite categories. Set the pace with a timer and number of rounds.',
                ],
                [
                  'Find the word',
                  'Every tile belongs to the answer. Spaces and punctuation disappear; numbered books keep their numbers. Say the answer, type it, or buzz in first—your host chooses.',
                ],
                [
                  'Claim the points',
                  'The host awards verbal answers. Typed answers score automatically. A wrong guess can open a steal. The highest score wins, with optional sudden-death words for a tie.',
                ],
              ].map(([title, text], i) => (
                <section className="panel" key={title}>
                  <span className="step-number">0{i + 1}</span>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </section>
              ))}
            </div>
            <div className="how-tips">
              <HelpCircle size={22} />
              <p>
                <b>A few house rules</b>Wrong-answer penalties are optional. Undo changes the last
                score on the current word. Once an answer is shown, it stays shown. Solo hints cost
                half the base points; correct streaks earn a bonus. Online hosts control the clock,
                even if you refresh.
              </p>
            </div>
            <button className="button primary large" onClick={() => choose('party')}>
              Got it. Let’s play
              <ArrowRight size={19} />
            </button>
          </main>
        )}
        {screen === 'setup' && (
          <Setup
            key={mode}
            mode={mode}
            onCreate={(s, t) => void create(s, t)}
            onBack={() => setScreen('home')}
            busy={room.busy}
          />
        )}
        {screen === 'join' && (
          <main className="join-page page-enter">
            <button className="text-button back" onClick={home}>
              <ArrowLeft size={16} /> Back home
            </button>
            <div className="join-symbol">
              <Zap size={38} />
            </div>
            <span className="eyebrow">YOUR PEOPLE ARE WAITING</span>
            <h1>
              Get in on <em>the game.</em>
            </h1>
            <p className="muted">A six-character code. A name. You’re in.</p>
            <form
              className="panel join-form"
              onSubmit={(e) => {
                e.preventDefault();
                unlockAudio();
                void room
                  .join(joinCode, joinDisplay ? 'Big screen' : playerName, joinDisplay)
                  .then((ok) => {
                    if (ok) {
                      window.history.replaceState(
                        {},
                        '',
                        `${appPath}?room=${joinCode.toUpperCase()}${joinDisplay ? '&display=1' : ''}`,
                      );
                      setScreen('game');
                    }
                  });
              }}
            >
              <div className="field">
                <label htmlFor="room-code">Room code</label>
                <input
                  id="room-code"
                  className="code-input"
                  autoComplete="off"
                  placeholder="ABC234"
                  maxLength={6}
                  minLength={6}
                  required
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))
                  }
                />
              </div>
              {!joinDisplay && (
                <div className="field">
                  <label htmlFor="player-name">Your name</label>
                  <input
                    id="player-name"
                    placeholder="What should we call you?"
                    autoComplete="nickname"
                    maxLength={24}
                    required
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
              )}
              <label className="toggle">
                <span>
                  Join as a big screen<small>Display only, no player controls</small>
                </span>
                <input
                  type="checkbox"
                  checked={joinDisplay}
                  onChange={(e) => setJoinDisplay(e.target.checked)}
                />
              </label>
              <button className="button primary wide" disabled={room.busy}>
                {room.busy ? 'Joining…' : joinDisplay ? 'Connect display' : 'Join the game'}
                <ArrowRight size={18} />
              </button>
            </form>
          </main>
        )}
        {screen === 'game' &&
          (view ? (
            <GameScreen
              key={view.id}
              view={view}
              onAction={onAction}
              onReplay={replay}
              presentation={presentation}
              playerTeam={room.credential?.role === 'player' ? room.credential.teamId : undefined}
              remote={Boolean(room.snapshot)}
              connected={!room.snapshot || room.connected}
              serverOffset={room.snapshot ? room.offset : 0}
              best={best}
            >
              {room.snapshot ? (
                remotePanel
              ) : !presentation && view.phase === 'LOBBY' ? (
                <p className="local-display-link">
                  <a
                    href={`${appPath}?localDisplay=${localChannel}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Monitor size={15} /> Open a presentation window on this device
                  </a>
                  <span className="small muted">
                    For a different device, choose Host + big screen.
                  </span>
                </p>
              ) : null}
            </GameScreen>
          ) : (
            <main className="join-page">
              <Monitor size={50} />
              <h1>Waiting for the game…</h1>
              <p className="muted">Start a Party game in another window on this device.</p>
            </main>
          ))}
      </div>
      {!presentation && screen !== 'game' && (
        <footer className="site-footer">
          <span>
            <Zap size={14} /> A LITTLE FAITH. A LOT OF FUN.
          </span>
          <span>
            Made for good company.
            <Sparkles size={15} />
          </span>
        </footer>
      )}
    </div>
  );
}
