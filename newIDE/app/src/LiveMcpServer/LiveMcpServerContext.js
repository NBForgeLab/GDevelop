// @flow
import * as React from 'react';
import DesktopService from '../Utils/DesktopService';
import { useInterval } from '../Utils/UseInterval';
import LiveMcpServerDialog from './LiveMcpServerDialog';

// An agent session has no open connection to tell it is still there: it is
// shown as connected while it made a call recently.
const AGENT_ACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * The MCP server of the desktop app (see `LiveMcpServer.js` in the Electron
 * app), letting an AI agent edit the project opened in the editor.
 */
export type LiveMcpServerStatus = {|
  enabled: boolean,
  port: number | null,
  url: string | null,
  token: string | null,
  error: string | null,
|};

/** An agent session bound to this window. */
export type LiveMcpAgent = {|
  sessionId: string,
  clientName: string | null,
  lastActivityAt: number,
|};

type LiveMcpServerState = {|
  isSupported: boolean,
  status: ?LiveMcpServerStatus,
  setEnabled: (enabled: boolean) => Promise<void>,
  resetToken: () => Promise<void>,
  connectedAgents: Array<LiveMcpAgent>,
  openSetupDialog: () => void,
|};

export const LiveMcpServerContext: React.Context<LiveMcpServerState> = React.createContext<LiveMcpServerState>(
  {
    isSupported: false,
    status: null,
    setEnabled: async () => {},
    resetToken: async () => {},
    connectedAgents: [],
    openSetupDialog: () => {},
  }
);

const getClientName = (line: string): string | null => {
  try {
    const message = JSON.parse(line);
    const clientInfo =
      message && message.method === 'initialize' && message.params
        ? message.params.clientInfo
        : null;
    return clientInfo && typeof clientInfo.name === 'string'
      ? clientInfo.name
      : null;
  } catch (error) {
    return null;
  }
};

const useConnectedAgents = (): Array<LiveMcpAgent> => {
  const [agents, setAgents] = React.useState<Array<LiveMcpAgent>>([]);
  React.useEffect(() => {
    if (!DesktopService.isDesktop()) return;
    const onLiveMcpMessage = ({
      sessionId,
      line,
    }: {|
      sessionId: string,
      line: string,
    |}) => {
      const clientName = getClientName(line);
      setAgents(agents => [
        {
          sessionId,
          clientName:
            clientName ||
            (agents.find(agent => agent.sessionId === sessionId) || {})
              .clientName ||
            null,
          lastActivityAt: Date.now(),
        },
        ...agents.filter(agent => agent.sessionId !== sessionId),
      ]);
    };
    const onLiveMcpSessionClosed = ({ sessionId }: {| sessionId: string |}) => {
      setAgents(agents =>
        agents.filter(agent => agent.sessionId !== sessionId)
      );
    };
    const unsubscribeMessage = DesktopService.onIpcEvent(
      'mcp-live-message',
      onLiveMcpMessage
    );
    const unsubscribeClosed = DesktopService.onIpcEvent(
      'mcp-live-session-closed',
      onLiveMcpSessionClosed
    );
    return () => {
      unsubscribeMessage();
      unsubscribeClosed();
    };
  }, []);

  useInterval(
    () => {
      const now = Date.now();
      setAgents(agents => {
        const activeAgents = agents.filter(
          agent => now - agent.lastActivityAt < AGENT_ACTIVITY_TIMEOUT_MS
        );
        return activeAgents.length === agents.length ? agents : activeAgents;
      });
    },
    agents.length ? 30 * 1000 : null
  );
  return agents;
};

export const LiveMcpServerProvider = ({
  children,
}: {|
  children: React.Node,
|}): React.Node => {
  const [status, setStatus] = React.useState<?LiveMcpServerStatus>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = React.useState(false);
  const connectedAgents = useConnectedAgents();

  React.useEffect(() => {
    if (!DesktopService.isDesktop()) return;
    let isMounted = true;
    DesktopService.mcp.getLiveServerStatus().then(newStatus => {
      if (isMounted) setStatus(newStatus);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const setEnabled = React.useCallback(async (enabled: boolean) => {
    if (!DesktopService.isDesktop()) return;
    setStatus(await DesktopService.mcp.setLiveServerEnabled(enabled));
  }, []);
  const resetToken = React.useCallback(async () => {
    if (!DesktopService.isDesktop()) return;
    setStatus(await DesktopService.mcp.resetLiveServerToken());
  }, []);
  const openSetupDialog = React.useCallback(
    () => setIsSetupDialogOpen(true),
    []
  );

  const state = React.useMemo(
    () => ({
      isSupported: DesktopService.isDesktop(),
      status,
      setEnabled,
      resetToken,
      connectedAgents,
      openSetupDialog,
    }),
    [status, setEnabled, resetToken, connectedAgents, openSetupDialog]
  );

  return (
    <LiveMcpServerContext.Provider value={state}>
      {children}
      {isSetupDialogOpen && (
        <LiveMcpServerDialog
          status={status}
          connectedAgents={connectedAgents}
          setEnabled={setEnabled}
          resetToken={resetToken}
          onClose={() => setIsSetupDialogOpen(false)}
        />
      )}
    </LiveMcpServerContext.Provider>
  );
};
