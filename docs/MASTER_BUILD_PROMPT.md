# BIBLE BLITZ — MASTER BUILD PROMPT
## Build, Test, Improve, and Push a Production-Ready Bible Scramble Web App

You are an autonomous senior software engineering team responsible for designing, building, testing, documenting, and delivering a production-ready multiplayer Bible word scramble web application.

Operate with the combined expertise of:

- Principal Software Architect
- Senior Full-Stack Engineer
- Real-Time Multiplayer Engineer
- Senior UI/UX Designer
- Game Designer
- QA Automation Engineer
- Security Engineer
- DevOps Engineer
- Technical Product Manager

Your goal is to build a polished, genuinely playable application — not a mockup, prototype, wireframe, or architecture-only exercise.

---

# 1. PROJECT

## Project Name

**Bible Blitz**

## GitHub Repository

https://github.com/Caryourday96/bible-blitz

## Reference Game

https://www.instagram.com/reel/DdkQTFhxOvB/

The reference shows a competitive Bible word scramble game where players or teams race to identify scrambled biblical names.

The final application should preserve that fast, competitive feel while expanding it into a complete digital party game.

---

# 2. PRIMARY DELIVERY REQUIREMENT

All application code must be committed and pushed to:

https://github.com/Caryourday96/bible-blitz

This is a mandatory delivery requirement.

Do not simply:

- Generate source code locally
- Show Git commands
- Provide files without pushing them
- Stop after writing documentation
- Stop after creating a plan
- Ask me to push the code myself

Use the available GitHub authentication or Git credentials to actually commit and push completed work.

Before reporting a milestone as delivered, verify that its commit exists on the remote repository.

If authentication or repository permissions prevent pushing:

1. Preserve all completed work.
2. Commit it locally.
3. Clearly identify the exact authentication or permission blocker.
4. Request only the minimum intervention necessary.
5. Do not claim the code was pushed if it was not.

---

# 3. CORE PRODUCT VISION

Build a fast, exciting Bible word scramble game suitable for:

- Church events
- Youth groups
- Bible study groups
- Family games nights
- Parties
- Friends
- Online competitions
- Large-screen or projector events

The experience should feel like a modern game show.

It should be:

- Easy to understand
- Easy to start
- Fast to play
- Competitive
- Visually polished
- Mobile-first
- Fun to replay
- Suitable for large groups

Prioritize gameplay quality and simplicity over unnecessary complexity.

---

# 4. CORE GAMEPLAY

Players are shown a scrambled Bible-related word.

They must identify the correct answer before the timer expires.

Examples:

- `STHERE` → `ESTHER`
- `SSOEM` → `MOSES`
- `HMITOTY` → `TIMOTHY`
- `NHAJO` → `JONAH`
- `THMRAA` → `MARTHA`
- `RAABHAM` → `ABRAHAM`

The main gameplay loop should be:

1. Create game.
2. Configure teams.
3. Configure game settings.
4. Start countdown.
5. Display scrambled word.
6. Players attempt to solve it.
7. Validate answer.
8. Award points.
9. Update scoreboard.
10. Move to next question.
11. Complete round.
12. Continue until end condition.
13. Announce winner.
14. Allow immediate replay.

The game must feel fast and smooth.

Avoid unnecessary screens or interruptions during active gameplay.

---

# 5. DEVELOPMENT EXECUTION RULES

You are authorized to:

- Inspect the repository.
- Install appropriate dependencies.
- Create files.
- Modify files.
- Refactor code.
- Write tests.
- Run tests.
- Fix bugs.
- Add documentation.
- Create branches.
- Commit code.
- Push code.
- Open pull requests where appropriate.
- Improve the user experience.
- Make sensible implementation decisions.

Do not repeatedly ask for confirmation on routine engineering decisions.

Make reasonable choices and document important trade-offs.

However:

- Never commit secrets.
- Never expose credentials.
- Never force-push.
- Never overwrite unrelated work.
- Never bypass branch protections.
- Never claim something works without validating it.
- Never fabricate test results.
- Never claim a Git push succeeded unless it actually succeeded.
- Never deploy paid infrastructure without approval.
- Never delete meaningful existing code unless necessary and justified.

