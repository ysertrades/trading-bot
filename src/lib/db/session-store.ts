/**
 * Session Message Template Store
 * Owner-editable templates for automated session messages
 * 
 * In production, replace with PostgreSQL/MongoDB
 */

export interface SessionTemplate {
  title: string;
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
  footer: string;
  color?: string;
  imageUrl?: string;
}

// Default templates
const defaultOpenTemplate: SessionTemplate = {
  title: "🔔 NEW YORK SESSION — NOW LIVE",
  description: "📈 **Cash markets are OPEN**\n🎯 **Highest volatility window: 9:30–10:00 AM**\n⏰ **Closes at 5:00 PM EST**",
  fields: [
    { name: "🗺️ Macro Context", value: "• Check overnight moves\n• Watch pre-market highs/lows\n• Note gap fills", inline: false },
    { name: "📊 Key Focus", value: "**NQ** — Tech leadership\n**ES** — Broad market\n**YM** — Blue-chip\n**RTY** — Small-cap", inline: true },
    { name: "💡 Tips", value: "• First 15 min = noise\n• VWAP is your friend\n• Don't fight the drive", inline: true },
    { name: "⚠️ Risk", value: "Size down on open. Slippage is real.", inline: false },
  ],
  footer: "❄️ YSER Flow • NY Session Tracker",
};

const defaultCloseTemplate: SessionTemplate = {
  title: "🔒 MARKETS CLOSED — DAY DONE",
  description: "😴 **Equity markets are CLOSED**\n🌙 **Futures reopen at 6:00 PM EST**",
  fields: [
    { name: "📋 Review", value: "• Log all trades\n• Calculate P&L\n• Note what worked", inline: false },
    { name: "📝 Journal", value: "☐ Entry/exit prices\n☐ R-multiple\n☐ Emotional state", inline: true },
    { name: "🔮 Prep", value: "• Mark key levels\n• Check calendar\n• Set alerts", inline: true },
    { name: "🧘 Wind Down", value: "Step away. Rest is part of the edge.", inline: false },
  ],
  footer: "❄️ YSER Flow • Market Close",
};

const defaultReopenTemplate: SessionTemplate = {
  title: "🌙 FUTURES REOPENED — OVERNIGHT ACTIVE",
  description: "📈 **Globex session is LIVE**\n🌏 **Asia & Europe moves in play**\n🌅 **Cash reopens 9:30 AM EST**",
  fields: [
    { name: "🌍 Global Context", value: "• Asia session status\n• Europe active\n• Gap risk into tomorrow", inline: false },
    { name: "⚠️ Risks", value: "**Thin liquidity** — wider spreads\n**Low volume** — algos dominate", inline: true },
    { name: "🎯 Watch", value: "• Cash close levels\n• Structure breaks\n• Currency/bond moves", inline: true },
    { name: "💡 Strategy", value: "Smaller size. Wider stops. Don't force trades.", inline: false },
  ],
  footer: "❄️ YSER Flow • Overnight Futures",
};

// In-memory storage (per-guild)
const templates = new Map<string, { open: SessionTemplate; close: SessionTemplate; reopen: SessionTemplate }>();

export function getTemplates(guildId: string) {
  if (!templates.has(guildId)) {
    templates.set(guildId, {
      open: { ...defaultOpenTemplate },
      close: { ...defaultCloseTemplate },
      reopen: { ...defaultReopenTemplate },
    });
  }
  return templates.get(guildId)!;
}

export function setTemplate(guildId: string, type: "open" | "close" | "reopen", template: Partial<SessionTemplate>) {
  const current = getTemplates(guildId);
  current[type] = { ...current[type], ...template };
  templates.set(guildId, current);
  return current[type];
}

export function resetTemplate(guildId: string, type: "open" | "close" | "reopen" | "all") {
  if (type === "all") {
    templates.set(guildId, {
      open: { ...defaultOpenTemplate },
      close: { ...defaultCloseTemplate },
      reopen: { ...defaultReopenTemplate },
    });
    return getTemplates(guildId);
  }
  const defaults = { open: defaultOpenTemplate, close: defaultCloseTemplate, reopen: defaultReopenTemplate };
  const current = getTemplates(guildId);
  current[type] = { ...defaults[type] };
  templates.set(guildId, current);
  return current[type];
}

export function resetAllTemplates(guildId: string) {
  templates.delete(guildId);
}
