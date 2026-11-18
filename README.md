# Let's Not Fight 🤝

**Let's Not Fight. Anymore.**

Every shared kitchen has the same argument: who left this here? Let's Not Fight answers it, so you don't have to.

The dorm kitchen is locked. Students tap their student card on the door to get in. Ceiling cameras follow each person as an anonymous number (#1, #2, …), the way cashierless stores do: identity comes only from the card tap, with no facial recognition. When someone taps out, the kitchen surfaces are compared with the "clean layout" the roommates agreed on. Anything new left in a keep-clear zone (a bowl on the island, a spill on the counter, stuff on the floor) is linked to whoever was there, and that person gets a friendly, private nudge on their phone.

> This is a UI-first hackathon demo. The door reader, cameras and phone are all simulated in the browser. There is no backend; state lives in memory and `localStorage`.

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
4. Maya taps out: the scan flags 2 items and a kind nudge lands on Maya's phone.
5. Alex taps out: all clear, green check.
6. Maya taps **Cleaned it**: items disappear, confetti, and "days without a kitchen fight" ticks up.

Run demo resets the live kitchen, log and stats each time, but keeps your House Rules zones and the 2DooD setting.

## Privacy

- No facial recognition. Identity only comes from the card tap.
- Cameras track anonymous numbers and only store surface snapshots, not video of people.
- Nudges go privately to one person, never to the group chat. There is no public list of who left what.

## Optional: MeloMed 2DooD sync

Turn on **2DooD sync** in the top bar. When an issue is created, the app shows a **Synced to 2DooD** badge on the nudge and logs a to-do such as `Clean: bowl on the island` for that student. In this demo the sync is simulated; the browser does not call the MCP server.

To wire it up for real, run the 2DooD MCP server (demo data) with an MCP client:

```bash
npx -y 2dood-mcp
```

For example, to add it to Claude Code:

```bash
claude mcp add 2dood -- npx -y 2dood-mcp
```

or in an `.mcp.json`:

```json
{
  "mcpServers": {
    "2dood": { "command": "npx", "args": ["-y", "2dood-mcp"] }
  }
}
```

Then, when an issue is created, call the server's create-to-do tool with a title like `Clean: bowl on island` for the nudged student. Check the tool names and arguments in the MeloMed developer docs at melomed.io/developers.

## Tech

Vite + React + TypeScript + Tailwind CSS v4, `lucide-react` icons. Main files:

- `src/store.tsx`: app state, reducer, attribution logic, `localStorage` persistence
- `src/data.ts`: demo students, items and default zones (authored in photo pixels)
- `src/demo.ts`: the Run demo script
- `src/components/`: screens (`LayoutEditor`, `LiveKitchen`, `PhoneScreen`, `PeaceLog`) and shared pieces

To use a different kitchen photo, replace `public/kitchen.png` (4:3 works best) and redraw the zones in House Rules, or edit `DEFAULT_ZONES` in `src/data.ts`.