---

# 6. FIRST TASK — REPOSITORY INVESTIGATION

Before building anything:

1. Access:

   https://github.com/Caryourday96/bible-blitz

2. Verify GitHub authentication and write access.
3. Inspect the current branches.
4. Inspect the repository contents.
5. Fetch the latest remote state.
6. Verify the configured `origin`.
7. Determine whether the repository is empty or already contains code.
8. Preserve existing work.
9. Inspect:
   - package files
   - framework
   - dependencies
   - scripts
   - configuration
   - testing setup
   - deployment setup
10. Identify reusable components.
11. Identify architectural risks.
12. Determine the simplest reliable architecture.

Do not assume the repository is empty.

If the repository is empty, initialize the project there.

Do not create an unrelated repository.

---

# 7. PREFERRED TECHNICAL STACK

Use the existing stack if it is suitable.

If starting from an empty repository, prefer:

- Next.js
- TypeScript
- Tailwind CSS
- Accessible reusable UI components
- Motion for animations
- Vitest for unit tests
- Playwright for end-to-end tests

For online multiplayer, use an appropriate real-time solution such as:

- WebSockets
- Socket.IO
- Supabase Realtime
- another suitable managed real-time service

Use PostgreSQL only where persistence is genuinely necessary.

Do not introduce a database simply because one is available.

Party Mode should work without requiring a backend database.

---

# 8. GAME MODES

Build the product incrementally.

## MODE 1 — PARTY MODE

This is the MVP and highest priority.

One device should be capable of running an entire game.

Players answer verbally while the host controls scoring.

Required features:

- Create game
- Add teams
- Rename teams
- Choose team colors
- Select categories
- Select difficulty
- Configure timer
- Configure number of rounds
- Configure questions per round
- Start game
- Pause game
- Resume game
- Reveal answer
- Award points
- Deduct points
- Undo scoring
- Skip question
- Move to next question
- Complete round
- Display leaderboard
- End game
- Announce winner
- Replay

Party Mode must work without:

- user accounts
- online multiplayer
- external real-time infrastructure
- database dependency

Build this mode fully before prioritizing advanced features.

---

## MODE 2 — HOST + BIG SCREEN MODE

Allow the host to control the game from one device while a separate display shows the game.

Example:

- Host uses a phone.
- Game is displayed on a TV or projector.

### Host interface

Include:

- Reveal answer
- Award points
- Deduct points
- Undo last score
- Skip
- Pause timer
- Resume timer
- Next question
- End round
- End game

### Presentation interface

Display only:

- Scrambled word
- Timer
- Team names
- Scores
- Round number
- Question number
- Answer reveal
- Correct answer animation
- Winner screen

Administrative controls must not appear on the presentation screen.

The host and display views must remain synchronized.

---

## MODE 3 — ONLINE MULTIPLAYER

Players should be able to join using their own devices.

Required functionality:

- Create private room
- Generate room code
- Share game link
- QR code joining
- Enter player name
- Join team
- Switch team before game start
- Host controls game
- Synchronize questions
- Synchronize timers
- Synchronize scores
- First-to-buzz
- Typed answers
- Host-approved verbal answers
- Reconnection
- Disconnection recovery
- Live leaderboard
- Final results

The server must be authoritative for:

- Game state
- Scores
- Timers
- Buzz ordering
- Round progression

Do not trust client-provided scores or timestamps.

Handle simultaneous buzzes deterministically.

---

## MODE 4 — SOLO CHALLENGE

Allow a single player to compete against the clock.

Include:

- Difficulty selector
- Category selector
- Timer
- Score
- Streak bonuses
- Optional hints
- Personal best
- Replay
- High-score tracking where practical

---

# 9. QUESTION DATABASE

Create a validated question bank with at least **200 Bible-related entries**.

Categories should include:

1. Bible Characters
2. Old Testament
3. New Testament
4. Prophets
5. Kings and Queens
6. Apostles and Disciples
7. Women of the Bible
8. Books of the Bible
9. Biblical Places
10. Difficult Bible Names

Difficulty levels:

- Easy
- Medium
- Hard
- Expert

Each question should include:

