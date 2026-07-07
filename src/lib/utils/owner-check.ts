import { ChatInputCommandInteraction, GuildMember } from "discord.js";

/**
 * Check if the user is the guild owner
 */
export async function isGuildOwner(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.guild) return false;
  const owner = await interaction.guild.fetchOwner();
  return interaction.user.id === owner.id;
}

/**
 * Reply with owner-only error
 */
export async function denyNonOwner(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({
      content: "🚫 **Owner Only.** This command is restricted to the server owner.",
    });
  } else {
    await interaction.reply({
      content: "🚫 **Owner Only.** This command is restricted to the server owner.",
      ephemeral: true,
    });
  }
}
