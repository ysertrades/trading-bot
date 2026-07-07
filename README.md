# ❄️ YSER Bot v2.0

**Owner-only admin** | **Editable session messages** | **Smart risk calculator**

Built with [Sapphire Framework](https://sapphirejs.dev/)

---

## 🔐 Security: Owner-Only Commands

| Command | Access |
|---------|--------|
| `/poll` | **Server Owner ONLY** |
| `/session` | **Server Owner ONLY** |
| `/risk` | **Everyone** |

Non-owners get: 🚫 **Owner Only.** This command is restricted to the server owner.

---

## ✨ Features

### 1. `/risk` — Futures Risk Calculator (Everyone)
Your exact logic: input `riskAmount` + `stopPoints` → get contract sizing for standard & micro pairs.

**Pairs:** NQ/MNQ, ES/MES, YM/MYM, RTY/M2K, GC/MGC, SI/SIL

```
/risk single symbol:NQ risk:100 stop:10 color:00FF88
/risk all risk:250 stop:15 image:https://example.com/chart.png
```

### 2. `/poll` — Market Bias Polls (Owner Only)
Interactive bullish/bearish/neutral polls with live vote tracking.

```
/poll question:"NQ bias today?" symbol:NQ color:FF5733 expiry:2h
```

### 3. `/session` — Session Tracker (Owner Only)
**Fully editable automated messages!**

| Subcommand | What It Does |
|------------|-------------|
| `/session channel #announcements` | Set announcement channel |
| `/session edit open` | **Edit** the session open message (modal popup) |
| `/session edit close` | **Edit** the market close message |
| `/session edit reopen` | **Edit** the futures reopen message |
| `/session view open` | **View** current template |
| `/session reset open` | **Reset** to default |
| `/session test open` | **Test** send a message |

---

## 📝 Editable Session Messages

When you run `/session edit open`, a **modal popup** appears with:

| Field | Description |
|-------|-------------|
| **Title** | Embed title |
| **Description** | Main text. Use placeholders: `{date}`, `{time}`, `{divider}` |
| **Fields** | JSON array of embed fields `[{"name":"...","value":"...","inline":true}]` |
| **Footer** | Footer text |
| **Color** | Hex color (optional) |

### Placeholders (auto-replaced)
- `{date}` → "Tuesday, Jul 7"
- `{time}` → "09:30 AM"
- `{divider}` → "━━━━━━━━━━━━━━━━━━━━━━"

### Example Fields JSON:
```json
[
  {"name": "📊 Focus", "value": "NQ, ES, YM", "inline": true},
  {"name": "💡 Tips", "value": "Watch VWAP", "inline": true}
]
```

---

## 🚂 Railway Deployment

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Bot token |
| `GUILD_ID` | ✅ | Server ID |
| `SESSION_CHANNEL_ID` | ✅ | Default announcement channel |
| `DEFAULT_EMBED_COLOR` | ❌ | Default color (00FF88) |
| `SESSION_OPEN_COLOR` | ❌ | Open message color |
| `SESSION_CLOSE_COLOR` | ❌ | Close message color |
| `SESSION_REOPEN_COLOR` | ❌ | Reopen message color |
| `BOT_ACTIVITY_TYPE` | ❌ | PLAYING, WATCHING, etc. |
| `BOT_ACTIVITY_NAME` | ❌ | Status text |

**No code changes needed after deployment.** All config is env-based or owner-editable via commands.

---

## 📁 Structure

```
src/
├── main.ts
├── commands/
│   ├── risk.ts           # Everyone
│   ├── poll.ts           # Owner only
│   └── session.ts        # Owner only (full edit access)
├── listeners/
│   ├── ready.ts          # Auto-start session cron
│   ├── interactionCreate.ts  # Handle modal submissions
│   └── chatInputCommandDenied.ts
└── lib/
    ├── db/
    │   └── session-store.ts    # Template storage
    └── utils/
        ├── embed-builder.ts
        ├── futures-calculator.ts   # YOUR logic
        ├── owner-check.ts          # Owner validation
        └── session-tracker.ts      # Cron + editable messages
```

---

## 🛠️ Setup

```bash
npm install
# Create .env from .env.example
npm run dev     # Development
npm run build   # Production build
npm start       # Run
```

---

## 🎯 Automated Schedule (EST)

| Event | Time | Days |
|-------|------|------|
| NY Session Open | 9:30 AM | Mon-Fri |
| Markets Close | 5:00 PM | Mon-Fri |
| Futures Reopen | 6:00 PM | Sun-Thu |

All messages use **your edited templates** or defaults.

---

MIT License
