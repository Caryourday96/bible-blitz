# Host Control Center and TV Presentation Studio

Create a Party, Host + big screen or Online game, then open the tools above the board. Online players and displays never receive these controls. Solo keeps its original flow.

## Host Control Center

- Run of show shows planned answers by round. Keep the host screen private and use the separate display on the TV.
- Move upcoming words earlier/later, including across round boundaries. Move whole unstarted rounds as a block. Played/current words and started rounds cannot be reordered.
- Replace a word with an unused alternative matching the game's chosen categories and difficulty. Replacements exchange positions with reserve words, preserving a unique deck. Pause before replacing the current word; replacement is blocked after any score or penalty on that word and during tiebreaks.
- Live controls start, pause/resume, reveal, award points and advance the game while the planning panel is open. Existing detailed scoring, undo and finish controls remain on the board.
- Teams lets the host rename teams and change their colors while preserving scores, identities and player assignments. Names must remain unique. This release does not add/remove teams after setup.

## TV Presentation Studio

Edit a draft with the live sample preview, then Apply to TV. Nothing changes on other displays until applied. Reset draft restores the default design in the preview; apply it to reset the actual screens.

- Four themes: forest, midnight, plum and sunrise.
- Three background treatments: solid, spotlight and grid.
- Standard, large and extra-large display text.
- Event title, announcement, winner-screen message and celebration confetti toggle.
- Team colors follow the Control Center.

Settings are synchronized to Google Cast's display route, remote big screens and local presentation windows. They remain in place on replay. Design settings belong to the active game; they are not saved as reusable event presets. Sounds still play on the host device.

## Data and authorization

The server sends a compact question plan only to authenticated host sockets and host acknowledgements. Player/display snapshots and local presentation broadcasts contain only the normal public view plus presentation settings. New mutations use existing game IDs, command IDs and revision checks. Player/display commands cannot edit plans, teams or presentation settings. Text is bounded plain text; theme/background/type size are enums and colors are six-digit hex values. No arbitrary CSS, HTML or external image URLs are accepted.

Deploy the compatible backend before the frontend so host-only snapshot fields and new action types are available. Existing Azure hosting and the same Cast receiver are retained. Game recovery is outside this update.
