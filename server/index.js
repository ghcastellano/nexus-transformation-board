if (!process.env.VERCEL) require('dotenv').config();
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
    log_entries, custom_items, fitness_score,
    connections, board_markers, domain_definitions,
    experiment_results, practice_repetitions, transformation_horizons
  } = req.body;
  try {
    const { rows } = await db.query(`
      UPDATE games SET
        board_state = $1, agent_assignments = $2, active_drivers = $3,
        cycle_number = $4, cycle_phase = $5, completed_phases = $6,
        log_entries = $7, custom_items = $8, fitness_score = $9,
        connections = $10, board_markers = $11, domain_definitions = $12,
        experiment_results = $13, practice_repetitions = $14,
        transformation_horizons = $15,
        updated_at = NOW()
      WHERE id = $16
      RETURNING id, updated_at
    `, [
      JSON.stringify(board_state), JSON.stringify(agent_assignments),
      JSON.stringify(active_drivers), cycle_number, cycle_phase,
      JSON.stringify(completed_phases), JSON.stringify(log_entries),
      JSON.stringify(custom_items), fitness_score || 0,
      JSON.stringify(connections || []), JSON.stringify(board_markers || []),
      JSON.stringify(domain_definitions || []),
      JSON.stringify(experiment_results || {}), JSON.stringify(practice_repetitions || {}),
      JSON.stringify(transformation_horizons || {}),
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

// ── Capabilities Library ──
const SEED_CAPABILITIES = [
  { name: 'Portfolio Management', description: 'Focus on deciding where to invest resources to maximize strategic return.', practices: [
    { name: 'Value-Based Prioritization', description: 'Use methods like WSJF (Weighted Shortest Job First) to rank initiatives by business value.' },
    { name: 'Value Stream Mapping', description: 'Identify the major delivery streams of the organization and visualize end-to-end flow.' },
    { name: 'Strategic OKR Management', description: 'Connect global objectives with key results from each initiative.' },
    { name: 'Capacity Balancing', description: 'Adjust demand from new projects with the actual delivery capacity of teams.' }
  ]},
  { name: 'Product Management', description: 'Focus on discovering what to build and ensuring it solves a real user problem.', practices: [
    { name: 'Product Discovery', description: 'Conduct interviews and validate hypotheses with real users before building.' },
    { name: 'User Story Mapping', description: 'Visualize the user journey to slice deliveries into valuable increments.' },
    { name: 'MVP Definition', description: 'Identify the minimum viable product to test an idea in the market.' },
    { name: 'Backlog Refinement', description: 'Keep the product backlog clear, well-described, and prioritized.' }
  ]},
  { name: 'Data Architecture', description: 'Focus on how data is collected, stored, and made available — vital for AI and analytics.', practices: [
    { name: 'Data Modeling', description: 'Structure how data entities relate in the database for consistency and scalability.' },
    { name: 'Pipeline Construction (ETL/ELT)', description: 'Automate the extraction, transformation, and loading of data across systems.' },
    { name: 'Data Lake / Warehouse Structuring', description: 'Create centralized, scalable repositories for analytical workloads.' },
    { name: 'API-Based Integration', description: 'Establish smooth data communication between different systems via APIs.' }
  ]},
  { name: 'Data Governance', description: 'Focus on ensuring data is secure, accurate, and usable across the organization.', practices: [
    { name: 'Data Quality Management', description: 'Create rules and processes to prevent duplicate or incorrect data.' },
    { name: 'Access Control & Security', description: 'Define who can view or modify sensitive information.' },
    { name: 'Data Cataloging', description: 'Create a data dictionary so teams can easily find and understand available data.' },
    { name: 'Compliance & Privacy', description: 'Ensure data usage complies with regulations such as LGPD/GDPR.' }
  ]},
  { name: 'Agility', description: 'Focus on adaptability, iterative delivery, and cross-functional collaboration.', practices: [
    { name: 'Ceremony Facilitation', description: 'Lead planning, daily alignment, reviews, and retrospective meetings effectively.' },
    { name: 'Visual Work Management', description: 'Use Kanban boards to expose workflow, blockers, and WIP limits.' },
    { name: 'Iterative Development', description: 'Deliver value in short time-boxed cycles (Sprints) with working software each iteration.' },
    { name: 'Impediment Removal', description: 'Identify and eliminate blockers that prevent team flow and delivery.' }
  ]},
  { name: 'Lean Thinking', description: 'Focus on maximizing delivered value while minimizing waste.', practices: [
    { name: 'Root Cause Analysis (5 Whys)', description: 'Investigate the origin of problems rather than treating symptoms.' },
    { name: 'Waste Identification & Reduction (Muda)', description: 'Eliminate steps and activities that do not add value to the customer.' },
    { name: 'Pull System', description: 'Start new work only when there is available capacity downstream.' },
    { name: 'Kaizen', description: 'Promote a culture of continuous, incremental improvement at every level.' }
  ]},
  { name: 'Team Science', description: 'Focus on team dynamics, structure, and the psychology of collaborative work.', practices: [
    { name: 'Psychological Safety Building', description: 'Create an environment where mistakes are treated as learning opportunities.' },
    { name: 'Team Topology Design', description: 'Structure teams (platform, stream-aligned, enabling) to reduce cognitive load and friction.' },
    { name: 'Conflict Resolution', description: 'Facilitate difficult conversations and mediate between team members constructively.' },
    { name: 'Working Agreements', description: 'Define clear norms for collaboration, communication, and internal team processes.' }
  ]},
  { name: 'DevOps', description: 'Focus on unifying development and operations for fast, safe, and reliable software delivery.', practices: [
    { name: 'CI/CD (Continuous Integration & Delivery)', description: 'Automate code integration and production deployments to accelerate feedback loops.' },
    { name: 'Infrastructure as Code (IaC)', description: 'Manage servers and networks through versioned configuration files.' },
    { name: 'Monitoring & Observability', description: 'Configure alerts and dashboards to track system health and detect issues early.' },
    { name: 'Test Automation', description: 'Run automated test suites on every code change to catch regressions fast.' }
  ]},
  { name: 'UX (User Experience)', description: 'Focus on ensuring systems are intuitive, efficient, and pleasant to use.', practices: [
    { name: 'Wireframing & Prototyping', description: 'Design screens and flows before writing code to validate concepts cheaply.' },
    { name: 'Usability Testing', description: 'Observe real users attempting to complete tasks to uncover friction and confusion.' },
    { name: 'Persona Creation', description: 'Map profiles and behaviors of target users to guide design decisions.' },
    { name: 'Information Architecture', description: 'Organize menus and navigation to make information easy to find.' }
  ]},
  { name: 'Systems Thinking', description: 'Focus on understanding how parts of a system interact and affect the whole.', practices: [
    { name: 'Bottleneck Identification', description: 'Use Theory of Constraints to find and address the slowest point in the process.' },
    { name: 'Causal Loop Diagramming', description: 'Map how an action in one area impacts other areas over time.' },
    { name: 'Feedback Loop Analysis', description: 'Evaluate how information returns to improve or reinforce system behavior.' },
    { name: 'Global vs. Local Optimization', description: 'Avoid improving a single team if it degrades overall organizational flow.' }
  ]},
  { name: 'Management', description: 'Focus on daily operations, organizational health, and tactical execution.', practices: [
    { name: '1:1 Meetings', description: 'Regular one-on-one alignment conversations with direct reports to build trust.' },
    { name: 'Effective Delegation', description: 'Distribute tasks and responsibilities appropriate to each person\'s level.' },
    { name: 'Budget Management', description: 'Track costs and financial viability of teams and initiatives.' },
    { name: 'Business Metrics Tracking', description: 'Monitor KPIs to ensure operational health and early detection of issues.' }
  ]},
  { name: 'People Development', description: 'Focus on professional growth and acquisition of new skills across the organization.', practices: [
    { name: 'Mentoring & Strategic Coaching', description: 'Help professionals unlock their potential and grow in their careers.' },
    { name: 'Skill Gap Mapping', description: 'Identify what the team needs to learn to close competency gaps.' },
    { name: 'Individual Development Plans (IDP)', description: 'Set study and evolution goals for each person aligned with strategic needs.' },
    { name: 'Continuous Feedback Cycles', description: 'Provide frequent, constructive evaluations to accelerate learning.' }
  ]},
  { name: 'Change Management', description: 'Focus on leading the organization through transformations while minimizing friction.', practices: [
    { name: 'Stakeholder Mapping', description: 'Identify who influences and who is impacted by the change initiative.' },
    { name: 'Communication Planning', description: 'Structure how and when information will be shared throughout the change.' },
    { name: 'Resistance Management', description: 'Identify and address objections and fears from impacted teams.' },
    { name: 'Transition Model Application', description: 'Use frameworks like ADKAR to guide adoption of new practices and behaviors.' }
  ]},
  { name: 'Project Management', description: 'Focus on ensuring a bounded initiative with a start, middle, and end is delivered successfully.', practices: [
    { name: 'Risk Management', description: 'Map threats to the project and create mitigation plans proactively.' },
    { name: 'Scope Control', description: 'Prevent uncontrolled growth in project scope (scope creep).' },
    { name: 'Resource Allocation', description: 'Ensure the right people are available at the right time.' },
    { name: 'Schedule Tracking', description: 'Control deadlines and report progress status to stakeholders.' }
  ]}
];

async function seedCapabilitiesIfEmpty() {
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM capabilities');
    if (parseInt(rows[0].count) > 0) return;
    for (let i = 0; i < SEED_CAPABILITIES.length; i++) {
      const cap = SEED_CAPABILITIES[i];
      const { rows: cr } = await db.query(
        'INSERT INTO capabilities (name, description, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [cap.name, cap.description, i + 1]
      );
      const capId = cr[0].id;
      for (let j = 0; j < cap.practices.length; j++) {
        const p = cap.practices[j];
        await db.query(
          'INSERT INTO practices (capability_id, name, description, sort_order) VALUES ($1, $2, $3, $4)',
          [capId, p.name, p.description, j + 1]
        );
      }
    }
    console.log('Capabilities library seeded with', SEED_CAPABILITIES.length, 'capabilities');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

app.get('/api/capabilities', async (req, res) => {
  try {
    const caps = await db.query('SELECT * FROM capabilities ORDER BY sort_order, name');
    const pracs = await db.query('SELECT * FROM practices ORDER BY capability_id, sort_order, name');
    const result = caps.rows.map(c => ({
      ...c,
      practices: pracs.rows.filter(p => p.capability_id === c.id)
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/capabilities', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await db.query(
      'INSERT INTO capabilities (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json({ ...rows[0], practices: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/capabilities/:id', async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE capabilities SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/capabilities/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM capabilities WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/capabilities/:capId/practices', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await db.query(
      'INSERT INTO practices (capability_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.params.capId, name, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/practices/:id', async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE practices SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/practices/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM practices WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Start (local dev) or export for Vercel ──
if (process.env.VERCEL) {
  seedCapabilitiesIfEmpty();
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`Nexus server running on http://localhost:${PORT}`);
    await seedCapabilitiesIfEmpty();
  });
}
