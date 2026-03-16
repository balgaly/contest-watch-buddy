# Eurovision Buddy — Redesign Spec

## Design Direction: Brutalist Festival + Live Broadcast

A mashup of **Brutalist Festival poster aesthetics** (hard edges, noise texture, oversized typography, thick color accents) with **Broadcast Scoreboard dynamics** (live ticker, emoji reactions, real-time update flashes).

The goal: an app that feels like you're at the actual Eurovision — not using a generic dark-mode dashboard.

---

## 1. Visual Identity

### What makes this NOT look AI-generated

- **Zero rounded corner cards.** No `border-radius` containers wrapping content. Rows are separated by hard lines or color accents on the left edge.
- **No headline + subtitle + box pattern.** Content IS the layout — oversized numbers bleed behind text, diagonal dividers break the grid, room titles span the full hero area.
- **Hard edges everywhere.** Buttons, tabs, dividers — all sharp or intentionally angular (skewed dividers).
- **Noise texture overlay.** Subtle SVG fractal noise on the background at 3% opacity. Adds analog/printed feel.
- **ALL CAPS country names** in Unbounded. Feels like a festival lineup poster.
- **Thick left-edge accent bars** on voted rows (4px, hot pink). Replaces the vague "pink dot" voted indicator.
- **Oversized ghost numbers** — the total contestant count ("26") bleeds behind the room hero area at 120px, near-invisible. Creates depth without a container.

### Color Palette

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bg` | `#0a0a0a` | `#f0ece6` | Page background |
| `--bg2` | `#12121f` | `#e8e4dd` | Secondary/header background |
| `--surface` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.03)` | Alternating row stripes |
| `--border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` | Row separators |
| `--text` | `#ffffff` | `#1a1a2e` | Primary text |
| `--text2` | `rgba(255,255,255,0.55)` | `rgba(0,0,0,0.55)` | Secondary text (artist names) |
| `--text3` | `rgba(255,255,255,0.35)` | `rgba(0,0,0,0.35)` | Tertiary text (meta, unvoted ranks) |
| `--pink` | `#ff2d87` | `#ff2d87` | Primary accent, voted indicator, active nav |
| `--violet` | `#7c3aed` | `#7c3aed` | Room codes, secondary accent |
| `--cyan` | `#06b6d4` | `#06b6d4` | High scores (8+) |
| `--gold` | `#fbbf24` | `#d4a017` | Mid scores (5-7.9), update flashes, rank #1 |
| `--gradient` | `linear-gradient(90deg, #ff2d87, #7c3aed, #06b6d4)` | same | Diagonal dividers, ticker bar |

Dark mode: `#0a0a0a` (lighter than the previous `#0f172a`, better readability).
Light mode: `#f0ece6` warm paper (festival program / ticket stub feel).

Theme follows `prefers-color-scheme` with a manual toggle persisted in localStorage.

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | Unbounded | 700-900 | Room titles, country names (ALL CAPS), brand, section labels |
| Body | Inter | 400-600 | Artist names, meta text, descriptions |
| Data | JetBrains Mono | 400-700 | Scores, ranks, room codes, ticker, timestamps |

Key contrast rules (WCAG AA):
- `--text2` at 0.55 opacity on both dark/light backgrounds meets 4.5:1 for body text
- `--text3` at 0.35 opacity meets 3:1 for large text only — use only on Unbounded labels at 10px+ weight 600+
- Scores in cyan/gold/pink always on the base background — all pass AA

---

## 2. Layout System

### No cards. No boxes. Rows and accents.

Contestants are displayed as **table-style rows** separated by 1px borders, not wrapped in card containers:

```
[4px color accent] [RANK] [FLAG] [COUNTRY + Artist] .............. [SCORE]
```

- Alternating rows get a subtle `--surface` background (odd/even striping)
- Voted rows get a 4px left-edge accent in `--pink`
- Rank column: 52px wide, JetBrains Mono, color-coded (gold/silver/bronze/dim)
- Score column: 60px wide, JetBrains Mono bold, color-coded by tier (cyan 8+, gold 5-7.9, dim unvoted)
- Country names: Unbounded 600, ALL CAPS, 13px
- Artist names: Inter 400, normal case, 11px, `--text2`, truncated with ellipsis

### Room hero (replaces card header)

When entering a room, the top area is a **full-width hero**, not a card:

```
GRAND                           26  (ghost, 120px, 0.06 opacity)
FINAL
WATCH
PARTY
EUROVISION 2025 · 8 VOTERS · 5UN33Q
[====== diagonal gradient divider ======]
```