- Unique ID
- Correct answer
- Accepted spellings where appropriate
- Category
- Difficulty
- Optional Bible reference
- Optional short fact
- Scrambled form

Do not fabricate Bible references.

If biblical accuracy is uncertain, exclude the entry rather than invent information.

---

# 10. SCRAMBLE ENGINE

Implement a reliable scramble algorithm.

Use Fisher-Yates or an equivalent unbiased shuffle.

Requirements:

- Every answer letter must appear exactly once.
- No letters may be removed.
- No letters may be duplicated.
- The scrambled result should not equal the original answer.
- Multi-word answers should be handled consistently.
- Scrambles should be reasonably challenging.
- Questions should not repeat during the same game.
- Answer checking should be case-insensitive.
- Whitespace and punctuation normalization should be deterministic.

Add automated validation tests for the question bank and scramble engine.

---

# 11. GAME SETTINGS

Allow hosts to configure:

- Number of teams
- Team names
- Team colors
- Number of rounds
- Questions per round
- Difficulty
- Categories
- Timer duration
- Points per correct answer
- Wrong-answer penalty
- Steal opportunities
- Tiebreaker mode
- Sound effects
- Music
- Answering method

Suggested timer values:

- 5 seconds
- 10 seconds
- 15 seconds
- 20 seconds
- 30 seconds
- Unlimited

---

# 12. ANSWERING MODES

Support:

### Host Validation

Players answer verbally and the host determines whether the answer is correct.

### Typed Answer

Players type the answer.

### Buzz + Verbal

Players buzz first and answer verbally.

### Buzz + Typed

Players buzz and then enter an answer.

Make answer mode configurable.

---

# 13. GAME STATE MACHINE

Use a predictable state model.

Suggested states:

`LOBBY`

→ `READY`

→ `COUNTDOWN`

→ `QUESTION_ACTIVE`

→ `ANSWER_LOCKED`

→ `ANSWER_REVEAL`

→ `ROUND_RESULTS`

→ `GAME_RESULTS`

Also support where appropriate:

- `PAUSED`
- `CANCELLED`

Prevent invalid transitions.

Do not allow:

- double scoring
- duplicate question completion
- duplicate buzz wins
- multiple simultaneous round transitions
- inconsistent score updates

---

# 14. USER INTERFACE

The game should look like a polished modern party game.

Avoid generic SaaS dashboard design.

Use:

- Bold typography
- Large scrambled letters
- Large touch targets
- Dynamic score animations
- Countdown animation
- Correct-answer celebrations
- Incorrect-answer feedback
- Confetti
- Smooth transitions
- Strong visual hierarchy
- Good contrast
- Responsive layouts
- Projector-friendly visuals

The application should feel energetic and fun.

---

# 15. REQUIRED SCREENS

Build:

1. Home
2. How to Play
3. Game Mode Selection
4. Create Game
5. Join Game
6. Team Setup
7. Game Settings
8. Lobby
9. Countdown
10. Main Gameplay
11. Answer Reveal
12. Round Results
13. Leaderboard
14. Winner Screen
15. Final Results
16. Play Again
17. Host Controls
18. Presentation Mode

---

# 16. SOUND AND ANIMATION

Add tasteful optional audio.

Examples:

- Countdown sound
- Correct answer
- Wrong answer
- Score gained
- Round complete
- Winner fanfare

Include:

- Mute control
- Volume control where practical
- Reduced-motion preference support

Do not make sound mandatory for gameplay.

---

# 17. MULTIPLAYER ARCHITECTURE

For online multiplayer, implement:

- Unique room IDs
- Human-friendly room codes
- Room expiration
- Host ownership
- Player sessions
- Team membership
- Server-authoritative state
- Server-authoritative timer
- Server-authoritative scoring
- Buzz ordering
- Duplicate submission prevention
- Reconnection
- Room cleanup
- Rate limiting
- Action validation

Multiple games must be able to run simultaneously without shared state collisions.

---

# 18. SECURITY

Implement appropriate protections:

- Input validation
- Output sanitization
- Host authorization
- Rate limiting
- Secure room operations
- Server validation
- Safe player-name rendering
- Environment variable protection
- Secure secret handling
- Dependency checks

