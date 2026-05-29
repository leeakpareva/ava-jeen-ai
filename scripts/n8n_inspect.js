// Read-only inspection of the n8n sqlite DB (user/role/project/sharing schema).
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite', sqlite3.OPEN_READONLY);
const all = (sql) => new Promise((res, rej) => db.all(sql, (e, r) => e ? rej(e) : res(r)));
(async () => {
  for (const tbl of ['user', 'project', 'project_relation', 'shared_workflow', 'shared_credentials', 'role']) {
    try { const cols = await all(`PRAGMA table_info(${tbl})`); console.log(`[${tbl}] ` + cols.map(c => c.name).join(', ')); }
    catch (e) { console.log(`[${tbl}] n/a (${e.message})`); }
  }
  console.log('USERS:');
  for (const u of await all('SELECT id,email,role FROM user')) console.log('  ', u.email, '|', u.role, '|', u.id);
  console.log('PROJECTS:');
  for (const p of await all('SELECT id,name,type FROM project')) console.log('  ', p.type, '|', p.name, '|', p.id);
  console.log('PROJECT_RELATION sample:');
  try { for (const r of await all('SELECT * FROM project_relation LIMIT 5')) console.log('  ', JSON.stringify(r)); } catch (e) { console.log('  ', e.message); }
  console.log('JEEN WORKFLOWS:');
  for (const w of await all("SELECT id,name,active FROM workflow_entity WHERE id LIKE 'Jeen%'")) console.log('  ', w.id, '| active=' + w.active, '|', w.name);
  db.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
