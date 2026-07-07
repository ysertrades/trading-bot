import { Listener } from "@sapphire/framework";
import { ActivityType } from "discord.js";
import { startSessionTracker } from "../lib/utils/session-tracker";

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: "ready",
      once: true,
    });
  }

  public run() {
    const { username, id } = this.container.client.user!;
    this.container.logger.info(`✅ Logged in as ${username} (${id})`);

    const activityType = process.env.BOT_ACTIVITY_TYPE ?? "PLAYING";
    const activityName = process.env.BOT_ACTIVITY_NAME ?? "YSER Flow";
    this.container.client.user!.setActivity(activityName, {
      type: ActivityType[activityType as keyof typeof ActivityType] ?? ActivityType.Playing,
    });

    const client = this.container.client as any;
    startSessionTracker(
      () => {
        const channelId = client.sessionChannelId ?? process.env.SESSION_CHANNEL_ID;
        if (!channelId) return null;
        const channel = client.channels.cache.get(channelId);
        return channel?.isTextBased() ? channel : null;
      },
      () => {
        // Get guild ID from the channel's guild
        const channelId = client.sessionChannelId ?? process.env.SESSION_CHANNEL_ID;
        if (!channelId) return null;
        const channel = client.channels.cache.get(channelId);
        return channel?.guild?.id ?? null;
      },
      () => client.sessionColor
    );
  }
}
