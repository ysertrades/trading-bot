import { Command } from "@sapphire/framework";
import { buildEmbed, parseColor } from "../lib/utils/embed-builder";
import { calculateSinglePair, calculateContracts, PAIRS, fmtMoney } from "../lib/utils/futures-calculator";

export class RiskCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "risk",
      description: "Calculate futures position sizing",
      detailedDescription: "Enter risk amount and stop points. Bot calculates contracts for all pairs and intelligently suggests standard vs micro.",
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((sub) =>
          sub
            .setName("single")
            .setDescription("Calculate for a specific symbol")
            .addStringOption((option) =>
              option
                .setName("symbol")
                .setDescription("Futures symbol")
                .setRequired(true)
                .addChoices(...PAIRS.map((p) => ({ name: `${p.symbol} / ${p.microSymbol}`, value: p.symbol })))
            )
            .addNumberOption((option) =>
              option.setName("risk").setDescription("Risk amount in USD").setRequired(true).setMinValue(1)
            )
            .addNumberOption((option) =>
              option.setName("stop").setDescription("Stop distance in points").setRequired(true).setMinValue(0.1)
            )
            .addStringOption((option) =>
              option.setName("color").setDescription("Embed color hex").setRequired(false)
            )
            .addStringOption((option) =>
              option.setName("image").setDescription("Image URL").setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("all")
            .setDescription("Calculate for ALL pairs")
            .addNumberOption((option) =>
              option.setName("risk").setDescription("Risk amount in USD").setRequired(true).setMinValue(1)
            )
            .addNumberOption((option) =>
              option.setName("stop").setDescription("Stop distance in points").setRequired(true).setMinValue(0.1)
            )
            .addStringOption((option) =>
              option.setName("color").setDescription("Embed color hex").setRequired(false)
            )
            .addStringOption((option) =>
              option.setName("image").setDescription("Image URL").setRequired(false)
            )
        )
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const riskAmount = interaction.options.getNumber("risk", true);
    const stopPoints = interaction.options.getNumber("stop", true);
    const colorInput = interaction.options.getString("color");
    const imageUrl = interaction.options.getString("image");
    const embedColor = colorInput ? parseColor(colorInput) : undefined;

    if (subcommand === "single") {
      const symbol = interaction.options.getString("symbol", true);
      const result = calculateSinglePair(symbol, riskAmount, stopPoints);
      if (!result) {
        return interaction.editReply({ content: `❌ Unknown symbol: **${symbol}**` });
      }
      const pair = PAIRS.find((p) => p.symbol === symbol.toUpperCase())!;

      const fields = [
        {
          name: `🎯 BEST: ${result.best.symbol}`,
          value: `**${result.best.contracts}** contracts — ${fmtMoney(result.best.totalRisk)}\n${result.best.type === "standard" ? "📊 Standard" : "🔬 Micro"}`,
          inline: false,
        },
        {
          name: "📊 Standard",
          value: result.standard.valid
            ? `${pair.symbol}: **${result.standard.contracts}** contracts\nPer contract: ${fmtMoney(result.standard.riskPerContract)}\nTotal: ${fmtMoney(result.standard.totalRisk)}`
            : `${pair.symbol}: ❌ Not viable`,
          inline: true,
        },
        {
          name: "🔬 Micro",
          value: `${pair.microSymbol}: **${result.micro.contracts}** contracts\nPer contract: ${fmtMoney(result.micro.riskPerContract)}\nTotal: ${fmtMoney(result.micro.totalRisk)}`,
          inline: true,
        },
        {
          name: "📐 Math",
          value: `Stop: ${stopPoints} pts | Ticks: ${result.ticks.toFixed(2)}\nTick: ${pair.tickSize} | Value: $${pair.tickValue}`,
          inline: false,
        },
      ];

      const embed = buildEmbed({
        title: `❄️ YSER RISK — ${symbol.toUpperCase()}`,
        description: `Risk: **${fmtMoney(riskAmount)}** | Stop: **${stopPoints} pts**`,
        fields,
        color: 0x474747,
        imageUrl: imageUrl ?? undefined,
        footer: { text: "YSER Flow • Smart Contract Sizing" },
        timestamp: Date.now(),
      });

      await interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === "all") {
      const results = calculateContracts(riskAmount, stopPoints);
      const fields = results.map((r) => {
        const pair = PAIRS.find((p) => p.symbol === r.pair)!;
        const isStandard = r.best.type === "standard";
        const alt = isStandard
          ? `${pair.microSymbol}: ${r.micro.contracts} micro`
          : `${pair.symbol}: ${r.standard.contracts} standard`;
        return {
          name: `${isStandard ? "📊" : "🔬"} ${r.best.symbol}`,
          value: `**${r.best.contracts}** contracts — ${fmtMoney(r.best.totalRisk)}\nAlt: ${alt}`,
          inline: true,
        };
      });

      // Add spacers every 3 fields
      const spacedFields: typeof fields = [];
      fields.forEach((f, i) => {
        spacedFields.push(f);
        if ((i + 1) % 3 === 0 && i !== fields.length - 1) {
          spacedFields.push({ name: "\u200b", value: "\u200b", inline: false });
        }
      });

      const embed = buildEmbed({
        title: "❄️ YSER RISK — ALL PAIRS",
        description: `Risk: **${fmtMoney(riskAmount)}** | Stop: **${stopPoints} pts**`,
        fields: spacedFields,
        color: 0x474747,
        imageUrl: imageUrl ?? undefined,
        footer: { text: "YSER Flow • Auto standard/micro select" },
        timestamp: Date.now(),
      });

      await interaction.editReply({ embeds: [embed] });
    }
  }
}
