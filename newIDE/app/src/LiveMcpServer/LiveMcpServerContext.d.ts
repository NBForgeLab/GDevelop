import * as React from 'react';

export type LiveMcpServerStatus = {
  enabled: boolean;
  port: number | null;
  url: string | null;
  token: string | null;
  error: string | null;
};

export type LiveMcpAgent = {
  sessionId: string;
  clientName: string | null;
  lastActivityAt: number;
};

type LiveMcpServerState = {
  isSupported: boolean;
  status: LiveMcpServerStatus | null | undefined;
  setEnabled: (enabled: boolean) => Promise<void>;
  resetToken: () => Promise<void>;
  connectedAgents: Array<LiveMcpAgent>;
  openSetupDialog: () => void;
};

export declare const LiveMcpServerContext: React.Context<LiveMcpServerState>;
