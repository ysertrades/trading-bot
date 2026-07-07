import { Command } from "@sapphire/framework";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { buildEmbed, parseColor } from "../lib/utils/embed-builder";
import { isGuildOwner, denyNonOwner } from "../lib/utils/owner-check";

export class PollCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "poll",
      description: "Create a market bias poll (OWNER ONLY)",
      detailedDescription: "Server owner only. Create interactive bullish/bearish/neutral polls.",
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option.setName("question").setDescription("Poll question").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("symbol").setDescription("Trading symbol").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("color").setDescription("Embed hex color").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("image").setDescription("Image URL").setRequired(false)
        )
        .addStringOption((option) =>
          option.setName("expiry").setDescription("Duration: 30m, 1h, 2h").setRequired(false)
        )
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!(await isGuildOwner(interaction))) {
      return denyNonOwner(interaction);
    }

    const question = interaction.options.getString("question", true);
    const symbol = interaction.options.getString("symbol") ?? "Market";
    const colorInput = interaction.options.getString("color");
    const imageUrl = interaction.options.getString("image");
    const expiryInput = interaction.options.getString("expiry");

    const embedColor = colorInput ? parseColor(colorInput) : "#00FF88";
    let expiryMs = 3600000;
    if (expiryInput) {
      const match = expiryInput.match(/^(\d+)([mh])$/);
      if (match) {
        const val = parseInt(match[1]);
        expiryMs = match[2] === "h" ? val * 3600000 : val * 60000;
      }
    }

    const embed = buildEmbed({
      title: `📊 ${symbol.toUpperCase()} BIAS POLL`,
      description: `**${question}**\n\n🟢 **Bullish** — Green button\n🔴 **Bearish** — Red button\n🟡 **Neutral** — Yellow button`,
      color: embedColor,
      imageUrl: imageUrl ?? undefined,
      footer: { text: `Poll by ${interaction.user.tag} • Expires in ${this.formatDuration(expiryMs)}` },
      timestamp: Date.now(),
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("poll_bullish").setLabel("Bullish 🟢").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("poll_bearish").setLabel("Bearish 🔴").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("poll_neutral").setLabel("Neutral 🟡").setStyle(ButtonStyle.Primary)
    );

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const votes = { bullish: new Set<string>(), bearish: new Set<string>(), neutral: new Set<string>() };

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: expiryMs,
    });

    collector.on("collect", async (btnInteraction) => {
      const userId = btnInteraction.user.id;
      votes.bullish.delete(userId);
      votes.bearish.delete(userId);
      votes.neutral.delete(userId);

      switch (btnInteraction.customId) {
        case "poll_bullish": votes.bullish.add(userId); break;
        case "poll_bearish": votes.bearish.add(userId); break;
        case "poll_neutral": votes.neutral.add(userId); break;
      }

      const total = votes.bullish.size + votes.bearish.size + votes.neutral.size;
      const bullishPct = total > 0 ? Math.round((votes.bullish.size / total) * 100) : 0;
      const bearishPct = total > 0 ? Math.round((votes.bearish.size / total) * 100) : 0;
      const neutralPct = total > 0 ? Math.round((votes.neutral.size / total) * 100) : 0;

      const bar = (pct: number, emoji: string) => {
        const filled = Math.round(pct / 10);
        return `${emoji} ${"█".repeat(filled)}${"░".repeat(10 - filled)} ${pct}% (${Math.round((pct / 100) * total)})`;
      };

      const updated = buildEmbed({
        title: `📊 ${symbol.toUpperCase()} BIAS POLL`,
        description: `**${question}**\n\n${bar(bullishPct, "🟢")}\n${bar(bearishPct, "🔴")}\n${bar(neutralPct, "🟡")}\n\n📊 **Total:** ${total}`,
        color: embedColor,
        imageUrl: imageUrl ?? undefined,
        footer: { text: `Poll by ${interaction.user.tag} • Live` },
        timestamp: Date.now(),
      });

      await btnInteraction.update({ embeds: [updated], components: [row] });
    });

    collector.on("end", async () => {
      const total = votes.bullish.size + votes.bearish.size + votes.neutral.size;
      const final = buildEmbed({
        title: `📊 ${symbol.toUpperCase()} BIAS POLL — CLOSED`,
        description: `**${question}**\n\n🟢 Bullish: ${votes.bullish.size}\n🔴 Bearish: ${votes.bearish.size}\n🟡 Neutral: ${votes.neutral.size}\n\n📊 **Total:** ${total}`,
        color: #474747,
        imageUrl: imageUrl ?? undefined,
        footer: { text: "Poll closed • Final Results" },
        timestamp: Date.now(),
      });
      await message.edit({ embeds: [final], components: [] });
    });
  }

  private formatDuration(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }
}
