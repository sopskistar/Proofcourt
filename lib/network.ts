export const GENLAYER_NETWORK = {
  name: "Bradbury", chainId: 4221, currency: "GEN",
  rpcUrl: "https://rpc-bradbury.genlayer.com",
  explorerUrl: "https://explorer-bradbury.genlayer.com",
} as const;

export const terminalStatuses = new Set(["FINALIZED", "APPROVED", "DENIED", "ESCALATED", "FAILED", "UNDETERMINED"]);
