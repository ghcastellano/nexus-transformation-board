// generate-pptx.js — Nexus Transformation Board PPTX Generator
const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();

// ── Color blending helper (pptxgenjs only supports 6-digit hex) ──────────────
// Blend a hex color with the dark background so alpha looks work
const BG_R = 0x0f, BG_G = 0x12, BG_B = 0x18;
function blend(hex, opacity) {
  // opacity 0–1
  const r1 = parseInt(hex.slice(0,2),16), g1 = parseInt(hex.slice(2,4),16), b1 = parseInt(hex.slice(4,6),16);
  const r = Math.round(r1*opacity + BG_R*(1-opacity));
  const g = Math.round(g1*opacity + BG_G*(1-opacity));
  const b = Math.round(b1*opacity + BG_B*(1-opacity));
  return r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
}
// Pre-built tints used throughout
function t20(c){ return blend(c, 0.20); }
function t30(c){ return blend(c, 0.30); }
function t40(c){ return blend(c, 0.40); }
function t55(c){ return blend(c, 0.55); }
function t22(c){ return blend(c, 0.133); }
function t66(c){ return blend(c, 0.400); }
function taa(c){ return blend(c, 0.667); }
function tcc(c){ return blend(c, 0.800); }
function tbb(c){ return blend(c, 0.733); }
function t99(c){ return blend(c, 0.600); }
function t33(c){ return blend(c, 0.200); }
function t44(c){ return blend(c, 0.267); }
function t88(c){ return blend(c, 0.533); }
function t70(c){ return blend(c, 0.70); }

// ── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '0f1218',
  surface:  '171c24',
  surface2: '1e2430',
  border:   '2a3140',
  text:     'e8ecf1',
  muted:    '7d8694',
  accent:   '4a90d9',
  blue:     '2c3e6b',
  blueLt:   '3a5a9c',
  green:    '2d9d5e',
  greenLt:  '3dbd74',
  red:      'd94a4a',
  orange:   'e8943a',
  purple:   '7b5ea7',
  cyan:     '38b2a0',
  gray:     '8b949e',
  white:    'FFFFFF',
};

pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
pptx.theme  = { headFontFace: 'Segoe UI', bodyFontFace: 'Segoe UI' };
pptx.defineLayout({ name:'WIDE', width:13.33, height:7.5 });
pptx.layout = 'WIDE';

// ── Helpers ──────────────────────────────────────────────────────────────────
function addBg(slide) {
  slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.bg } });
}

function addTitle(slide, text, y=0.35, fontSize=28) {
  slide.addText(text, {
    x:0.4, y, w:12.5, h:0.65,
    fontSize, bold:true, color: C.text, fontFace:'Segoe UI',
    align:'left',
  });
}

function addSubtitle(slide, text, y=0.95, fontSize=13) {
  slide.addText(text, {
    x:0.4, y, w:12.5, h:0.4,
    fontSize, color: C.muted, fontFace:'Segoe UI',
    align:'left',
  });
}

function accentBar(slide, color=C.accent) {
  slide.addShape(pptx.ShapeType.rect, { x:0.4, y:0.28, w:0.06, h:0.55, fill:{ color } });
}

function sectionDivider(slide, text, color=C.accent, y=1.35) {
  slide.addShape(pptx.ShapeType.rect, { x:0.4, y, w:12.5, h:0.01, fill:{ color } });
  slide.addText(text, { x:0.4, y:y+0.05, w:12.5, h:0.3, fontSize:9, color, bold:true, charSpacing:2, fontFace:'Segoe UI', align:'left' });
}

function card(slide, x, y, w, h, opts={}) {
  const { fillColor=C.surface2, borderColor=C.border, radius=0.08 } = opts;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill:{ color: fillColor },
    line:{ color: borderColor, width:1 },
    rectRadius: radius,
  });
}

function hexBadge(slide, x, y, label, color) {
  slide.addShape(pptx.ShapeType.hexagon, {
    x, y, w:0.36, h:0.32,
    fill:{ color },
    line:{ color, width:0 },
  });
  slide.addText(label, { x, y:y+0.06, w:0.36, h:0.2, fontSize:7, bold:true, color:C.white, align:'center', fontFace:'Segoe UI' });
}

