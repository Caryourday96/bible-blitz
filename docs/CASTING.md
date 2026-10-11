# TV casting

## Playing

1. Open https://adeticket.com/bibleblitz in Chrome on a computer or Android.
2. Choose Host + big screen, configure teams and create the game.
3. Select Cast to TV and choose a Google Cast device on the same Wi-Fi.
4. Wait for the TV confirmation and check the board on the TV, then start play from the host.

Online hosts have the same controls. Keep the host tab open. Sounds play on the host device. Reconnect game resends the current room; Change TV opens the device picker; Stop casting leaves the game running. Unsupported browsers and SDK failures show a reason and alternative display instructions.

iPhone and iPad use Control Center → Screen Mirroring with an Apple TV or AirPlay-compatible TV. This mirrors the whole screen. Use the app's big-screen link on a separate mirrored device to keep host controls private. The app cannot open a native AirPlay picker for an interactive HTML board. Local Party/Solo games use screen/tab mirroring or HDMI.

## Existing infrastructure

The sender uses the existing public receiver app ID `0AF8BA4D`, already configured for Friends Showdown at `https://ff.adeticket.com/cast`. No new Google Cast registration, paid resource or Cloudflare change is required. The receiver continues to support its original Friends Showdown namespace.

Bible Blitz uses `urn:x-cast:com.adeticket.bibleblitz`. Its validated `SHOW_ROOM` message contains only a public room code and request UUID. The receiver constructs a fixed `https://adeticket.com/bibleblitz/tv` iframe URL; sender-provided URLs and host tokens are never used. The iframe joins as a display through the existing independent Socket.IO endpoint. It has no administrative controls or credentials.

The TV reports ready/reconnecting/error with the matching room and request UUID. The receiver verifies the iframe's source window, exact origin and message schema before relaying to the initiating Cast sender. The host only reports connection after a matching ready message, and offers retry on failure or timeout. Only `/bibleblitz/tv` and its exported `.html` document permit embedding by `https://ff.adeticket.com`; other app routes retain frame protection.

## Validation and remaining device check

Unit tests cover parsing, fixed URLs, acknowledgement correlation, timeout, send failures, SDK retries and iOS fallback. Browser tests mock the Cast SDK for controls; a separate real Socket.IO display test covers joining, scoring, results and replay. Receiver tests exercise the cross-origin message bridge and preserve the legacy receiver path.

The live release passed all 18 desktop/mobile scenarios. Run `E2E_BASE_URL=https://adeticket.com/bibleblitz/ node scripts/cast-production-check.mjs` for the additional deployed host/receiver/iframe/socket check, including headers, acknowledgements, scoring, replay and offline recovery. This uses actual public pages and sockets with simulated Google Cast transport; it also saves a 1920px TV screenshot.

Physical Google Cast discovery/launch, receiver registration availability on an actual TV, and AirPlay picture/audio remain a device acceptance check. Connect a compatible TV and host to the same Wi-Fi; check initial connection, reveal/score, replay, Wi-Fi recovery and stop casting. Automated SDK fixtures do not prove these hardware steps.

References: [Google web sender support](https://developers.google.com/cast/docs/web_sender), [custom receiver](https://developers.google.com/cast/docs/web_receiver/core_features), [Apple Screen Mirroring](https://support.apple.com/en-us/102661).