Never place private secrets in client-side source code.

Never commit:

- `.env`
- access tokens
- API keys
- database passwords
- GitHub credentials
- service secrets

---

# 19. ACCESSIBILITY

Ensure:

- Keyboard accessibility
- Semantic controls
- Accessible labels
- High contrast
- Mobile usability
- Reduced-motion support
- Screen-reader-friendly important controls
- Large tap targets

Ensure essential gameplay does not depend solely on color.

---

# 20. TESTING

Create meaningful automated tests.

## Unit tests

Test:

- Scramble generation
- Question validation
- Answer normalization
- Score calculations
- Penalties
- Timers
- Round transitions
- Win conditions
- Tiebreakers
- Game-state transitions

## Integration tests

Test:

- Create game
- Configure teams
- Start game
- Score answers
- Complete round
- Complete full Party Mode session
- Restart game
- Host controls
- Multiplayer room creation
- Player joining
- Buzz ordering
- Reconnection

## End-to-end tests

Validate that a real user can:

1. Open the application.
2. Create a Party Mode game.
3. Add teams.
4. Configure settings.
5. Start the game.
6. Play multiple questions.
7. Score teams.
8. Complete the game.
9. See the winner.
10. Start another game.

Run appropriate:

- build
- lint
- type-check
- unit tests
- integration tests
- end-to-end tests

before declaring a major milestone complete.

---

# 21. DEVELOPMENT DOCUMENTATION

Create and maintain:

`README.md`

`docs/PRODUCT_REQUIREMENTS.md`

`docs/ARCHITECTURE.md`

`docs/IMPLEMENTATION_BACKLOG.md`

`docs/DECISIONS.md`

`docs/TEST_PLAN.md`

`docs/PROGRESS.md`

`docs/SESSION_HANDOFF.md`

---

# 22. IMPLEMENTATION BACKLOG

The backlog should contain:

- Epic
- Feature
- User story
- Acceptance criteria
- Priority
- Dependencies
- Status
- Implementation notes
- Validation requirements

Use statuses:

- Not Started
- In Progress
- Blocked
- Completed
- Verified

Only use `Verified` after functionality has actually been validated.

---

# 23. DEVELOPMENT PHASES

## Phase 1 — Discovery

- Inspect repository
- Confirm authentication
- Review current code
- Select architecture
- Create documentation
- Create backlog

Commit and push this checkpoint.

---

## Phase 2 — Party Mode MVP

Build the complete Party Mode.

Include:

- Landing page
- Game setup
- Teams
- Settings
- Question bank
- Scramble engine
- Timer
- Scoring
- Gameplay
- Answer reveal
- Round handling
- Winner screen
- Replay

Test the full loop.

Commit and push the working MVP.

---

## Phase 3 — Party Mode Polish

Add:

- Animations
- Sounds
- Better game setup
- Keyboard shortcuts
- Undo scoring
- Improved winner presentation
- Responsive improvements

Commit and push.

---

## Phase 4 — Host + Big Screen

Build synchronized host and display modes.

Test on:

- phone
- tablet
- laptop
- large desktop
- projector-style layout

Commit and push.

---

## Phase 5 — Online Multiplayer

Build:

- Rooms
- Join codes
- QR joining
- Teams
- Realtime synchronization
- Buzzing
- Typed answers
- Host authority
- Reconnection

Test multiplayer reliability.

Commit and push.

---

## Phase 6 — Solo Mode

Build:

- Solo mode
- Streaks
- Personal best
- Timed challenge
- High scores

Commit and push.

---

## Phase 7 — Production Hardening

Perform:

- Security review
- Performance review
- Accessibility review
- Mobile testing
- Browser testing
- Multiplayer reliability testing
- Error handling review
- Documentation review

Commit and push the final validated state.

---

# 24. GIT WORKFLOW

Target repository:

https://github.com/Caryourday96/bible-blitz

Use sensible Git practices.

Suggested branches:

- `feature/party-mode`
- `feature/question-engine`
- `feature/host-mode`
- `feature/multiplayer`
- `feature/solo-mode`
- `fix/timer`
- `fix/scoring`

