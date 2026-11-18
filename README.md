# Let's Not Fight 🤝

**Let's Not Fight. Anymore.**

Every shared kitchen has the same argument: who left this here? Let's Not Fight answers it, so you don't have to.

The dorm kitchen is locked. Students tap their student card on the door to get in. Ceiling cameras follow each person as an anonymous number (#1, #2, …), the way cashierless stores do: identity comes only from the card tap, with no facial recognition. When someone taps out, the kitchen surfaces are compared with the "clean layout" the roommates agreed on. Anything new left in a keep-clear zone (a bowl on the island, a spill on the counter, stuff on the floor) is linked to whoever was there, and that person gets a friendly, private nudge on their phone.

> This is a UI-first hackathon demo. The door reader, cameras and phone are simulated in the browser, and app state lives in memory and `localStorage`. The one real connection is MeloMed 2DooD, reached through the Vite dev server (see below).

## Run it

```bash
npm install && npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173) and press **Run demo**.

## Screens

| Screen | What it does |
| --- | --- |
| **House Rules** | The kitchen photo with zones drawn on it. Draw rectangles or polygons, label each as *OK: drying rack*, *OK: pots & pans*, *OK: appliances* or *Keep clear*. Click a zone to rename, change type, reshape (drag corners) or delete it. Saved to `localStorage`, pre-seeded with a default layout. |
| **Live Kitchen** | The main demo view. Tap a student card to unlock the door and add an anonymous person marker (drag to move). Pick an item (bowl, plate, cup, pan, spill, food bag) and click the photo to drop it. Items in OK spots get a green ring; items in keep-clear zones pulse red. **Tap out** runs the scan with a before/after comparison. |
| **Phone Nudge** | A phone mockup showing the private push notification with a **Cleaned it** button (clears the items, confetti, streak goes up). |
| **Peace Log** | Timeline of entries, exits (card → anonymous #), issues, nudges and resolutions, plus friendly stats: days without a kitchen fight, clean-up rate, average time to tidy. No leaderboard. |

**How it works** (top bar) explains the privacy model.

## How attribution works

1. A card tap at the door assigns the next anonymous track number (#1, #2, …).
2. When an item appears, it is linked to the **nearest** person inside at that moment.
3. On tap-out, any items in keep-clear zones linked to that person become one issue, and a nudge goes to that person only.
4. Zones can overlap. The smallest zone containing a point wins, so a small OK spot can sit inside a big keep-clear counter.

## Demo script (Run demo)

Auto-plays about 2–3 seconds per step with a caption bar; use **Pause** and **Next** to talk over it.

1. Maya taps in (#1), Alex taps in (#2).
2. Maya leaves a bowl on the island and a spill on the counter.
3. Alex puts a pan in the pots & pans spot (fine).
4. Maya taps out: the scan flags 2 items and a kind nudge lands on Maya's phone. Two to-dos land in Maya's 2DooD list through the 2DooD MCP server.
5. Alex taps out: all clear, green check.
6. Maya taps **Cleaned it**: items disappear, the 2DooD to-dos are ticked off, confetti, and "days without a kitchen fight" ticks up.

Run demo resets the live kitchen, log and stats each time and keeps your House Rules zones. It also turns on 2DooD sync and shows the to-dos arriving in 2DooD on the Phone Nudge tab.

## Privacy

- No facial recognition. Identity only comes from the card tap.
- Cameras track anonymous numbers and only store surface snapshots, not video of people.
- Nudges go privately to one person, never to the group chat. There is no public list of who left what.

## MeloMed 2DooD integration

Let's Not Fight uses the real [MeloMed 2DooD MCP server](https://melomed.io/developers/2dood) (`2dood-mcp`) to put clean-up to-dos on the student's 2DooD list.

**How it flows**

1. Turn on **2DooD sync** in the top bar. (Run demo turns it on for you.)
2. When a tap-out scan creates an issue, the app calls the 2DooD `add_tasks` tool with one to-do per item, e.g. `Clean: bowl on the island`, due 30 minutes later, with a note saying it's a private kitchen nudge.
3. The nudge on the phone shows the live status: *Syncing to 2DooD…*, *Added to 2DooD · 2 to-dos*, or *2DooD offline*.
4. When the student taps **Cleaned it**, the app calls `complete_task` on those to-dos, and they're ticked off in 2DooD too.
5. The **Phone Nudge** tab shows the student's open 2DooD list, read live with `list_tasks`. The Peace Log records each sync.

**How it's wired**

A browser can't talk to an MCP server over stdio, so `server/twodood.ts` is a small Vite plugin. When you run `npm run dev` (or `npm run preview`), it starts `2dood-mcp` as a child process with the official MCP TypeScript SDK and exposes a JSON API to the page:

| Endpoint | 2DooD MCP tool |
| --- | --- |
| `GET /api/2dood/status` | connects and reports the server name |
| `GET /api/2dood/tasks` | `list_tasks` (view `open`) |
| `POST /api/2dood/add` `{ tasks, notes, due }` | `add_tasks` |
| `POST /api/2dood/complete` `{ ids }` | `complete_task` |

`2dood-mcp` is installed as a dev dependency, so `npm install` is all you need; nothing is downloaded at demo time.

**Demo mode vs. a real account**

By default the bridge runs `2dood-mcp --demo`: MeloMed's built-in fictional student (Maya Chen) with made-up classes and deadlines, kept in memory. No account, no sign-in, no network. Its data resets when the dev server restarts.

To use a real 2DooD account instead (email and password sign-in):

```bash
npx -y 2dood-mcp login
```

```bash
TWODOOD_LIVE=1 npm run dev
```

One `2dood-mcp` server acts as one 2DooD account, so in this demo every student's to-dos go to that one list (the note on each to-do names the student). In a real deployment each student would connect their own 2DooD account.

**Using 2DooD from Claude or another MCP app**

The same server works in any MCP client, e.g. Claude Code:

```bash
claude mcp add 2dood-demo -s user -- npx -y 2dood-mcp --demo
```

or `mcpServers` JSON (Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "2dood-demo": { "command": "npx", "args": ["-y", "2dood-mcp", "--demo"] }
  }
}
```

## Tech

Vite + React + TypeScript + Tailwind CSS v4, `lucide-react` icons, `@modelcontextprotocol/sdk` + `2dood-mcp` for the 2DooD integration. Main files:

- `src/store.tsx`: app state, reducer, attribution logic, `localStorage` persistence
- `src/data.ts`: demo students, items and default zones (authored in photo pixels)
- `src/demo.ts`: the Run demo script
- `server/twodood.ts`: Vite plugin bridging the app to the 2DooD MCP server
- `src/twodood.tsx`: browser side of the 2DooD sync (add, complete, live list, badges)
- `src/components/`: screens (`LayoutEditor`, `LiveKitchen`, `PhoneScreen`, `PeaceLog`) and shared pieces

To use a different kitchen photo, replace `public/kitchen.png` (4:3 works best) and redraw the zones in House Rules, or edit `DEFAULT_ZONES` in `src/data.ts`.
