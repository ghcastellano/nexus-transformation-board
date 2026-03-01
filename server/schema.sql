CREATE TABLE IF NOT EXISTS companies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    board_state       JSONB NOT NULL DEFAULT '{}',
    agent_assignments JSONB NOT NULL DEFAULT '{}',
    active_drivers    JSONB NOT NULL DEFAULT '[]',
    cycle_number      INTEGER NOT NULL DEFAULT 1,
    cycle_phase       INTEGER NOT NULL DEFAULT 0,
    completed_phases  JSONB NOT NULL DEFAULT '[]',
    log_entries       JSONB NOT NULL DEFAULT '[]',
    custom_items      JSONB NOT NULL DEFAULT '[]',
    connections       JSONB NOT NULL DEFAULT '[]',
    board_markers     JSONB NOT NULL DEFAULT '[]',
    domain_definitions  JSONB NOT NULL DEFAULT '[]',
    experiment_results  JSONB NOT NULL DEFAULT '{}',
    practice_repetitions JSONB NOT NULL DEFAULT '{}',
    fitness_score       INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_company_id ON games(company_id);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at DESC);

-- Migrations for existing databases
ALTER TABLE games ADD COLUMN IF NOT EXISTS experiment_results JSONB NOT NULL DEFAULT '{}';
ALTER TABLE games ADD COLUMN IF NOT EXISTS practice_repetitions JSONB NOT NULL DEFAULT '{}';