Use meaningful commits such as:

- `feat: initialize Bible Blitz`
- `feat: add Bible question engine`
- `feat: implement party mode`
- `feat: add scoring and timer`
- `feat: add host presentation mode`
- `feat: implement multiplayer rooms`
- `test: add gameplay coverage`
- `fix: correct round progression`

Do not create one enormous commit unless unavoidable.

---

# 25. MANDATORY PUSH WORKFLOW

After each meaningful milestone:

1. Run relevant tests.
2. Fix critical failures.
3. Review `git diff`.
4. Confirm no secrets are included.
5. Update backlog.
6. Update progress documentation.
7. Update session handoff.
8. Stage intended changes.
9. Commit.
10. Push the branch.
11. Confirm the push succeeded.
12. Record the remote commit SHA.

Do not consider the milestone delivered until the push succeeds.

---

# 26. SESSION HANDOFF AND CONTEXT LIMITS

This project may continue across multiple sessions.

The repository must remain the source of truth.

Update:

`docs/SESSION_HANDOFF.md`

with:

- Current branch
- Latest pushed commit SHA
- Completed features
- In-progress work
- Known defects
- Tests run
- Test results
- Important architecture decisions
- Next recommended task

If approaching context or usage limits:

1. Stop at a safe development checkpoint.
2. Finish the current atomic change if practical.
3. Run available validation.
4. Update documentation.
5. Commit safe work.
6. Push the checkpoint.
7. Record exact continuation instructions.

Do not rely on conversation history alone.

---

# 27. PRODUCT REVIEW

After the MVP is working, evaluate:

- Is the game fun?
- Is gameplay fast enough?
- Is setup easy enough?
- Are instructions obvious?
- Is scoring intuitive?
- Is difficulty balanced?
- Are the visuals exciting?
- Is mobile gameplay excellent?
- Is projector mode readable?
- Is the host interface efficient?
- Is multiplayer reliable?
- What improves replayability?

Add meaningful improvements to the backlog.

Do not allow speculative features to delay a solid core game.

---

# 28. DEFINITION OF DONE

The application is considered successfully delivered when:

- The application runs.
- Party Mode works end-to-end.
- Teams can be configured.
- Questions scramble correctly.
- Timers work.
- Scoring works.
- Rounds progress correctly.
- Winners are determined correctly.
- Players can replay.
- Host mode works.
- Presentation mode works.
- Online multiplayer works.
- Solo mode works.
- Mobile layouts work.
- Desktop layouts work.
- Automated tests pass at an appropriate level.
- Documentation is current.
- No secrets are committed.
- All completed code is pushed to:

  https://github.com/Caryourday96/bible-blitz

---

# 29. FINAL DELIVERY CHECK

Before reporting the project as complete:

1. Run the production build.
2. Run lint.
3. Run type checking.
4. Run automated tests.
5. Review outstanding defects.
6. Review Git status.
7. Ensure no secrets are included.
8. Commit final validated changes.
9. Push final changes.
10. Verify the remote repository.
11. Record the final commit SHA.

Final report should include:

- Repository URL
- Branch
- Latest pushed commit SHA
- Push status
- Implemented features
- Test results
- Known issues
- Deployment requirements
- Recommended future improvements

---

# 30. START NOW

Begin execution immediately.

Your first actions should be:

1. Access:
   https://github.com/Caryourday96/bible-blitz
2. Verify GitHub authentication and write permissions.
3. Inspect the repository.
4. Fetch the latest remote state.
5. Identify the existing technology stack.
6. Create the product requirements.
7. Create the architecture.
8. Create the implementation backlog.
9. Implement the complete Party Mode MVP.
10. Test it.
11. Fix critical defects.
12. Commit it.
13. **Push the actual working code to GitHub.**
14. Verify the pushed commit.
15. Continue into the next logical phase.

Do not stop after planning.

Do not stop after documentation.

Do not stop after a mockup.

Do not stop after scaffolding.

Do not leave completed code only in the local environment.

Build the application, validate it, and push it to:

https://github.com/Caryourday96/bible-blitz

The goal is to create a polished, fast, competitive, reliable Bible game that people will genuinely enjoy playing repeatedly.