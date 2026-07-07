import { EmbedBuilder, ColorResolvable } from "discord.js";

export interface EmbedOptions {
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  color?: ColorResolvable;
  imageUrl?: string;
  thumbnailUrl?: string;
  footer?: { text: string; iconURL?: string };
  timestamp?: Date | number;
  author?: { name: string; iconURL?: string; url?: string };
}

export function getEnvColor(key: string, fallback: string = "00FF88"): ColorResolvable {
  const envColor = process.env[key];
  if (envColor && /^[0-9A-Fa-f]{6}$/.test(envColor)) {
    return `#${envColor}` as ColorResolvable;
  }
  return `#${fallback}` as ColorResolvable;
}

export function getDefaultColor(): ColorResolvable {
  return getEnvColor("DEFAULT_EMBED_COLOR", "00FF88");
}

export function parseColor(colorInput: string): ColorResolvable {
  const clean = colorInput.replace("#", "");
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean}` as ColorResolvable;
  }
  return colorInput as ColorResolvable;
}

export function buildEmbed(options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(options.color ?? getDefaultColor());
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields?.length) embed.addFields(options.fields);
  if (options.imageUrl) embed.setImage(options.imageUrl);
  if (options.thumbnailUrl) embed.setThumbnail(options.thumbnailUrl);
  if (options.footer) embed.setFooter(options.footer);
  if (options.timestamp) embed.setTimestamp(options.timestamp);
  if (options.author) embed.setAuthor(options.author);
  return embed;
}
