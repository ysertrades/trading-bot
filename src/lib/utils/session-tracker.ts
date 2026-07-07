import { TextBasedChannel } from "discord.js";
import { CronJob } from "cron";
import { buildEmbed, getEnvColor, parseColor } from "./embed-builder";
import { getTemplates, SessionTemplate } from "../db/session-store";

export function getNYTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
}

export function formatNYTime(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getNYDate(): string {
  return getNYTime().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function divider(): string {
  return "━━━━━━━━━━━━━━━━━━━━━━";
}

function applyTemplate(template: SessionTemplate): {
  title: string;
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
  footer: { text: string };
  color: string;
  imageUrl?: string;
} {
  const nyNow = getNYTime();
  const dateStr = getNYDate();
  const timeStr = formatNYTime(nyNow);

  // Replace placeholders in description
  let desc = template.description
    .replace(/\{date\}/g, dateStr)
    .replace(/\{time\}/g, timeStr)
    .replace(/\{divider\}/g, divider());

  // Replace placeholders in field values
  const fields = template.fields.map((f) => ({
    name: f.name,
    value: f.value
      .replace(/\{date\}/g, dateStr)
      .replace(/\{time\}/g, timeStr)
      .replace(/\{divider\}/g, divider()),
    inline: f.inline ?? false,
  }));

  // Replace placeholders in footer
  const footerText = template.footer
    .replace(/\{date\}/g, dateStr)
    .replace(/\{time\}/g, timeStr);

  return {
    title: template.title,
    description: desc,
    fields,
    footer: { text: footerText },
    color: template.color ?? "#00FF88",
    imageUrl: template.imageUrl,
  };
}

export async function sendSessionOpen(channel: TextBasedChannel, guildId: string, customColor?: string) {
  const template = getTemplates(guildId).open;
  const applied = applyTemplate(template);
  const color = customColor ? parseColor(customColor) : (applied.color ? parseColor(applied.color) : getEnvColor("SESSION_OPEN_COLOR", "00FF88"));

  const embed = buildEmbed({
    title: applied.title,
    description: applied.description,
    fields: applied.fields,
    color,
    imageUrl: applied.imageUrl,
    footer: applied.footer,
    timestamp: Date.now(),
  });

  if ('send' in channel) {
    await channel.send({ embeds: [embed] });
  }
}

export async function sendMarketClose(channel: TextBasedChannel, guildId: string, customColor?: string) {
  const template = getTemplates(guildId).close;
  const applied = applyTemplate(template);
  const color = customColor ? parseColor(customColor) : (applied.color ? parseColor(applied.color) : getEnvColor("SESSION_CLOSE_COLOR", "FF4444"));

  const embed = buildEmbed({
    title: applied.title,
    description: applied.description,
    fields: applied.fields,
    color,
    imageUrl: applied.imageUrl,
    footer: applied.footer,
    timestamp: Date.now(),
  });

  if ('send' in channel) {
    await channel.send({ embeds: [embed] });
  }
}

export async function sendFuturesReopen(channel: TextBasedChannel, guildId: string, customColor?: string) {
  const template = getTemplates(guildId).reopen;
  const applied = applyTemplate(template);
  const color = customColor ? parseColor(customColor) : (applied.color ? parseColor(applied.color) : getEnvColor("SESSION_REOPEN_COLOR", "FFAA00"));

  const embed = buildEmbed({
    title: applied.title,
    description: applied.description,
    fields: applied.fields,
    color,
    imageUrl: applied.imageUrl,
    footer: applied.footer,
    timestamp: Date.now(),
  });

  if ('send' in channel) {
    await channel.send({ embeds: [embed] });
  }
}

const jobs: CronJob[] = [];

export function startSessionTracker(
  getChannel: () => TextBasedChannel | null,
  getGuildId: () => string | null,
  getColor: () => string | undefined
) {
  jobs.forEach((j) => j.stop());
  jobs.length = 0;

  const openJob = new CronJob(
    "30 9 * * 1-5",
    async () => {
      const channel = getChannel();
      const guildId = getGuildId();
      if (channel && guildId) await sendSessionOpen(channel, guildId, getColor());
    },
    null,
    true,
    "America/New_York"
  );
  jobs.push(openJob);

  const closeJob = new CronJob(
    "0 17 * * 1-5",
    async () => {
      const channel = getChannel();
      const guildId = getGuildId();
      if (channel && guildId) await sendMarketClose(channel, guildId, getColor());
    },
    null,
    true,
    "America/New_York"
  );
  jobs.push(closeJob);

  const reopenJob = new CronJob(
    "0 18 * * 0-4",
    async () => {
      const channel = getChannel();
      const guildId = getGuildId();
      if (channel && guildId) await sendFuturesReopen(channel, guildId, getColor());
    },
    null,
    true,
    "America/New_York"
  );
  jobs.push(reopenJob);

  console.log("✅ Session tracker cron jobs started");
}
