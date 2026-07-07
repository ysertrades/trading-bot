import { Listener } from "@sapphire/framework";
import { Interaction, ModalSubmitInteraction } from "discord.js";
import { setTemplate } from "../lib/db/session-store";

export class InteractionCreateListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: "interactionCreate",
    });
  }

  public async run(interaction: Interaction) {
    if (!interaction.isModalSubmit()) return;

    const modalId = interaction.customId;
    if (!modalId.startsWith("session_edit_")) return;

    const type = modalId.replace("session_edit_", "") as "open" | "close" | "reopen";
    const guildId = interaction.guildId!;

    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const fieldsRaw = interaction.fields.getTextInputValue("fields");
    const footer = interaction.fields.getTextInputValue("footer");
    const colorRaw = interaction.fields.getTextInputValue("color");

    let fields: { name: string; value: string; inline?: boolean }[] = [];
    try {
      fields = JSON.parse(fieldsRaw);
    } catch {
      return interaction.reply({
        content: "❌ Invalid JSON in fields. Must be: [{\"name\": \"...\", \"value\": \"...\", \"inline\": true}]",
        ephemeral: true,
      });
    }

    setTemplate(guildId, type, {
      title,
      description,
      fields,
      footer,
      color: colorRaw || undefined,
    });

    await interaction.reply({
      content: `✅ **${type.toUpperCase()}** template updated! Use \"/session test ${type}\" to preview.`,
      ephemeral: true,
    });
  }
}
