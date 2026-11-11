import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Queries Cloudflare analytics only; never calls the game or its storage APIs.
const args = process.argv.slice(2);
const options = { watch: 0, interval: 60, json: false, since: null, room: null };
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--watch') options.watch = Number(args[++i]);
  else if (args[i] === '--interval') options.interval = Number(args[++i]);
  else if (args[i] === '--since') options.since = args[++i];
  else if (args[i] === '--room') options.room = args[++i];
  else if (args[i] === '--json') options.json = true;
  else throw Error(`Unknown option: ${args[i]}`);
}
if (!Number.isFinite(options.watch) || options.watch < 0 ||
    !Number.isFinite(options.interval) || options.interval < 30)
  throw Error('Use --watch MINUTES (0 for one sample) and --interval SECONDS (at least 30).');
const account = process.env.CLOUDFLARE_ACCOUNT_ID ?? 'd397c97e690b326793c9671f315a1ba8';
const labels = {
  '34a2833fa42b45608e2caa6c5f9a35ff': 'Room',
  '740f139d30ae4565b6b5fe4226a3d896': 'Directory',
};
async function credential() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const config = process.env.WRANGLER_CONFIG_PATH ?? (process.platform === 'darwin'
    ? join(homedir(), 'Library/Preferences/.wrangler/config/default.toml')
    : join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), '.wrangler/config/default.toml'));
  const contents = await readFile(config, 'utf8');
  const token = contents.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw Error('Set CLOUDFLARE_API_TOKEN or sign in with Wrangler.');
  return token;
}
async function sample() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  const start = options.since ? new Date(options.since) : midnight;
  if (!Number.isFinite(+start) || +start > +now) throw Error('--since must be a valid timestamp no later than now.');
  const recent = new Date(Math.max(+start, +now - 15 * 60_000));
  const roomFilter = options.room ? `, name: ${JSON.stringify(options.room)}` : '';
  const query = `query($account: string!, $start: Time!, $recent: Time!, $end: Time!) {
    viewer { accounts(filter: {accountTag: $account}) {
      today: durableObjectsPeriodicGroups(limit: 1000, filter: {datetime_geq: $start, datetime_lt: $end${roomFilter}}) {
        dimensions { namespaceId } sum { rowsWritten outboundWebsocketMsgCount }
      }
      rooms: durableObjectsPeriodicGroups(limit: 10000, filter: {datetime_geq: $start, datetime_lt: $end${roomFilter}}) {
        dimensions { namespaceId name } sum { rowsWritten }
      }
      recent: durableObjectsPeriodicGroups(limit: 10000, filter: {datetime_geq: $recent, datetime_lt: $end${roomFilter}}) {
        dimensions { datetimeMinute namespaceId } sum { rowsWritten }
      }
    } }
  }`;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${await credential()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { account, start: start.toISOString(), recent: recent.toISOString(), end: now.toISOString() } }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length)
    throw Error(`Cloudflare metrics query failed: ${body.errors?.map(e => e.message).join('; ') ?? response.status}`);
  const data = body.data?.viewer?.accounts?.[0];
  if (!data) throw Error('Cloudflare returned no accessible account metrics; this is not a zero count.');
  if (data.today.length >= 1000 || data.rooms.length >= 10000 || data.recent.length >= 10000)
    throw Error('Metrics group limit reached; narrow the query rather than reporting a truncated count.');
  const perMinute = {};
  for (const row of data.recent) {
    const minute = row.dimensions.datetimeMinute;
    perMinute[minute] = (perMinute[minute] ?? 0) + row.sum.rowsWritten;
  }
  const namespaces = data.today.map(r => ({ namespace: labels[r.dimensions.namespaceId] ?? r.dimensions.namespaceId, rowsWritten: r.sum.rowsWritten, outboundMessages: r.sum.outboundWebsocketMsgCount }));
  return {
    observedAt: now.toISOString(), since: start.toISOString(), room: options.room,
    reportedRowsWritten: namespaces.reduce((n, r) => n + r.rowsWritten, 0),
    reportedOutboundMessages: namespaces.reduce((n, r) => n + r.outboundMessages, 0),
    latestReportedMinute: Object.keys(perMinute).sort().at(-1) ?? null,
    recentPeakRowsPerMinute: Math.max(0, ...Object.values(perMinute)),
    namespaces,
    rooms: data.rooms.filter(r => r.sum.rowsWritten > 0).map(r => ({
      namespace: labels[r.dimensions.namespaceId] ?? r.dimensions.namespaceId,
      room: r.dimensions.name || '(unnamed)', rowsWritten: r.sum.rowsWritten,
    })).sort((a, b) => b.rowsWritten - a.rowsWritten),
    perMinute: Object.fromEntries(Object.entries(perMinute).sort()),
    note: 'Cloudflare-reported row counts; recent minutes may be delayed or revised. Not game counts or storage API call counts.',
  };
}
const started = Date.now();
let previous;
try {
  do {
    const value = await sample();
    if (previous?.since === value.since)
      value.changeInReportedTotal = value.reportedRowsWritten - previous.reportedRowsWritten;
    if (options.json) console.log(JSON.stringify(value));
    else {
      console.log(`\n${value.observedAt}: ${value.reportedRowsWritten.toLocaleString()} reported rows written since ${value.since}; latest minute ${value.latestReportedMinute ?? 'none'}`);
      console.log(value.note);
      console.table(value.rooms);
      console.table(Object.entries(value.perMinute).map(([minute, rowsWritten]) => ({minute, rowsWritten})));
    }
    previous = value;
    if (!options.watch || Date.now() - started >= options.watch * 60_000) break;
    await delay(Math.min(options.interval * 1000, Math.max(0, options.watch * 60_000 - (Date.now() - started))));
  } while (true);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