- Room name in Unbounded 900, 32px, stacked lines
- "WATCH" (or a keyword) in `--pink`
- Ghost number (contestant count) bleeding behind at 120px
- Meta line: JetBrains Mono 11px, `--text3`, with room code
- Diagonal gradient divider: 4px tall, `transform: skewY(-1deg)`, full gradient

### Diagonal dividers

Used to separate major sections. A thin (3-4px) bar spanning full width with the gradient palette and a slight skew (`-1deg`). Replaces the "section heading with underline" AI pattern.

---

## 3. Interactive / Live Features

### Live ticker

A horizontal scrolling bar at the top of the room view:

```
[gradient background: pink → violet]
▸ NORWAY LEADS WITH 8.1 · FRANCE 6.4 · 24 COUNTRIES AWAITING VOTES ▸
```

- JetBrains Mono 11px, white text, letter-spacing 1px
- CSS `marquee` / `translateX` animation, ~30s loop
- Updates dynamically as scores change
- Positioned below the header, above the tab bar

### Emoji reaction bar

A row of 6 circular emoji buttons pinned above the bottom nav or below the ticker:

```
[ fire ] [ heart-eyes ] [ skull ] [ microphone ] [ clap ] [ grimace ]
```

- Each button: 36px circle, `--surface` background, 1px `--border`
- On tap: emoji floats upward from the tapped contestant row (or the currently performing one) with `float-up` animation (1.5s, translateY -40px, fade out)
- Other room members see the emoji appear on the same row in real-time (Firestore listener)
- Emojis stack briefly (2-3 visible at once) then fade
- Haptic feedback on tap (navigator.vibrate if available)

### Yellow flash on live updates

When another room member submits or changes a score:

- The affected contestant row gets a horizontal sweep animation:
  ```css
  @keyframes flash-sweep {
    0% { background-position: -375px 0; }
    100% { background-position: 375px 0; }
  }
  ```
- Color: `rgba(251,191,36,0.15)` (gold, semi-transparent)
- Duration: 0.8s ease-out
- Accompanied by the score number briefly pulsing (scale 1.1 → 1.0)
- If a rank changes position, the row animates to its new position (CSS `transition: transform 0.3s`)

### LIVE badge

When any room member is actively voting (has submitted a score in the last 60 seconds):

- `LIVE` badge appears in the room header: red background, white text, JetBrains Mono 10px
- Pulses with `opacity` animation (1 → 0.6 → 1, 2s infinite)
- Disappears when no one has voted in 60s

---

## 4. Screens

### 4.1 Login

- Full-height, centered vertically
- Background glow blurs (3 gradient orbs: pink, violet, cyan) for dark mode
- Light mode: warm paper base with subtle gradient orbs at lower opacity
- Logo: gradient icon (star) in a hard-edged square (not rounded)
- Title: `EUROVISION BUDDY` in Unbounded 900, stacked
- Tagline: `Rate · Compare · Celebrate` in Inter 400, `--text3`
- One-line value prop below tagline: `Score Eurovision with your friends in real-time` (addresses marketing feedback for first-time users)
- Google sign-in button: white bg, sharp corners (0 radius), Inter 600
- No version string

### 4.2 Home (Room list)

