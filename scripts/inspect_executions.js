// Prints the latest n8n executions with per-node status and the AI verdict.
// Run inside the container:
//   docker cp scripts/inspect_executions.js vantora-n8n:/tmp/inspect.js
//   docker exec -w /usr/local/lib/node_modules/n8n vantora-n8n node /tmp/inspect.js [count]
const path = require('path');
const req = (m) => require(require.resolve(m, { paths: [process.cwd()] }));
const sqlite3 = req('sqlite3');
const { parse } = req('flatted');

const limit = Number(process.argv[2] || 3);
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.all(
  `select e.id, e.status, e.startedAt, e.stoppedAt, d.data from execution_entity e
   join execution_data d on d.executionId = e.id order by e.id desc limit ?`,
  [limit],
  (err, rows) => {
    if (err) throw err;
    for (const row of rows.reverse()) {
      const rd = parse(row.data).resultData;
      const secs = ((new Date(row.stoppedAt) - new Date(row.startedAt)) / 1000).toFixed(1);
      console.log(`\n=== Execution ${row.id} · ${row.status} · ${secs}s`);
      if (rd.error) console.log(`  ERROR in ${rd.error.node?.name ?? rd.lastNodeExecuted}: ${rd.error.message}`);
      for (const [name, runs] of Object.entries(rd.runData)) {
        const r = runs[0];
        console.log(`  ${r.error ? '✗' : '✓'} ${name}${r.error ? '  -> ' + r.error.message : ''}`);
      }
      const verdict = rd.runData['Parse AI Verdict']?.[0]?.data?.main?.[0]?.[0]?.json;
      if (verdict) {
        const { full_name, company, icp_score, tier, fit_summary, buying_signals, risks, recommended_action, email_subject, email_body, model, input_tokens, output_tokens } = verdict;
        console.log(`  --- ${full_name} @ ${company}: ${icp_score}/100 (${tier}) · ${model} · ${input_tokens}+${output_tokens} tokens`);
        console.log(`  Summary: ${fit_summary}`);
        console.log(`  Signals: ${buying_signals}`);
        console.log(`  Risks:   ${risks}`);
        console.log(`  Next:    ${recommended_action}`);
        console.log(`  Email:   ${email_subject}\n           ${String(email_body).replace(/\n/g, '\n           ')}`);
      }
    }
  },
);
