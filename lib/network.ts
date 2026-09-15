import { studioDevnet } from "genlayer-js/chains";

// Keep chain identity, RPC, and Consensus v0.6 deployment addresses coupled
// through the RC SDK's canonical network definition.
export const GENLAYER_NETWORK = {
  name: studioDevnet.name,
  chainId: studioDevnet.id,
  currency: studioDevnet.nativeCurrency.symbol,
  rpcUrl: studioDevnet.rpcUrls.default.http[0],
  explorerUrl: "https://explorer-studio-dev.genlayer.com",
} as const;

export const terminalStatuses = new Set(["FINALIZED", "APPROVED", "DENIED", "ESCALATED", "FAILED", "UNDETERMINED"]);