- Header: `EUROVISION` (white/dark) + `BUDDY` (gradient) in Unbounded 700, 18px
- User avatar on the right (circle is OK for avatars — it's the standard)
- Join room: input (JetBrains Mono, monospace tracking, centered, uppercase) + JOIN button (gradient bg, sharp corners)
- Section label: `YOUR ROOMS` in Unbounded 600, 10px, letter-spacing 3px, `--text3`
- Room rows (not cards): same row style as contestants — left-edge accent (gradient per-room), room emoji icon, name, meta, code badge
- `Start a watch party` button: dashed border, sharp corners, Unbounded 600
- Global scoreboard link: more prominent than current — `How does your room stack up?` in JetBrains Mono, underlined

### 4.3 Room — Rate tab

- Sticky header: room name (Unbounded 600, 14px), contest name, room code button, members button, admin gear
- All header buttons: minimum 44px tap target
- Live ticker below header
- Emoji reaction bar: pinned below the ticker, above the contestant list. (Not above bottom nav — it needs to be near the content being reacted to.)
- Contestant list: rows as described in Layout System
- Tapping a row expands the voting panel inline

### 4.4 Voting panel (expanded row)

When tapping a contestant to vote:

- Row expands downward to reveal the scoring interface
- 3 criteria shown: Song Quality, Staging, Vocal Quality
- Each criterion: label (Inter 500, 12px) + row of 10 number buttons (1-10)
- Number buttons: 36px squares, sharp edges, JetBrains Mono 600
  - Unselected: `--surface` bg, `--text3` text
  - Selected: gradient bg (pink→violet), white text, slight scale pulse on select
- Overall score calculated live, displayed large: JetBrains Mono 700, 28px, color-coded by tier
- Auto-saves on each tap (existing behavior) — no submit button needed
- Collapse by tapping the row header again or tapping another contestant

### 4.5 Room — Rankings tab

- Same row layout as Rate tab but sorted by score descending
- Sort controls: `OVERALL` `SONG` `STAGING` `VOCAL` buttons, Unbounded 600, 10px
  - Active sort: `--pink` text + underline
  - Inactive: `--text3`
- Rows show: rank, flag, country, vote count, individual score breakdown, overall
- Individual scores: 3 small JetBrains Mono numbers OR mini gradient bars (test both)
- Voted entries always above unvoted (existing fix maintained)
- Expandable: tap a row to see per-voter breakdown

### 4.6 Room — My Scores tab

- Header: `VOTED X / 26` + `AVG Y.Z` in JetBrains Mono
- Only shows contestants the user has voted for
- Same row style, sorted by user's overall score descending
- Each row shows: rank (user's personal ranking), flag, country, 3 criteria scores, overall

### 4.7 Empty states

- No rooms: `No watch parties yet.` + prominent `Start a watch party` button
- No votes: `Tap a country to start rating.` centered, `--text3`
- No results: `No scores yet. Be the first to rate!`

### 4.8 Create Room flow

- Inline expansion on Home (not a modal)
- Room name input, contest dropdown, Create button
- Sharp-cornered inputs, consistent with overall design

---

## 5. Animations and Motion

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Row flash (score update) | Gold sweep left→right | 0.8s | ease-out |
| Score number pulse | scale 1.0→1.1→1.0 | 0.3s | cubic-bezier(0.34,1.56,0.64,1) |
| Rank reorder | FLIP technique (or `framer-motion` `layoutId`) | 0.3s | ease-in-out |
| Emoji float | translateY 0→-40px, opacity 1→0 | 1.5s | ease-out |
| Emoji button press | scale 1.0→1.2→1.0 | 0.15s | spring |
| Voting panel expand | height 0→auto, opacity 0→1 | 0.25s | ease-out |
| Score button select | scale 1.0→1.05, bg gradient fade-in | 0.15s | ease-out |
| LIVE badge pulse | opacity 1→0.6→1 | 2s | infinite |
| Ticker scroll | translateX loop | 30s | linear |
| Page entry (rows) | slide-up staggered 40ms per row | 0.25s | ease-out |

---

## 6. Real-time Data (Firestore)

### Existing: Score updates

Currently implemented via one-time `getDocs` fetch in `useScores` hook (not polling). For real-time flash effects, switch to `onSnapshot` listeners:

- Use `collectionGroup('scores')` with a composite index filtering by `contestId` — avoids creating 26 separate listeners (one per contestant). Single listener for all score changes in the contest.
- Requires Firestore composite index on the `scores` subcollection.
- When a doc changes, trigger flash animation on the affected row.
- If score changes rank order, animate row position change.
- **Cost note:** A single `collectionGroup` listener fires on any score write across all contestants. For a room of 8 voters and 26 contestants, worst case is ~208 score documents. This is well within free tier limits.

### New: Emoji reactions

New Firestore collection: `rooms/{roomId}/reactions`

Document structure:
```json
{
  "userId": "string",
  "userName": "string",
  "emoji": "string (fire|heart_eyes|skull|mic|clap|grimace)",
  "contestantId": "number",
  "timestamp": "ISO string",
  "ttl": "timestamp (auto-delete after 30s)"
}
```

- `onSnapshot` listener on reactions collection, filtered to last 30s
- Each reaction renders as a floating emoji on the corresponding contestant row
- Cleanup: client-side filtering only. Listener ignores reactions older than 30s. No server-side auto-delete (Firestore has no native TTL). Optionally add a Cloud Function on a daily schedule to purge old reactions if storage grows.
- Rate limit: max 1 reaction per user per 2 seconds (client-side throttle)

### New: Live presence

New Firestore document: `rooms/{roomId}/presence/{userId}`

```json
{
  "lastActive": "timestamp",
  "isVoting": "boolean"
}
```

- Updated on each score submission
- Drives the `LIVE` badge visibility
- Cleaned up when user leaves the room or after 60s inactivity
- **Note:** Firestore is not ideal for presence (no `onDisconnect`). For v1, use simple Firestore writes on score submit + client-side 60s timeout check. If latency/cost becomes an issue, migrate to Firebase Realtime Database for presence only.

---

## 7. Theme System

### CSS Custom Properties

All colors defined as CSS custom properties on `:root` (dark default) and `[data-theme="light"]`:

```css
:root {
  --bg: #0a0a0a;
  --text: #ffffff;
  /* ... all dark tokens */
}

[data-theme="light"] {
  --bg: #f0ece6;
  --text: #1a1a2e;
  /* ... all light tokens */
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #f0ece6;
    --text: #1a1a2e;
    /* ... light tokens */
  }
}
```

### Toggle behavior

- On first visit: follow `prefers-color-scheme`
- Manual toggle: sets `data-theme` attribute on `<html>` and saves to `localStorage`
- Toggle location: Home screen header (sun/moon icon) and Room settings gear menu

---

## 8. Accessibility

- All text meets WCAG AA contrast (4.5:1 body, 3:1 large)
- `--text2` (0.55 opacity) verified against both `#0a0a0a` and `#f0ece6`
- Touch targets: minimum 44x44px on all interactive elements
- Voted indicator: left-edge accent (4px bar) is visible, not just a 6px dot. Also has `aria-label="Voted"` for screen readers
- Emoji reactions have `aria-label` (e.g., "React with fire")
- Ticker has `role="marquee"` and `aria-live="polite"`
- Score buttons have `aria-pressed` state
- Focus indicators: 2px `--pink` outline on keyboard focus
- `prefers-reduced-motion`: disables ticker scroll, flash animations, emoji float. Score changes still update but without animation.

---

## 9. Stage 2 (Deferred — post-design)

These marketing ideas are captured for implementation after the core redesign ships:

1. Share My Scorecard (Instagram Stories card)
2. Room Leaderboard Comparison ("73% of rooms also ranked Norway #1")
3. Rich link previews for room invites (Open Graph cards)
4. Live activity indicators on Home screen ("3 friends voting now")
5. Pre-show predictions mode
6. Elevated Global Scoreboard ("How does your room stack up?")
7. Tagline revision (current: "Rate. Compare. Celebrate." → candidate: "Your squad. Your scores. Your Eurovision.")
8. Trademark research on "Eurovision" in the product name

### Resolved decisions (not deferred)

- **Tab labels:** Use `RATE` / `RANKINGS` / `MY SCORES` in this redesign. Component files keep their current names (`Voting.jsx`, `Results.jsx`, `MyVotesResults.jsx`) — only the displayed label text changes.
- **Score color tiers:** Deliberately changed from existing code. New system: cyan (`--cyan`) for 8.0+, gold (`--gold`) for 5.0–7.9, dim (`--text3`) for unvoted. This replaces the old gold-for-high / blue-for-mid scheme.
- **`countryCodeMap` duplication:** Extract to `src/constants.js` as a shared export. Remove duplicates from `Voting.jsx`, `Results.jsx`, and `MyVotesResults.jsx`. All three import from constants.

---

## 10. Files to Modify

| File | Changes |
|------|---------|
| `tailwind.config.js` | New color tokens, font families, remove old `esc-*` colors |
| `src/index.css` | New CSS custom properties, theme system, noise texture, diagonal dividers, flash animations, emoji animations, remove old `.glass` and `.esc-bg` |
| `src/App.css` | Theme toggle logic styles |
| `src/App.js` | Add theme toggle state, pass to components |
| `src/components/LoginScreen.jsx` | Full redesign — brutalist layout, glow orbs, value prop text |
| `src/components/HomePage.jsx` | Full redesign — row-based room list, warm paper light mode, sharp edges |
| `src/components/RoomPage.jsx` | Full redesign — hero header, live ticker, emoji bar, flash integration |
| `src/components/Voting.jsx` | Redesign scoring panel — sharp number buttons, gradient selection, inline expand |
| `src/components/Results.jsx` | Redesign to row layout — no cards, sort buttons, rank animations |
| `src/components/MyVotesResults.jsx` | Redesign to row layout — voted count header, personal rankings |
| `src/hooks/useScores.js` | Switch from polling to `onSnapshot` for real-time updates |
| `src/hooks/useReactions.js` | **NEW** — Firestore listener for emoji reactions |
| `src/hooks/usePresence.js` | **NEW** — Firestore presence tracking for LIVE badge |
| `src/constants.js` | Add emoji reaction types constant |
| `package.json` | Add Google Fonts (Unbounded, JetBrains Mono) — or use `@fontsource` |

---

## Reference Mockups

- `/.superpowers/brainstorm/295-1773670917/radical-directions.html` — Direction B (Brutalist Festival) dark + light
- `/.superpowers/brainstorm/295-1773670917/mobile-mockups.html` — Earlier iteration (superseded)