function pill(slide, x, y, text, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: text.length * 0.078 + 0.2, h:0.22,
    fill:{ color: t22(color) },
    line:{ color, width:1 },
    rectRadius:0.11,
  });
  slide.addText(text, { x, y:y+0.03, w: text.length * 0.078 + 0.2, h:0.16, fontSize:7, color, bold:true, align:'center', fontFace:'Segoe UI' });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);

  // Gradient‑ish diagonal accent block
  s.addShape(pptx.ShapeType.rect, { x:8.8, y:0, w:4.53, h:7.5, fill:{ color:'171c24' } });
  s.addShape(pptx.ShapeType.rect, { x:9.5, y:0, w:3.83, h:7.5, fill:{ color:'1e2430' } });

  // Big hex cluster decoration
  const hexColors = [C.blueLt, C.orange, C.gray, C.purple, C.cyan, C.green];
  const hexPos = [[9.6,0.4],[10.4,1.0],[11.2,0.4],[10.0,2.0],[11.6,1.6],[10.8,2.8]];
  hexPos.forEach(([hx,hy],i) => {
    s.addShape(pptx.ShapeType.hexagon, { x:hx, y:hy, w:1.1, h:0.96,
      fill:{ color: t55(hexColors[i]) }, line:{ color: hexColors[i], width:1 } });
  });

  // Tag line
  s.addText('Enterprise Transformation Codex', {
    x:0.6, y:1.8, w:7.5, h:0.4,
    fontSize:11, color:C.cyan, bold:true, charSpacing:3, fontFace:'Segoe UI',
  });

  // Main title
  s.addText('Nexus Transformation\nBoard', {
    x:0.6, y:2.2, w:8.0, h:2.0,
    fontSize:44, bold:true, color:C.text, fontFace:'Segoe UI', lineSpacingMultiple:1.1,
  });

  // Subtitle
  s.addText('A strategic sensemaking game for organizational transformation.\nMap patterns, replace anti-patterns, assign agents, and\nnavigate toward adaptive fitness.', {
    x:0.6, y:4.3, w:8.2, h:1.2,
    fontSize:14, color:C.muted, fontFace:'Segoe UI', lineSpacingMultiple:1.5,
  });

  // Footer
  s.addText('Based on the Enterprise Transformation Codex — NTT DATA DS&A USA', {
    x:0.6, y:6.9, w:10, h:0.3,
    fontSize:9, color:t55(C.muted), fontFace:'Segoe UI',
  });

  // Version dot
  s.addShape(pptx.ShapeType.ellipse, { x:0.6, y:1.72, w:0.08, h:0.08, fill:{ color:C.cyan } });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 2 — THE MODEL AT A GLANCE
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.cyan);
  addTitle(s, 'The Model at a Glance');
  addSubtitle(s, 'Organizational transformation is a journey through patterns — not a project with an end date.');

  // 4 principle cards
  const principles = [
    { icon:'🧭', title:'Context Over Formula', body:'There is no universal best practice. The right pattern depends on your context, culture, and current fitness level.', color:C.accent },
    { icon:'♾️', title:'No End State', body:'Transformation is continuous. Success is measured by rising fitness — not by reaching a fixed destination.', color:C.cyan },
    { icon:'🧬', title:'Habit Change First', body:'Real transformation = sustained behavior change. Structure follows culture, not the other way around.', color:C.green },
    { icon:'🛡️', title:'Respect the Immune System', body:'Organizations resist large-scale change. Work with the grain — use safe-to-fail experiments, not mandates.', color:C.purple },
  ];

  principles.forEach((p, i) => {
    const x = 0.4 + i * 3.13;
    card(s, x, 1.7, 3.0, 2.8, { fillColor: C.surface2, borderColor: t55(p.color) });
    s.addShape(pptx.ShapeType.rect, { x, y:1.7, w:3.0, h:0.06, fill:{ color: p.color } });
    s.addText(p.icon, { x, y:1.85, w:3.0, h:0.6, fontSize:28, align:'center' });
    s.addText(p.title, { x:x+0.15, y:2.5, w:2.7, h:0.35, fontSize:12, bold:true, color:p.color, fontFace:'Segoe UI', align:'center' });
    s.addText(p.body, { x:x+0.15, y:2.9, w:2.7, h:1.4, fontSize:9.5, color:C.muted, fontFace:'Segoe UI', align:'center', lineSpacingMultiple:1.4 });
  });

  // Bottom callout
  card(s, 0.4, 4.65, 12.5, 0.8, { fillColor:'1e2430', borderColor:t30(C.accent) });
  s.addText('💡', { x:0.7, y:4.75, w:0.5, h:0.6, fontSize:18, align:'center' });
  s.addText('The Nexus Board makes the invisible visible — surfacing patterns, blockers, and transformation vectors that live in the organizational system.', {
    x:1.3, y:4.83, w:11.2, h:0.55, fontSize:11, color:C.text, fontFace:'Segoe UI', italic:true,
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 3 — THE BOARD: ZONES & LANES
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.accent);
  addTitle(s, 'The Board — 3 Zones × 2 Lanes');
  addSubtitle(s, 'Each hexagon sits in a zone (left→right) and a lane (top/bottom). Position encodes organizational meaning.');

  // Board visual
  const zones = [
    { label:'◀ Current Reality', color:C.red,    x:0.4,  desc:'Where anti-patterns live.\nConstraints, inertia, legacy habits\nthat block progress.' },
    { label:'⟷ Transformation Path', color:C.orange, x:4.75, desc:'Transitional space for experiments,\nbridges, and safe-to-fail\nlearning.' },
    { label:'Improved Fitness ▶', color:C.green,  x:9.1,  desc:'Enabling patterns and adaptive\ncapacity. The direction\nof travel.' },
  ];

  zones.forEach(z => {
    card(s, z.x, 1.55, 4.2, 4.3, { fillColor:t70(C.surface), borderColor:t66(z.color) });
    s.addShape(pptx.ShapeType.rect, { x:z.x, y:1.55, w:4.2, h:0.05, fill:{ color:z.color } });
    s.addText(z.label, { x:z.x, y:1.6, w:4.2, h:0.4, fontSize:10.5, bold:true, color:z.color, align:'center', fontFace:'Segoe UI' });
    s.addText(z.desc, { x:z.x+0.2, y:2.05, w:3.8, h:0.9, fontSize:9, color:C.muted, align:'center', fontFace:'Segoe UI', lineSpacingMultiple:1.4 });

    // Lane divider line inside zone
    s.addShape(pptx.ShapeType.line, { x:z.x+0.2, y:3.2, w:3.8, h:0, line:{ color:C.border, width:1, dashType:'dash' } });

    // Lane labels
    s.addText('Strategic', { x:z.x+0.2, y:3.0, w:3.8, h:0.2, fontSize:8, color:C.cyan, bold:true, align:'center', charSpacing:1.5 });
    s.addText('Intent · Meaning · Why leadership cares', { x:z.x+0.2, y:2.9, w:3.8, h:0.2, fontSize:7, color:t55(C.cyan), align:'center' });
    s.addText('Operational', { x:z.x+0.2, y:3.25, w:3.8, h:0.2, fontSize:8, color:C.orange, bold:true, align:'center', charSpacing:1.5 });
    s.addText('Structure · Process · Daily habits', { x:z.x+0.2, y:3.43, w:3.8, h:0.2, fontSize:7, color:t55(C.orange), align:'center' });

    // Sample hex cells
    const hexFills = z.color === C.red ? [C.orange, C.orange] : z.color === C.orange ? [C.gray, C.blueLt] : [C.blueLt, C.blueLt];
    hexFills.forEach((hc, hi) => {
      const hx = z.x + 0.4 + hi * 1.7;
      const hy = hi === 0 ? 3.75 : 3.95;
      s.addShape(pptx.ShapeType.hexagon, { x:hx, y:hy, w:1.3, h:1.1, fill:{ color:taa(hc) }, line:{ color:hc, width:1 } });
    });
  });

  // Direction arrow
  s.addShape(pptx.ShapeType.rightArrow, { x:0.4, y:6.15, w:12.5, h:0.35, fill:{ color:t20(C.accent) }, line:{ color:C.accent, width:1 } });
  s.addText('Direction of Transformation →', { x:0.4, y:6.18, w:12.5, h:0.28, fontSize:10, color:C.accent, bold:true, align:'center' });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 4 — THE THREE HEX TYPES
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.purple);
  addTitle(s, 'The Three Hexagon Types');
  addSubtitle(s, 'Every element on the board is a hexagon. Type determines its role in the transformation story.');

  const types = [
    {
      label:'Pattern',
      color: C.blueLt,
      icon:'⬡',
      tagline:'Enabling Behaviors',
      desc:'Organizational habits and practices that increase adaptive fitness.\nPatterns are the destination — they represent how high-performing\norganizations behave in a given domain.',
      signal:'How you recognize it: teams operate this way naturally',
      impact:'What it enables: increased speed, trust, resilience, or learning',
      examples:['Focus on User Needs','Stable Teams','Distribute Power','Safe-to-Fail Experiments'],
    },
    {
      label:'Anti-Pattern',
      color: C.orange,
      icon:'⬡',
      tagline:'Constraining Behaviors',
      desc:'Organizational habits that limit adaptive capacity.\nAnti-patterns are the starting point — they are not "bad people" but\nsystemic habits that made sense once and now hold the org back.',
      signal:'How you recognize it: repeating friction, slow decisions, fear',
      impact:'What it blocks: learning, speed, trust, or strategic clarity',
      examples:['Big Bang Change','Hero Leadership','Priority Inflation','Governance Theater'],
    },
    {
      label:'Transition Pattern',
      color: C.gray,
      icon:'⬡',
      tagline:'Safe Bridges',
      desc:'Intermediate moves that bridge from an anti-pattern to a pattern.\nTransition patterns are safe-to-fail experiments — low commitment,\nhigh learning, reversible.',
      signal:'How you recognize it: a temporary practice that shifts behavior',
      impact:'What it enables: safer migration, lower immune-system reaction',
      examples:['Protected Sandbox','Opt-In Participation','Visible Wins Broadcasting','Pattern Sampling'],
    },
  ];

  types.forEach((t, i) => {
    const x = 0.4 + i * 4.3;
    card(s, x, 1.5, 4.1, 5.5, { fillColor:C.surface2, borderColor:t66(t.color) });
    s.addShape(pptx.ShapeType.rect, { x, y:1.5, w:4.1, h:0.055, fill:{ color:t.color } });

    // Hex icon
    s.addShape(pptx.ShapeType.hexagon, { x:x+1.5, y:1.6, w:1.1, h:0.96, fill:{ color:tcc(t.color) }, line:{ color:t.color, width:1.5 } });
    s.addText(t.icon, { x:x+1.5, y:1.78, w:1.1, h:0.6, fontSize:18, color:C.white, align:'center', bold:true });

    s.addText(t.label, { x:x+0.15, y:2.65, w:3.8, h:0.38, fontSize:16, bold:true, color:t.color, align:'center', fontFace:'Segoe UI' });
    s.addText(t.tagline.toUpperCase(), { x:x+0.15, y:3.0, w:3.8, h:0.25, fontSize:8, color:tbb(t.color), align:'center', charSpacing:1.5 });

    s.addText(t.desc, { x:x+0.2, y:3.3, w:3.7, h:1.1, fontSize:8.5, color:C.muted, align:'left', fontFace:'Segoe UI', lineSpacingMultiple:1.4 });

    // Examples
    s.addText('EXAMPLES', { x:x+0.2, y:4.45, w:3.7, h:0.22, fontSize:7.5, color:t.color, bold:true, charSpacing:1 });
    t.examples.forEach((ex, ei) => {
      s.addShape(pptx.ShapeType.ellipse, { x:x+0.25, y:4.73+ei*0.32, w:0.07, h:0.07, fill:{ color:t.color } });
      s.addText(ex, { x:x+0.38, y:4.68+ei*0.32, w:3.5, h:0.25, fontSize:9, color:C.text, fontFace:'Segoe UI' });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 5 — THE 5 DOMAINS
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.orange);
  addTitle(s, 'The 5 Transformation Domains');
  addSubtitle(s, 'Patterns, Anti-Patterns, and Transitions are classified by domain. Each domain has its own transformation dynamics.');

  const domains = [
    { name:'Strategy & Portfolio', color:C.accent,  icon:'🎯', count:'10P · 7A · 5T', desc:'How the organization makes choices — investment logic, portfolio governance, strategic rhythm, and the ability to course-correct at scale.' },
    { name:'Product & Delivery',   color:C.green,   icon:'🚀', count:'8P · 6A · 4T', desc:'How teams build and ship — flow, cycle time, feedback loops, experiments, team stability, and the balance between speed and quality.' },
    { name:'Technology & Architecture', color:C.cyan, icon:'⚙️', count:'4P · 2A · 1T', desc:'How technology enables or constrains change — architectural decisions, standards, tooling choices, and readiness for continuous evolution.' },
    { name:'People, Culture & Governance', color:C.purple, icon:'🧑‍🤝‍🧑', count:'12P · 8A · 10T', desc:'How people and systems interact — power distribution, psychological safety, culture diversity, meaning-making, and governance design.' },
    { name:'Operations', color:C.orange, icon:'🔧', count:'Cross-cutting', desc:'How the organization runs day-to-day — operational habits, tooling adoption, process changes that support or block the transformation.' },
  ];

  domains.forEach((d, i) => {
    const row = i < 3 ? 0 : 1;
    const col = i < 3 ? i : i - 3;
    const x = 0.4 + col * 4.3 + (row === 1 ? 2.15 : 0);
    const y = 1.55 + row * 2.75;
    const w = row === 1 ? 4.1 : 4.1;

    card(s, x, y, w, 2.4, { fillColor:C.surface2, borderColor:t55(d.color) });
    s.addShape(pptx.ShapeType.rect, { x, y, w, h:0.055, fill:{ color:d.color } });
    s.addText(d.icon, { x, y:y+0.1, w, h:0.55, fontSize:22, align:'center' });
    s.addText(d.name, { x:x+0.15, y:y+0.68, w:w-0.3, h:0.38, fontSize:11, bold:true, color:d.color, align:'center', fontFace:'Segoe UI' });
    s.addText(d.count, { x:x+0.15, y:y+1.04, w:w-0.3, h:0.22, fontSize:8, color:t99(d.color), align:'center', charSpacing:0.5 });
    s.addText(d.desc, { x:x+0.2, y:y+1.28, w:w-0.4, h:0.95, fontSize:8, color:C.muted, fontFace:'Segoe UI', lineSpacingMultiple:1.35 });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 6 — PATTERNS CATALOG
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.blueLt);
  addTitle(s, 'Pattern Catalog', 0.3, 22);
  addSubtitle(s, '30 enabling behaviors across 5 domains — the north star for organizational transformation.', 0.9, 11);

  const domainColors = { 'Strategy & Portfolio': C.accent, 'Product & Delivery': C.green, 'Technology & Architecture': C.cyan, 'People, Culture & Governance': C.purple, 'Operations': C.orange };

  const PATTERNS = [
    {name:'Focus on User Needs',domain:'Strategy & Portfolio'},{name:'Strategy is Iterative',domain:'Strategy & Portfolio'},{name:'Use Common Language',domain:'Strategy & Portfolio'},{name:'Challenge Assumptions',domain:'Strategy & Portfolio'},{name:'Context Determines Pattern',domain:'Strategy & Portfolio'},{name:'Portfolio as Value Flow',domain:'Strategy & Portfolio'},
    {name:'Think Small',domain:'Product & Delivery'},{name:'Optimize Flow',domain:'Product & Delivery'},{name:'Move Fast',domain:'Product & Delivery'},{name:'Effectiveness over Efficiency',domain:'Product & Delivery'},{name:'Manage Failure',domain:'Product & Delivery'},{name:'Stable Teams',domain:'Product & Delivery'},{name:'Feedback Loops',domain:'Product & Delivery'},
    {name:'Use Appropriate Methods',domain:'Technology & Architecture'},{name:'Design for Evolution',domain:'Technology & Architecture'},{name:'Set Exceptional Standards',domain:'Technology & Architecture'},{name:'Bias Towards Action',domain:'Technology & Architecture'},
    {name:'Distribute Power',domain:'People, Culture & Governance'},{name:'Provide Purpose & Autonomy',domain:'People, Culture & Governance'},{name:'Be Transparent',domain:'People, Culture & Governance'},{name:'No One Culture',domain:'People, Culture & Governance'},{name:'Be Humble',domain:'People, Culture & Governance'},{name:'Learning as a Habit',domain:'People, Culture & Governance'},{name:'Meaning Drives Adoption',domain:'People, Culture & Governance'},{name:'Transformation = Habit Change',domain:'People, Culture & Governance'},
    {name:'Stability Enables Change',domain:'Strategy & Portfolio'},{name:'Intensity > Speed',domain:'Strategy & Portfolio'},{name:'No End State',domain:'Strategy & Portfolio'},{name:'Safe-to-Fail Experiments',domain:'Product & Delivery'},{name:'Course Correction',domain:'Strategy & Portfolio'},
  ];

  // Group by domain
  const grouped = {};
  PATTERNS.forEach(p => { if (!grouped[p.domain]) grouped[p.domain] = []; grouped[p.domain].push(p.name); });

  const cols = [
    { domain:'Strategy & Portfolio',        x:0.4  },
    { domain:'Product & Delivery',          x:3.0  },
    { domain:'Technology & Architecture',   x:5.6  },
    { domain:'People, Culture & Governance',x:8.2  },
  ];

  cols.forEach(col => {
    const items = grouped[col.domain] || [];
    const color = domainColors[col.domain];
    s.addShape(pptx.ShapeType.rect, { x:col.x, y:1.55, w:2.5, h:0.04, fill:{ color } });
    s.addText(col.domain, { x:col.x, y:1.6, w:2.5, h:0.28, fontSize:8.5, bold:true, color, charSpacing:0.3 });
    items.forEach((name, ni) => {
      const y = 1.95 + ni * 0.38;
      card(s, col.x, y, 2.5, 0.32, { fillColor:C.surface2, borderColor:t33(color) });
      s.addShape(pptx.ShapeType.hexagon, { x:col.x+0.06, y:y+0.04, w:0.22, h:0.19, fill:{ color:C.blueLt }, line:{ color:C.blueLt, width:0 } });
      s.addText(name, { x:col.x+0.35, y:y+0.06, w:2.1, h:0.22, fontSize:8.5, color:C.text, fontFace:'Segoe UI' });
    });
  });

  // 5th domain (Operations) — footer note
  s.addText('Operations domain: cross-cutting patterns span multiple domains above.', {
    x:10.85, y:1.6, w:2.25, h:0.6, fontSize:8, color:C.muted, fontFace:'Segoe UI', lineSpacingMultiple:1.3,
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 7 — ANTI-PATTERNS CATALOG
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.orange);
  addTitle(s, 'Anti-Pattern Catalog', 0.3, 22);
  addSubtitle(s, '25 constraining behaviors that block organizational adaptation — start here to map Current Reality.', 0.9, 11);

  const ANTIPATTERNS = [
    {name:'Big Bang Change',domain:'Strategy & Portfolio'},{name:'Copy-Paste Transformation',domain:'Strategy & Portfolio'},{name:'Priority Inflation',domain:'Strategy & Portfolio'},{name:'Speed Over Intensity',domain:'Strategy & Portfolio'},{name:'Declaring End State',domain:'Strategy & Portfolio'},{name:'Portfolio as Inventory',domain:'Strategy & Portfolio'},{name:'Change Without Anchors',domain:'Strategy & Portfolio'},
    {name:'Ritualistic Agility',domain:'Product & Delivery'},{name:'Scaling Before Learning',domain:'Product & Delivery'},{name:'Feedback Without Action',domain:'Product & Delivery'},{name:'Local Optimization',domain:'Product & Delivery'},{name:'Unstable Teams',domain:'Product & Delivery'},
    {name:'Change Without Arch Readiness',domain:'Technology & Architecture'},{name:'Safety Sacrificed for Speed',domain:'Technology & Architecture'},
    {name:'Hero Leadership',domain:'People, Culture & Governance'},{name:'Governance Theater',domain:'People, Culture & Governance'},{name:'Universal Change Mandate',domain:'People, Culture & Governance'},{name:'Treating Orgs as Machines',domain:'People, Culture & Governance'},{name:'Expert Dependency',domain:'People, Culture & Governance'},{name:'Ignoring Power Dynamics',domain:'People, Culture & Governance'},{name:'Blame-Driven Accountability',domain:'People, Culture & Governance'},{name:'Cosmetic Empowerment',domain:'People, Culture & Governance'},{name:'Change Without Meaning',domain:'People, Culture & Governance'},{name:'Ignoring Immune System',domain:'People, Culture & Governance'},{name:'Over-Standardized Teams',domain:'People, Culture & Governance'},
  ];

  const domainColors = { 'Strategy & Portfolio':C.accent, 'Product & Delivery':C.green, 'Technology & Architecture':C.cyan, 'People, Culture & Governance':C.purple };
  const grouped = {};
  ANTIPATTERNS.forEach(p => { if (!grouped[p.domain]) grouped[p.domain] = []; grouped[p.domain].push(p.name); });

  const cols = [
    { domain:'Strategy & Portfolio',         x:0.4 },
    { domain:'Product & Delivery',           x:3.5 },
    { domain:'Technology & Architecture',    x:6.6 },
    { domain:'People, Culture & Governance', x:9.5 },
  ];

  cols.forEach(col => {
    const items = grouped[col.domain] || [];
    const color = domainColors[col.domain];
    const colW = col.domain === 'People, Culture & Governance' ? 3.5 : 2.8;
    s.addShape(pptx.ShapeType.rect, { x:col.x, y:1.55, w:colW, h:0.04, fill:{ color } });
    s.addText(col.domain, { x:col.x, y:1.6, w:colW, h:0.28, fontSize:8.5, bold:true, color, charSpacing:0.3 });
    items.forEach((name, ni) => {
      const y = 1.95 + ni * 0.37;
      card(s, col.x, y, colW, 0.31, { fillColor:'1e2430', borderColor:t20(C.orange) });
      s.addShape(pptx.ShapeType.hexagon, { x:col.x+0.06, y:y+0.04, w:0.22, h:0.19, fill:{ color:C.orange }, line:{ color:C.orange, width:0 } });
      s.addText(name, { x:col.x+0.35, y:y+0.05, w:colW-0.42, h:0.24, fontSize:8.5, color:C.text, fontFace:'Segoe UI' });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 8 — TRANSITION PATTERNS CATALOG
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.gray);
  addTitle(s, 'Transition Pattern Catalog', 0.3, 22);
  addSubtitle(s, '20 safe bridges that enable movement from Anti-Patterns toward Patterns — low commitment, high learning.', 0.9, 11);

  const TRANSITIONS = [
    {name:'Opt-In Participation',signal:'Voluntary involvement',impact:'Reduces resistance'},
    {name:'Protected Sandbox',signal:'Isolated safe environment',impact:'Low-risk experimentation'},
    {name:'Visible Wins Broadcasting',signal:'Successes shared widely',impact:'Builds momentum'},
    {name:'Hypothesis-Driven Change',signal:'Explicit hypotheses tested',impact:'Evidence-based decisions'},
    {name:'Community of Practice',signal:'Cross-team learning groups',impact:'Organic knowledge spread'},
    {name:'Pull-Based Scaling',signal:'Teams request, not imposed',impact:'Demand-driven growth'},
    {name:'Evidence Walls',signal:'Data visible to all',impact:'Transparent progress'},
    {name:'Parallel Run',signal:'Old and new coexist',impact:'Safe migration'},
    {name:'Shadow Decision Mapping',signal:'Decisions traced to authority',impact:'Power dynamics revealed'},
    {name:'Influencer Seeding',signal:'Key people engaged first',impact:'Social legitimacy'},
    {name:'Reframing Without Renaming',signal:'Same terms, new meaning',impact:'Less identity threat'},
    {name:'Pattern Sampling',signal:'Try before committing',impact:'Lower adoption barrier'},
    {name:'Min Viable Governance',signal:'Lightest governance that works',impact:'Speed with control'},
    {name:'Legacy Respect Mapping',signal:'Old system value recognized',impact:'Less defensive reaction'},
    {name:'Story Before Structure',signal:'Narrative leads, not org chart',impact:'Meaningful change'},
    {name:'Time-Boxed Exception',signal:'Temporary relaxation of rules',impact:'Safe experimentation window'},
    {name:'Capability Seeding',signal:'Small capability investments',impact:'Foundation for future'},
    {name:'Learning Probes',signal:'Small investigative experiments',impact:'Data before commitment'},
    {name:'Role Authority Trials',signal:'Temporary authority shifts',impact:'Test new decision models'},
    {name:'Identity Continuity',signal:'Change framed as evolution',impact:'Identity preserved'},
  ];

  const cols = 4;
  const perCol = Math.ceil(TRANSITIONS.length / cols);
  const colW = 3.05;

  for (let c = 0; c < cols; c++) {
    const x = 0.4 + c * 3.23;
    const items = TRANSITIONS.slice(c * perCol, (c+1) * perCol);
    items.forEach((t, i) => {
      const y = 1.55 + i * 1.38;
      card(s, x, y, colW, 1.25, { fillColor:C.surface2, borderColor:t30(C.gray) });
      s.addShape(pptx.ShapeType.rect, { x, y, w:colW, h:0.04, fill:{ color:C.gray } });
      s.addShape(pptx.ShapeType.hexagon, { x:x+0.08, y:y+0.1, w:0.55, h:0.48, fill:{ color:t30(C.gray) }, line:{ color:C.gray, width:1 } });
      s.addText(t.name, { x:x+0.72, y:y+0.08, w:colW-0.8, h:0.35, fontSize:9.5, bold:true, color:C.text, fontFace:'Segoe UI', lineSpacingMultiple:1.1 });
      s.addText('Signal: ' + t.signal, { x:x+0.12, y:y+0.64, w:colW-0.2, h:0.25, fontSize:8, color:C.cyan, fontFace:'Segoe UI' });
      s.addText('Impact: ' + t.impact, { x:x+0.12, y:y+0.9, w:colW-0.2, h:0.25, fontSize:8, color:C.green, fontFace:'Segoe UI' });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 9 — THE MOBIUS CYCLE
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.cyan);
  addTitle(s, 'The Möbius Cycle');
  addSubtitle(s, 'Five continuous phases guide transformation activity. No beginning, no end — a perpetual learning loop.');

  const phases = [
    { n:'Sense',      i:'👁',  d:'Observe signals, friction, and bottlenecks in the system. Surface what is actually happening.', color:C.accent,  x:1.0 },
    { n:'Focus',      i:'🎯',  d:'Pick a few habit shifts. Limit scope to what can actually be absorbed. Intensity over speed.', color:C.cyan,    x:3.6 },
    { n:'Experiment', i:'🧪',  d:'Run small, safe-to-fail change blocks. Test hypotheses. Create reversible probes.', color:C.green,   x:6.2 },
    { n:'Stabilize',  i:'🔒',  d:'Lock what works. Codify minimally. Protect gains before spreading further.', color:C.orange,  x:8.8 },
    { n:'Diffuse',    i:'🌊',  d:'Storytelling, peer adoption, and pull. Let the system request what works.', color:C.purple,  x:11.4 },
  ];

  // Connecting line
  s.addShape(pptx.ShapeType.line, { x:1.45, y:3.9, w:10.5, h:0, line:{ color:C.border, width:2, dashType:'dash' } });

  phases.forEach((p, i) => {
    const cx = p.x;
    // Arrow connector
    if (i < phases.length - 1) {
      s.addShape(pptx.ShapeType.rightArrow, { x:cx+1.7, y:3.78, w:0.9, h:0.25, fill:{ color:t55(p.color) }, line:{ color:p.color, width:1 } });
    }
    // Phase card
    card(s, cx-0.2, 2.0, 2.2, 3.7, { fillColor:C.surface2, borderColor:t55(p.color) });
    s.addShape(pptx.ShapeType.rect, { x:cx-0.2, y:2.0, w:2.2, h:0.055, fill:{ color:p.color } });
    // Number badge
    s.addShape(pptx.ShapeType.ellipse, { x:cx+0.68, y:2.1, w:0.46, h:0.46, fill:{ color:t44(p.color) }, line:{ color:p.color, width:1.5 } });
    s.addText(`${i+1}`, { x:cx+0.68, y:2.16, w:0.46, h:0.34, fontSize:14, bold:true, color:p.color, align:'center' });
    s.addText(p.i, { x:cx-0.2, y:2.65, w:2.2, h:0.55, fontSize:24, align:'center' });
    s.addText(p.n, { x:cx-0.1, y:3.25, w:2.0, h:0.35, fontSize:14, bold:true, color:p.color, align:'center', fontFace:'Segoe UI' });
    s.addText(p.d, { x:cx-0.1, y:3.65, w:2.0, h:1.8, fontSize:8.5, color:C.muted, align:'center', fontFace:'Segoe UI', lineSpacingMultiple:1.35 });
  });

  // Loop-back arrow (Diffuse → Sense)
  s.addText('↺  Continuous — no fixed destination', {
    x:1.2, y:6.15, w:11.0, h:0.35,
    fontSize:10, color:C.cyan, align:'center', italic:true,
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 10 — AGENTS OF CHANGE & DRIVERS
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.green);
  addTitle(s, 'Agents of Change & Transformation Drivers');
  addSubtitle(s, 'Assign agents to hexagons and activate drivers to reflect real organizational context. Both influence the Fitness score.');

  // Agents section
  sectionDivider(s, 'AGENTS OF CHANGE', C.green, 1.45);

  const agents = [
    { icon:'🧑', label:'Human Agent', color:'dddddd', desc:'Leaders, managers, and change champions who hold social authority. They legitimize change, create safety, and model new behaviors.', bonus:'+0.5 pts per assignment' },
    { icon:'🏛', label:'Systemic Agent', color:C.purple, desc:'Governance structures, KPIs, OKRs, review cadences, and institutional levers. They embed change into how the organization operates.', bonus:'+0.5 pts per assignment' },
    { icon:'🤖', label:'AI Agent', color:C.accent, desc:'Automation, analytics, intelligence augmentation. AI amplifies human decision-making and removes friction from adaptive processes.', bonus:'+0.5 pts per assignment' },
  ];

  agents.forEach((a, i) => {
    const x = 0.4 + i * 4.3;
    card(s, x, 1.75, 4.1, 2.2, { fillColor:C.surface2, borderColor:t55(a.color) });
    s.addShape(pptx.ShapeType.ellipse, { x:x+1.6, y:1.85, w:0.9, h:0.9, fill:{ color:t22(a.color) }, line:{ color:a.color, width:1.5 } });
    s.addText(a.icon, { x:x+1.6, y:1.93, w:0.9, h:0.7, fontSize:22, align:'center' });
    s.addText(a.label, { x:x+0.15, y:2.85, w:3.8, h:0.3, fontSize:12, bold:true, color:'#'+a.color, align:'center' });
    s.addText(a.desc, { x:x+0.2, y:3.2, w:3.7, h:0.9, fontSize:8.5, color:C.muted, align:'center', lineSpacingMultiple:1.35 });
    s.addText(a.bonus, { x:x+0.2, y:3.82, w:3.7, h:0.22, fontSize:8, color:C.green, align:'center', bold:true });
  });

  // Drivers section
  sectionDivider(s, 'TRANSFORMATION DRIVERS', C.orange, 4.1);

  const drivers = ['Cost Efficiency','Time-to-Market','Innovation Stagnation','Customer Experience','Decision Latency','Talent Attrition','Regulatory Pressure','Change Fatigue'];
  const driverX = [0.4,2.2,4.0,5.8,7.6,9.4,11.2,12.0];

  s.addText('Activate the business drivers that frame this transformation session. Each active driver adds context and +0.3 pts to the Fitness score.', {
    x:0.4, y:4.45, w:12.5, h:0.35, fontSize:9.5, color:C.muted, fontFace:'Segoe UI',
  });

  drivers.forEach((d, i) => {
    const x = 0.4 + (i % 4) * 3.25;
    const y = 4.9 + Math.floor(i / 4) * 0.55;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w:3.0, h:0.38, fill:{ color:t20(C.orange) }, line:{ color:C.orange, width:1 }, rectRadius:0.19 });
    s.addText('⚡ ' + d, { x, y:y+0.07, w:3.0, h:0.24, fontSize:9, color:C.orange, bold:true, align:'center' });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 11 — ORGANIZATIONAL FITNESS MODEL
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.green);
  addTitle(s, 'Organizational Fitness Model');
  addSubtitle(s, 'A composite score (0–100) reflecting the organization\'s capacity to sense, adapt, and respond. Not a vanity metric — a learning instrument.');

  // Fitness levels (left column)
  const levels = [
    { range:'80–100', label:'Antifragile', color:C.cyan,   desc:'Gains strength from disruption. Decentralized, learning-forward.' },
    { range:'60–79',  label:'Resilient',   color:C.green,  desc:'Recovers well. Feedback loops active. Patterns spreading.' },
    { range:'40–59',  label:'Stable',      color:C.orange, desc:'Can absorb moderate change. Some patterns present.' },
    { range:'20–39',  label:'Emerging',    color:t70(C.orange), desc:'Change is happening but fragile. Anti-patterns still dominant.' },
    { range:'0–19',   label:'Fragile',     color:C.red,    desc:'Structural brittleness. High inertia. Risk of collapse under pressure.' },
  ];

  levels.forEach((l, i) => {
    const y = 1.6 + i * 0.98;
    card(s, 0.4, y, 5.8, 0.82, { fillColor:C.surface2, borderColor:t55(l.color) });
    s.addShape(pptx.ShapeType.rect, { x:0.4, y, w:0.055, h:0.82, fill:{ color:l.color } });
    s.addText(l.range, { x:0.55, y:y+0.12, w:0.9, h:0.3, fontSize:13, bold:true, color:l.color, fontFace:'Segoe UI' });
    s.addText(l.label.toUpperCase(), { x:1.55, y:y+0.08, w:1.8, h:0.3, fontSize:12, bold:true, color:l.color, charSpacing:1 });
    s.addText(l.desc, { x:1.55, y:y+0.42, w:4.5, h:0.35, fontSize:8.5, color:C.muted, fontFace:'Segoe UI' });
  });

  // Score components (right column)
  sectionDivider(s, 'SCORE COMPONENTS', C.accent, 1.5);

  const components = [
    { label:'Hex Zone Position', desc:'Patterns in path zones +3 · Transitions +2 · Anti-patterns −1', color:C.blueLt },
    { label:'Capabilities Adopted', desc:'Each capability marker on board +5 pts', color:C.cyan },
    { label:'S2F Experiments', desc:'+2 per experiment run, +3 per experiment passed', color:C.green },
    { label:'Transition Practices', desc:'Each transition hex on board +1 pt', color:C.gray },
    { label:'Practice Repetitions', desc:'+0.5 pts per recorded repetition', color:C.gray },
    { label:'Agent & Driver Links', desc:'+0.5 per agent assigned, +0.5 per driver linked to hex', color:C.purple },
    { label:'Cycle Bonus', desc:'+2 pts per completed Möbius cycle', color:C.orange },
    { label:'Pathway Bonus', desc:'+1 per confirmed transition step, +5 for full pathway', color:C.accent },
  ];

  components.forEach((c, i) => {
    const y = 1.95 + i * 0.58;
    card(s, 6.6, y, 6.3, 0.5, { fillColor:C.surface2, borderColor:t44(c.color) });
    s.addShape(pptx.ShapeType.ellipse, { x:6.72, y:y+0.14, w:0.22, h:0.22, fill:{ color:c.color } });
    s.addText(c.label, { x:7.05, y:y+0.06, w:5.7, h:0.24, fontSize:10, bold:true, color:c.color, fontFace:'Segoe UI' });
    s.addText(c.desc, { x:7.05, y:y+0.28, w:5.7, h:0.2, fontSize:8.5, color:C.muted, fontFace:'Segoe UI' });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 12 — TRANSFORMATION PATHWAYS FEATURE
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.purple);
  addTitle(s, 'Transformation Pathways');
  addSubtitle(s, 'Link an anti-pattern to its target pattern. Define the ordered transition steps needed to get there.');

  // Flow diagram: Anti-pattern → Transitions → Pattern
  // Anti-pattern box
  card(s, 0.5, 2.0, 2.5, 2.8, { fillColor:'1e1510', borderColor:t55(C.orange) });
  s.addShape(pptx.ShapeType.rect, { x:0.5, y:2.0, w:2.5, h:0.05, fill:{ color:C.orange } });
  s.addShape(pptx.ShapeType.hexagon, { x:0.95, y:2.15, w:1.6, h:1.4, fill:{ color:t30(C.orange) }, line:{ color:C.orange, width:1.5 } });
  s.addText('⬡', { x:0.95, y:2.5, w:1.6, h:0.7, fontSize:18, color:C.orange, align:'center', bold:true });
  s.addText('Anti-Pattern', { x:0.6, y:3.0, w:2.3, h:0.28, fontSize:10, bold:true, color:C.orange, align:'center' });
  s.addText('e.g., Hero Leadership', { x:0.6, y:3.3, w:2.3, h:0.25, fontSize:8.5, color:C.muted, align:'center', italic:true });
  s.addText('🔗 Define Pathway', { x:0.6, y:3.65, w:2.3, h:0.25, fontSize:9, color:C.cyan, align:'center' });

  // Arrow 1
  s.addShape(pptx.ShapeType.rightArrow, { x:3.15, y:3.1, w:0.7, h:0.28, fill:{ color:t55(C.gray) }, line:{ color:C.gray, width:1 } });

  // Transitions box
  card(s, 3.9, 1.8, 5.3, 3.2, { fillColor:'171c20', borderColor:t55(C.gray) });
  s.addShape(pptx.ShapeType.rect, { x:3.9, y:1.8, w:5.3, h:0.05, fill:{ color:C.gray } });
  s.addText('Transition Steps', { x:3.9, y:1.9, w:5.3, h:0.3, fontSize:10, bold:true, color:C.gray, align:'center' });
  s.addText('In order of effort', { x:3.9, y:2.2, w:5.3, h:0.22, fontSize:8, color:C.muted, align:'center' });

  const steps = [
    { n:1, name:'Shadow Decision Mapping', status:'successful', color:C.green },
    { n:2, name:'Opt-In Participation',    status:'successful', color:C.green },
    { n:3, name:'Community of Practice',   status:'pending',    color:C.muted },
  ];
  steps.forEach((st, i) => {
    const y = 2.5 + i * 0.72;
    card(s, 4.1, y, 4.9, 0.6, { fillColor:C.surface2, borderColor:t55(st.color) });
    s.addShape(pptx.ShapeType.ellipse, { x:4.22, y:y+0.16, w:0.28, h:0.28, fill:{ color:t44(st.color) }, line:{ color:st.color, width:1 } });
    s.addText(`${st.n}`, { x:4.22, y:y+0.17, w:0.28, h:0.2, fontSize:9, bold:true, color:st.color, align:'center' });
    s.addShape(pptx.ShapeType.hexagon, { x:4.6, y:y+0.1, w:0.38, h:0.33, fill:{ color:t30(C.gray) }, line:{ color:C.gray, width:0.5 } });
    s.addText(st.name, { x:5.05, y:y+0.1, w:2.8, h:0.28, fontSize:9.5, color:C.text, fontFace:'Segoe UI' });
    const btnColor = st.status === 'successful' ? C.green : C.muted;
    s.addShape(pptx.ShapeType.roundRect, { x:7.95, y:y+0.14, w:0.95, h:0.28, fill:{ color:t22(btnColor) }, line:{ color:btnColor, width:0.8 }, rectRadius:0.06 });
    s.addText(st.status === 'successful' ? '✓ Done' : '✓ Confirm', { x:7.95, y:y+0.17, w:0.95, h:0.2, fontSize:7.5, color:btnColor, align:'center', bold:true });
  });

  // Arrow 2
  s.addShape(pptx.ShapeType.rightArrow, { x:9.35, y:3.1, w:0.7, h:0.28, fill:{ color:t55(C.blueLt) }, line:{ color:C.blueLt, width:1 } });

  // Pattern box
  card(s, 10.1, 2.0, 2.7, 2.8, { fillColor:'101820', borderColor:t55(C.blueLt) });
  s.addShape(pptx.ShapeType.rect, { x:10.1, y:2.0, w:2.7, h:0.05, fill:{ color:C.blueLt } });
  s.addShape(pptx.ShapeType.hexagon, { x:10.6, y:2.15, w:1.7, h:1.4, fill:{ color:t30(C.blueLt) }, line:{ color:C.blueLt, width:1.5 } });
  s.addText('⬡', { x:10.6, y:2.5, w:1.7, h:0.7, fontSize:18, color:C.blueLt, align:'center', bold:true });
  s.addText('Target Pattern', { x:10.15, y:3.0, w:2.6, h:0.28, fontSize:10, bold:true, color:'#'+C.blueLt, align:'center' });
  s.addText('e.g., Distribute Power', { x:10.15, y:3.3, w:2.6, h:0.25, fontSize:8.5, color:C.muted, align:'center', italic:true });
  s.addText('+5 pts when complete', { x:10.15, y:3.65, w:2.6, h:0.25, fontSize:9, color:C.green, align:'center' });

  // Bottom info row
  const infos = [
    { icon:'🔗', text:'Hover an anti-pattern → click 🔗 to define its pathway', color:C.cyan },
    { icon:'📋', text:'Pick a target pattern and add ordered transition steps', color:C.accent },
    { icon:'✓', text:'Confirm each transition as successful experiments complete', color:C.green },
    { icon:'🏆', text:'+1 per step confirmed · +5 for full pathway completion', color:C.orange },
  ];
  infos.forEach((inf, i) => {
    card(s, 0.4 + i * 3.23, 5.25, 3.1, 0.65, { fillColor:C.surface2, borderColor:t44(inf.color) });
    s.addText(inf.icon + '  ' + inf.text, { x:0.6 + i * 3.23, y:5.38, w:2.75, h:0.4, fontSize:8.5, color:inf.color, fontFace:'Segoe UI', lineSpacingMultiple:1.3 });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 13 — BOARD MECHANICS (CONNECTIONS & MARKERS)
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.accent);
  addTitle(s, 'Board Mechanics — Connections & Markers');
  addSubtitle(s, 'Beyond placement: connect hexagons to show transformation flow, and mark hexes with experiments and capabilities.');

  sectionDivider(s, 'CONNECTIONS (LINKS)', C.accent, 1.45);

  const connections = [
    { type:'Transition Path', style:'Dashed arrow →', color:C.accent, desc:'Shows the transformation journey. Typically Anti-Pattern → Transition → Pattern. Visualizes the intended path of migration.' },
    { type:'Transition Nexus', style:'Solid L-shaped arrow', color:C.cyan, desc:'Shows a nexus point where multiple transitions converge or diverge. Represents leverage points in the system.' },
  ];

  connections.forEach((c, i) => {
    card(s, 0.4 + i * 6.5, 1.8, 6.2, 1.5, { fillColor:C.surface2, borderColor:t55(c.color) });
    s.addShape(pptx.ShapeType.rect, { x:0.4 + i * 6.5, y:1.8, w:6.2, h:0.04, fill:{ color:c.color } });
    s.addText(c.type, { x:0.6 + i * 6.5, y:1.88, w:5.8, h:0.32, fontSize:12, bold:true, color:c.color });
    s.addText('Style: ' + c.style, { x:0.6 + i * 6.5, y:2.2, w:5.8, h:0.22, fontSize:9, color:taa(c.color), italic:true });
    s.addText(c.desc, { x:0.6 + i * 6.5, y:2.45, w:5.8, h:0.7, fontSize:9, color:C.muted, lineSpacingMultiple:1.35 });
  });

  sectionDivider(s, 'BOARD MARKERS', C.orange, 3.45);

  const markers = [
    { badge:'S2F', label:'Safe-to-Fail Experiment', color:C.gray,
      desc:'Mark a hexagon as a safe-to-fail probe. A small, bounded test with a clear hypothesis and observable outcome. Can be marked as Run or Passed.', bonus:'+2 pts run · +3 pts passed' },
    { badge:'C', label:'Capability Marker', color:C.cyan,
      desc:'Mark organizational capabilities that need to be built, acquired, or leveraged for the transformation to succeed. Track what the organization is investing in.', bonus:'+5 pts per capability' },
  ];

  markers.forEach((m, i) => {
    card(s, 0.4 + i * 6.5, 3.7, 6.2, 2.5, { fillColor:C.surface2, borderColor:t55(m.color) });
    // Badge
    s.addShape(pptx.ShapeType.roundRect, { x:0.65 + i * 6.5, y:3.85, w:0.8, h:0.45, fill:{ color:t33(m.color) }, line:{ color:m.color, width:1.5 }, rectRadius:0.06 });
    s.addText(m.badge, { x:0.65 + i * 6.5, y:3.9, w:0.8, h:0.35, fontSize:12, bold:true, color:m.color, align:'center' });
    s.addText(m.label, { x:1.55 + i * 6.5, y:3.88, w:4.9, h:0.35, fontSize:12, bold:true, color:m.color });
    s.addText(m.desc, { x:0.6 + i * 6.5, y:4.32, w:5.9, h:1.2, fontSize:9, color:C.muted, lineSpacingMultiple:1.4 });
    s.addText(m.bonus, { x:0.6 + i * 6.5, y:5.52, w:5.9, h:0.3, fontSize:10, color:C.green, bold:true });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 14 — HOW TO PLAY / THE SESSION FLOW
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);
  accentBar(s, C.green);
  addTitle(s, 'Running a Nexus Session');
  addSubtitle(s, 'A structured facilitation journey for leadership teams, transformation leads, and Agile coaches.');

  const steps = [
    { n:'01', title:'Set Context', color:C.accent, icon:'🎯',
      items:['Name the organization / team / initiative','Identify active Transformation Drivers (Cost, Speed, etc.)','Agree on the current Möbius Cycle phase'] },
    { n:'02', title:'Map Current Reality', color:C.red, icon:'🗺️',
      items:['Drag Anti-Patterns that resonate onto the board','Place them in Current Reality (bottom-left area)','Add Strategic and Operational perspectives separately'] },
    { n:'03', title:'Define Pathways', color:C.orange, icon:'🔗',
      items:['For each Anti-Pattern: click 🔗 to define a target Pattern','Add ordered Transition steps to the pathway','Place Transitions on the Transformation Path zone'] },
    { n:'04', title:'Assign Agents & Markers', color:C.purple, icon:'🧑‍🤝‍🧑',
      items:['Select Human / Systemic / AI agents and click hexes to assign','Mark critical hexes as S2F experiments or Capabilities','Link Drivers to hexes for strategic alignment'] },
    { n:'05', title:'Progress & Confirm', color:C.green, icon:'✓',
      items:['Confirm Transitions as experiments are completed','Advance the Möbius Cycle as phases complete','Watch the Fitness score rise toward Antifragile'] },
    { n:'06', title:'Export & Persist', color:C.cyan, icon:'📥',
      items:['Export the session as JSON for documentation','Save to the database for multi-session continuity','Compare Fitness scores across game sessions'] },
  ];

  steps.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 4.3;
    const y = 1.55 + row * 2.75;
    card(s, x, y, 4.1, 2.55, { fillColor:C.surface2, borderColor:t55(st.color) });
    s.addShape(pptx.ShapeType.rect, { x, y, w:4.1, h:0.05, fill:{ color:st.color } });
    s.addText(st.icon, { x, y:y+0.1, w:0.8, h:0.5, fontSize:20, align:'center' });
    s.addText(st.n, { x:x+0.75, y:y+0.1, w:0.5, h:0.25, fontSize:10, bold:true, color:t88(st.color) });
    s.addText(st.title, { x:x+0.75, y:y+0.3, w:3.2, h:0.3, fontSize:12, bold:true, color:st.color });
    st.items.forEach((item, ii) => {
      s.addShape(pptx.ShapeType.ellipse, { x:x+0.22, y:y+0.76+ii*0.53, w:0.07, h:0.07, fill:{ color:st.color } });
      s.addText(item, { x:x+0.38, y:y+0.7+ii*0.53, w:3.6, h:0.45, fontSize:8.5, color:C.muted, lineSpacingMultiple:1.3 });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SLIDE 15 — CLOSING / CALL TO ACTION
// ═══════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  addBg(s);

  // Background decoration
  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{ color:C.bg } });
  const decorHex = [[0.2,0.3],[1.5,1.1],[0.8,2.2],[2.0,0.1],[11.0,5.8],[12.2,4.9],[11.8,6.5],[10.5,4.5]];
  decorHex.forEach(([hx,hy]) => {
    s.addShape(pptx.ShapeType.hexagon, { x:hx, y:hy, w:0.8, h:0.7, fill:{ color:C.surface2 }, line:{ color:C.border, width:1 } });
  });

  s.addText('The transformation has no end state.', {
    x:1.0, y:1.4, w:11.3, h:0.7, fontSize:28, bold:true, color:C.text, align:'center',
  });
  s.addText('Success is a rising fitness score — not a destination.', {
    x:1.0, y:2.1, w:11.3, h:0.55, fontSize:20, color:C.cyan, align:'center', italic:true,
  });

  // 3 closing takeaways
  const takeaways = [
    { icon:'🧬', text:'Transformation = sustained habit change across the system', color:C.green },
    { icon:'🛡️', text:'Work with the immune system, not against it', color:C.orange },
    { icon:'♾️', text:'Every Möbius cycle makes the organization more Antifragile', color:C.purple },
  ];

  takeaways.forEach((t, i) => {
    card(s, 0.8 + i * 3.95, 3.05, 3.7, 1.0, { fillColor:C.surface2, borderColor:t55(t.color) });
    s.addText(t.icon + '  ' + t.text, { x:1.0 + i * 3.95, y:3.3, w:3.3, h:0.5, fontSize:10, color:t.color, align:'center', lineSpacingMultiple:1.3 });
  });

  s.addText('Start your Nexus Board session today', {
    x:1.0, y:4.35, w:11.3, h:0.5, fontSize:16, bold:true, color:C.text, align:'center',
  });
  s.addText('nexus-transformation-board.vercel.app', {
    x:1.0, y:4.85, w:11.3, h:0.38, fontSize:13, color:C.cyan, align:'center',
  });

  s.addText('Enterprise Transformation Codex · NTT DATA DS&A USA', {
    x:1.0, y:6.9, w:11.3, h:0.28, fontSize:9, color:t55(C.muted), align:'center',
  });
}

// ── Write file ────────────────────────────────────────────────────
const outPath = './Nexus-Transformation-Board-Presentation.pptx';
pptx.writeFile({ fileName: outPath })
  .then(() => console.log('✅ PPTX saved to:', outPath))
  .catch(err => console.error('❌ Error:', err));
