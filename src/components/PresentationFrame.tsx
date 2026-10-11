import { defaultPresentation, type GameView, type Presentation } from '@/game/types';

export function PresentationFrame({
  settings = defaultPresentation,
  finished = false,
  children,
}: {
  settings?: Presentation;
  finished?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`tv-studio theme-${settings.theme} background-${settings.background} type-${settings.textSize}`}
    >
      {settings.title && <div className="tv-event-title">{settings.title}</div>}
      {settings.announcement && (
        <div className="tv-announcement" role="status">
          {settings.announcement}
        </div>
      )}
      {children}
      {finished && settings.winnerMessage && (
        <p className="tv-winner-message">{settings.winnerMessage}</p>
      )}
    </div>
  );
}
export function DisplayFrame({ view, children }: { view: GameView; children: React.ReactNode }) {
  return (
    <PresentationFrame settings={view.presentation} finished={view.phase === 'GAME_RESULTS'}>
      {children}
    </PresentationFrame>
  );
}
