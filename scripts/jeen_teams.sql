-- ===========================================================================
-- Jeen / Ava — team-based multi-agent claims handling
-- Three real teams, each with a real mailbox that Ava notifies as part of the
-- workflow. Adds per-team logins (team_users) + an audit trail (claim_events)
-- so a claim can be seen "navigating the system" as it is handed between teams.
-- Idempotent: safe to re-run.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS jeen.team_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- md5(password), same scheme as admin_users
  full_name     TEXT NOT NULL,
  team          TEXT NOT NULL,          -- must match jeen.claims.team
  email         TEXT,                   -- real mailbox Ava sends handoff alerts to
  role          TEXT NOT NULL DEFAULT 'handler'
);
ALTER TABLE jeen.team_users ADD COLUMN IF NOT EXISTS email TEXT;

-- Reset to the three real teams Lee supplied real recipients for.
DELETE FROM jeen.team_users WHERE username IN ('siu','vulnerable','payments','complaints');

-- Demo password for all three: TeamAlbion2026!
INSERT INTO jeen.team_users (username, password_hash, full_name, team, email, role) VALUES
 ('adjuster', md5('TeamAlbion2026!'), 'Claims Adjuster', 'Claims Adjuster', 'send2chopstix@gmail.com',   'handler'),
 ('legal',    md5('TeamAlbion2026!'), 'Nisha Chopra',    'Legal',           'Nishachopra.uk@gmail.com',  'handler'),
 ('finance',  md5('TeamAlbion2026!'), 'Lee Akpareva',    'Finance',         'leeakpareva@gmail.com',     'handler')
ON CONFLICT (username) DO UPDATE
   SET password_hash = EXCLUDED.password_hash,
       full_name     = EXCLUDED.full_name,
       team          = EXCLUDED.team,
       email         = EXCLUDED.email;

-- Audit trail: every routing/handoff and every team action on a claim.
CREATE TABLE IF NOT EXISTS jeen.claim_events (
  id         SERIAL PRIMARY KEY,
  claim_ref  TEXT NOT NULL,
  team       TEXT,
  actor      TEXT,                       -- 'Ava' (the agent) or a team handler's name
  action     TEXT NOT NULL,              -- routed | approved | declined | paid | escalated | info-requested | appeal-upheld
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS claim_events_ref_idx ON jeen.claim_events (claim_ref, created_at);

SELECT username, team, email FROM jeen.team_users ORDER BY id;
