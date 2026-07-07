import { Listener, UserError } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";

export class ChatInputCommandDeniedListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: "chatInputCommandDenied",
    });
  }

  public async run(error: UserError, { interaction }: { interaction: ChatInputCommandInteraction }) {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content: `❌ ${error.message}` });
    } else {
      await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
    }
  }
}
