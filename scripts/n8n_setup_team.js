// Demo-mode team access:
//  1) Set the n8n owner password (from $N8N_OWNER_PASSWORD) so the team can log
//     in at https://n8n.navada-edge-server.uk and view the workflow + use the
//     credentials Lee configured (BYO model later).
//  2) Activate the two updated Jeen workflows (chat agent + team API).
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const bcrypt = require('/usr/local/lib/node_modules/n8n/node_modules/bcryptjs');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');
const run = (sql, p = []) => new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this.changes); }));
const get = (sql) => new Promise((res, rej) => db.get(sql, (e, r) => e ? rej(e) : res(r)));
(async () => {
  const hash = bcrypt.hashSync(process.env.N8N_OWNER_PASSWORD || 'CHANGE_ME', 10);
  const c1 = await run("UPDATE user SET password = ? WHERE email = 'leeakpareva@hotmail.com'", [hash]);
  console.log('owner password set, rows =', c1);
  const c2 = await run("UPDATE workflow_entity SET active = 1 WHERE id IN ('JeenClaimsChat1','JeenTeamAPI1')");
  console.log('workflows activated, rows =', c2);
  const u = await get("SELECT email, roleSlug FROM user WHERE email = 'leeakpareva@hotmail.com'");
  console.log('owner:', u.email, u.roleSlug);
  db.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
