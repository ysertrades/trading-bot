export interface PairConfig {
  symbol: string;
  tickSize: number;
  tickValue: number;
  microSymbol: string;
  microTickValue: number;
}

export interface ContractResult {
  pair: string;
  ticks: number;
  standard: {
    contracts: number;
    riskPerContract: number;
    totalRisk: number;
    valid: boolean;
  };
  micro: {
    contracts: number;
    riskPerContract: number;
    totalRisk: number;
  };
  best: {
    type: "standard" | "micro";
    contracts: number;
    symbol: string;
    totalRisk: number;
  };
}

export const PAIRS: PairConfig[] = [
  { symbol: "NQ", tickSize: 0.25, tickValue: 5, microSymbol: "MNQ", microTickValue: 0.5 },
  { symbol: "ES", tickSize: 0.25, tickValue: 12.5, microSymbol: "MES", microTickValue: 1.25 },
  { symbol: "YM", tickSize: 1, tickValue: 5, microSymbol: "MYM", microTickValue: 0.5 },
  { symbol: "RTY", tickSize: 0.1, tickValue: 5, microSymbol: "M2K", microTickValue: 0.5 },
  { symbol: "GC", tickSize: 0.1, tickValue: 10, microSymbol: "MGC", microTickValue: 1 },
  { symbol: "SI", tickSize: 0.005, tickValue: 25, microSymbol: "SIL", microTickValue: 2.5 },
];

export function calculateContracts(riskAmount: number, stopPoints: number): ContractResult[] {
  if (!riskAmount || !stopPoints || riskAmount <= 0 || stopPoints <= 0) return [];

  return PAIRS.map((pair) => {
    const ticks = stopPoints / pair.tickSize;
    const standardRiskPerContract = ticks * pair.tickValue;
    const standardContracts = Math.floor(riskAmount / standardRiskPerContract);
    const standardUsedRisk = standardContracts * standardRiskPerContract;
    const microRiskPerContract = ticks * pair.microTickValue;
    const microContracts = Math.floor(riskAmount / microRiskPerContract);
    const microUsedRisk = microContracts * microRiskPerContract;
    const standardDiff = Math.abs(riskAmount - standardUsedRisk);
    const microDiff = Math.abs(riskAmount - microUsedRisk);

    let bestType: "standard" | "micro";
    let bestContracts: number;
    let bestSymbol: string;
    let bestRisk: number;

    if (standardContracts >= 1 && standardDiff <= microDiff) {
      bestType = "standard";
      bestContracts = standardContracts;
      bestSymbol = pair.symbol;
      bestRisk = standardUsedRisk;
    } else {
      bestType = "micro";
      bestContracts = microContracts;
      bestSymbol = pair.microSymbol;
      bestRisk = microUsedRisk;
    }

    return {
      pair: pair.symbol,
      ticks,
      standard: {
        contracts: standardContracts,
        riskPerContract: standardRiskPerContract,
        totalRisk: standardUsedRisk,
        valid: standardContracts >= 1,
      },
      micro: {
        contracts: microContracts,
        riskPerContract: microRiskPerContract,
        totalRisk: microUsedRisk,
      },
      best: {
        type: bestType,
        contracts: bestContracts,
        symbol: bestSymbol,
        totalRisk: bestRisk,
      },
    };
  });
}

export function calculateSinglePair(symbol: string, riskAmount: number, stopPoints: number): ContractResult | null {
  const pair = PAIRS.find((p) => p.symbol === symbol.toUpperCase());
  if (!pair) return null;

  const ticks = stopPoints / pair.tickSize;
  const standardRiskPerContract = ticks * pair.tickValue;
  const standardContracts = Math.floor(riskAmount / standardRiskPerContract);
  const standardUsedRisk = standardContracts * standardRiskPerContract;
  const microRiskPerContract = ticks * pair.microTickValue;
  const microContracts = Math.floor(riskAmount / microRiskPerContract);
  const microUsedRisk = microContracts * microRiskPerContract;
  const standardDiff = Math.abs(riskAmount - standardUsedRisk);
  const microDiff = Math.abs(riskAmount - microUsedRisk);

  let bestType: "standard" | "micro";
  let bestContracts: number;
  let bestSymbol: string;
  let bestRisk: number;

  if (standardContracts >= 1 && standardDiff <= microDiff) {
    bestType = "standard";
    bestContracts = standardContracts;
    bestSymbol = pair.symbol;
    bestRisk = standardUsedRisk;
  } else {
    bestType = "micro";
    bestContracts = microContracts;
    bestSymbol = pair.microSymbol;
    bestRisk = microUsedRisk;
  }

  return {
    pair: pair.symbol,
    ticks,
    standard: {
      contracts: standardContracts,
      riskPerContract: standardRiskPerContract,
      totalRisk: standardUsedRisk,
      valid: standardContracts >= 1,
    },
    micro: {
      contracts: microContracts,
      riskPerContract: microRiskPerContract,
      totalRisk: microUsedRisk,
    },
    best: {
      type: bestType,
      contracts: bestContracts,
      symbol: bestSymbol,
      totalRisk: bestRisk,
    },
  };
}

export function getPairConfig(symbol: string): PairConfig | undefined {
  return PAIRS.find((p) => p.symbol === symbol.toUpperCase());
}

export function fmtMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}
