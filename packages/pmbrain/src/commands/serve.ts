export async function runServe(): Promise<void> {
  console.log(JSON.stringify({
    ok: true,
    command: 'serve',
    mode: 'mcp-stdio',
    note: 'MCP server wiring is planned next. This is a stub entrypoint.',
  }, null, 2))
}
