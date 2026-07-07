import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  loadMessageCommandListeners: true,
  defaultPrefix: "!",
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);
