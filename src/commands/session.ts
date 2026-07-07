import { Command } from "@sapphire/framework";
import { ChannelType, TextInputStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder } from "discord.js";
import { isGuildOwner, denyNonOwner } from "../lib/utils/owner-check";
import { sendSessionOpen, sendMarketClose, sendFuturesReopen } from "../lib/utils/session-tracker";
import { getTemplates, setTemplate, resetTemplate, SessionTemplate } from "../lib/db/session-store";

export class SessionCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "session",
      description: "Configure session tracker (OWNER ONLY)",
      detailedDescription: "Server owner only. Set channel, edit message templates, test announcements.",
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((sub) =>
          sub
            .setName("channel")
            .setDescription("Set announcement channel")
            .addChannelOption((option) =>
              option
                .setName("target")
                .setDescription("Channel for announcements")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("edit")
            .setDescription("Edit session message template")
            .addStringOption((option) =>
              option
                .setName("type")
                .setDescription("Which message to edit")
                .setRequired(true)
                .addChoices(
                  { name: "🟢 NYSE Open", value: "open" },
                  { name: "🔴 Market Close", value: "close" },
                  { name: "🟡 Futures Reopen", value: "reopen" }
                )
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("view")
            .setDescription("View current template")
            .addStringOption((option) =>
              option
                .setName("type")
                .setDescription("Which template to view")
                .setRequired(true)
                .addChoices(
                  { name: "🟢 Session Open", value: "open" },
                  { name: "🔴 Market Close", value: "close" },
                  { name: "🟡 Futures Reopen", value: "reopen" }
                )
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("reset")
            .setDescription("Reset template to default")
            .addStringOption((option) =>
              option
                .setName("type")
                .setDescription("Which to reset")
                .setRequired(true)
                .addChoices(
                  { name: "🟢 NYSE Open", value: "open" },
                  { name: "🔴 Market Close", value: "close" },
                  { name: "🟡 Futures Reopen", value: "reopen" },
                  { name: "⚠️ ALL TEMPLATES", value: "all" }
                )
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("test")
            .setDescription("Send test announcement")
            .addStringOption((option) =>
              option
                .setName("type")
                .setDescription("Which to test")
                .setRequired(true)
                .addChoices(
                  { name: "🟢 NYSE Open", value: "open" },
                  { name: "🔴 Market Close", value: "close" },
                  { name: "🟡 Futures Reopen", value: "reopen" }
                )
            )
        )
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!(await isGuildOwner(interaction))) {
      return denyNonOwner(interaction);
    }

    const subcommand = interaction.options.getSubcommand();
    const client = this.container.client as any;
    const guildId = interaction.guildId!;

    switch (subcommand) {
      case "channel": {
        const channel = interaction.options.getChannel("target", true);
        client.sessionChannelId = channel.id;
        return interaction.reply({
          content: `✅ Session announcements → <#${channel.id}>`,
          ephemeral: true,
        });
      }

      case "edit": {
        const type = interaction.options.getString("type", true) as "open" | "close" | "reopen";
        const template = getTemplates(guildId)[type];

        const modal = new ModalBuilder()
          .setCustomId(`session_edit_${type}`)
          .setTitle(`Edit ${type.toUpperCase()} Template`);

        const titleInput = new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Title")
          .setStyle(TextInputStyle.Short)
          .setValue(template.title)
          .setRequired(true);

        const descInput = new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Description (use {date}, {time}, {divider})")
          .setStyle(TextInputStyle.Paragraph)
          .setValue(template.description)
          .setRequired(true);

        const fieldsInput = new TextInputBuilder()
          .setCustomId("fields")
          .setLabel("Fields (JSON: [{name, value, inline}])")
          .setStyle(TextInputStyle.Paragraph)
          .setValue(JSON.stringify(template.fields, null, 2))
          .setRequired(true);

        const footerInput = new TextInputBuilder()
          .setCustomId("footer")
          .setLabel("Footer text")
          .setStyle(TextInputStyle.Short)
          .setValue(template.footer)
          .setRequired(true);

        const colorInput = new TextInputBuilder()
          .setCustomId("color")
          .setLabel("Color hex (optional, e.g. 00FF88)")
          .setStyle(TextInputStyle.Short)
          .setValue(template.color ?? "")
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(fieldsInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput)
        );

        return interaction.showModal(modal);
      }

      case "view": {
        const type = interaction.options.getString("type", true) as "open" | "close" | "reopen";
        const template = getTemplates(guildId)[type];

        const fieldsStr = template.fields.map((f) =>
          `**${f.name}**\n${f.value}\n${f.inline ? "*(inline)*" : ""}`
        ).join("\n\n");

        return interaction.reply({
          content: `**${type.toUpperCase()} Template**\n\n**Title:** ${template.title}\n**Color:** #${template.color ?? "default"}\n**Footer:** ${template.footer}\n\n**Description:**\n${template.description}\n\n**Fields:**\n${fieldsStr}`,
          ephemeral: true,
        });
      }

      case "reset": {
        const type = interaction.options.getString("type", true) as "open" | "close" | "reopen" | "all";
        resetTemplate(guildId, type);
        return interaction.reply({
          content: `✅ **${type.toUpperCase()}** template reset to default.`,
          ephemeral: true,
        });
      }

      case "test": {
        const type = interaction.options.getString("type", true) as "open" | "close" | "reopen";
        const channelId = client.sessionChannelId ?? process.env.SESSION_CHANNEL_ID;
        if (!channelId) {
          return interaction.reply({
            content: "❌ No session channel. Use `/session channel` first.",
            ephemeral: true,
          });
        }
        const channel = await this.container.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
          return interaction.reply({ content: "❌ Invalid channel.", ephemeral: true });
        }

        const customColor = client.sessionColor;
        switch (type) {
          case "open": await sendSessionOpen(channel, guildId, customColor); break;
          case "close": await sendMarketClose(channel, guildId, customColor); break;
          case "reopen": await sendFuturesReopen(channel, guildId, customColor); break;
        }
        return interaction.reply({
          content: `✅ Test **${type}** sent!`,
          ephemeral: true,
        });
      }
    }
  }
}
