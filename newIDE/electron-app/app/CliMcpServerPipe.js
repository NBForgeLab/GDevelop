const readline = require('readline');

/**
 * With `--mcp`, GDevelop is a Model Context Protocol server using the "stdio"
 * transport: each line received on stdin is a JSON-RPC message, handled by
 * the editor (see `CliMcpServer.js` in the app), and each response is written
 * as a line on stdout. The app exits when stdin is closed by the MCP client.
 *
 * @param {{ ipcMain: import('electron').IpcMain, app: import('electron').App }} options
 */
const setupMcpStdioPipe = ({ ipcMain, app }) => {
  // Messages received before the editor opened the project.
  /** @type {string[]} */
  const pendingLines = [];
  /** @type {import('electron').WebContents | null} */
  let editorWebContents = null;

  ipcMain.on('mcp-ready', (event) => {
    editorWebContents = event.sender;
    const readyWebContents = event.sender;
    pendingLines
      .splice(0)
      .forEach((line) => readyWebContents.send('mcp-message', line));
  });
  ipcMain.on('mcp-send', (_event, text) => {
    process.stdout.write(text + '\n');
  });

  readline
    .createInterface({ input: process.stdin })
    .on('line', (line) => {
      if (!line.trim()) return;
      if (editorWebContents) editorWebContents.send('mcp-message', line);
      else pendingLines.push(line);
    })
    .on('close', () => app.exit(0));
};

module.exports = { setupMcpStdioPipe };
