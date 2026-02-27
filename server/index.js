require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..')));

// ── Health ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Companies ──
app.get('/api/companies', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.*, COALESCE(g.cnt, 0)::int AS game_count
      FROM companies c
      LEFT JOIN (SELECT company_id, COUNT(*) AS cnt FROM games GROUP BY company_id) g
        ON g.company_id = c.id
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
  try {
    const { rows } = await db.query(
      'INSERT INTO companies (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

// ── Games ──
app.get('/api/companies/:companyId/games', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT id, company_id, name, description, fitness_score,
             cycle_number, cycle_phase, created_at, updated_at
      FROM games
      WHERE company_id = $1
      ORDER BY updated_at DESC
    `, [req.params.companyId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies/:companyId/games', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await db.query(
      'INSERT INTO games (company_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.params.companyId, name, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:gameId', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM games WHERE id = $1', [req.params.gameId]);
    if (!rows.length) return res.status(404).json({ error: 'Game not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/games/:gameId', async (req, res) => {
  const {
    board_state, agent_assignments, active_drivers,
    cycle_number, cycle_phase, completed_phases,
    log_entries, custom_items, fitness_score
  } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE games SET
        board_state = $1, agent_assignments = $2, active_drivers = $3,
        cycle_number = $4, cycle_phase = $5, completed_phases = $6,
        log_entries = $7, custom_items = $8, fitness_score = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING id, updated_at
    `, [
      JSON.stringify(board_state), JSON.stringify(agent_assignments),
      JSON.stringify(active_drivers), cycle_number, cycle_phase,
      JSON.stringify(completed_phases), JSON.stringify(log_entries),
      JSON.stringify(custom_items), fitness_score || 0,
      req.params.gameId
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Game not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/games/:gameId', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM games WHERE id = $1', [req.params.gameId]);
    if (!rowCount) return res.status(404).json({ error: 'Game not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nexus server running on http://localhost:${PORT}`));
