// ══════════════════════════════════════════════════════════════════════
// Möbius Loop — State Layer
// Reads/writes window.loopSessions and window.activeLoop
// Reads board state from global vars (gridState, connections, experimentResults, boardMarkers, allItems)
// ══════════════════════════════════════════════════════════════════════

window.loopSessions  = window.loopSessions  || [];
window.activeLoop    = window.activeLoop    || null;
window.loopDockOpen  = window.loopDockOpen  || false;

// ── Diagnostic prompts keyed by domain ──────────────────────────────
window.LOOP_PROMPTS = {
  'Strategy & Portfolio': [
    'What strategic bets are being ignored or delayed?',
    'Where is leadership attention fragmented across too many priorities?',
    'Which capabilities are being starved of investment?',
    'What decisions keep being revisited without resolution?',
    'Where is alignment breaking down between layers of leadership?'
  ],
  'Product & Delivery': [
    'Where does user feedback get lost before reaching the team?',
    'What delivery bottlenecks recur cycle after cycle?',
    'Which features are being built without clear user validation?',
    'Where do handoffs between teams introduce delay or loss of context?',
    'What "done" criteria are ambiguous or contested?'
  ],
  'Technology & Architecture': [
    'What technical debt is actively blocking experiments or releases?',
    'Where are architecture decisions creating coupling that slows change?',
    'Which systems lack observability, making failure invisible?',
    'Where is toil consuming engineering capacity that could be automated?',
    'What security or compliance constraints are treated as blockers rather than design inputs?'
  ],
  'People, Culture & Governance': [
    'What behaviours are rewarded that contradict the intended culture?',
    'Where is psychological safety low enough to suppress honest signals?',
    'Which governance processes create bottlenecks without adding value?',
    'What habits are teams defending that no longer serve the mission?',
    'Where is accountability diffused to the point where no one owns outcomes?'
  ],
  'Operations': [
    'What processes have no clear owner and drift toward chaos?',
    'Where does operational complexity prevent small experiments from running?',
    'Which metrics are being tracked but never acted upon?',
    'What runbooks or procedures are outdated and silently causing failure?',
    'Where is operational knowledge locked in individuals rather than systems?'
  ],
  _default: [
    'What signals of friction or slowdown are you observing?',
    'Where do decisions consistently get stuck or reversed?',
    'What patterns of behaviour are working against transformation?',
    'Which team habits are consuming energy without producing value?',
    'Where is the gap between what people say and what they do widest?'
  ]
};

// ── Helpers ──────────────────────────────────────────────────────────

function _boardAntipatternCount() {
  if (!window.gridState || !window.allItems) return 0;
  return Object.values(window.gridState).filter(id => {
    const item = window.allItems.find(i => i.id === id);
    return item && item.type === 'antipattern';
  }).length;
}

function _boardPatternCount() {
  if (!window.gridState || !window.allItems) return 0;
  return Object.values(window.gridState).filter(id => {
    const item = window.allItems.find(i => i.id === id);
    return item && item.type === 'pattern';
  }).length;
}

function _experimentResultCount() {
  if (!window.experimentResults) return 0;
  return Object.keys(window.experimentResults).length;
}

function _connectionCount() {
  if (!window.connections) return 0;
  return window.connections.length;
}

// ── Phase Gate Logic ─────────────────────────────────────────────────

window.getLoopReadiness = function(phase) {
  const loop = window.activeLoop;
  if (!loop) return { ready: false, missing: ['No active loop'] };

  const missing = [];

  if (phase === 0) { // SENSE → FOCUS
    if (!loop.sense.signals.length) missing.push('Add at least 1 signal observation');
    if (_boardAntipatternCount() === 0) missing.push('Place at least 1 anti-pattern on the board');
  } else if (phase === 1) { // FOCUS → EXPERIMENT
    if (!loop.focus.selected.length) missing.push('Select 1–2 anti-patterns to focus on');
    if ((loop.focus.behavior || '').trim().length < 10) missing.push('Describe the behaviour / habit being targeted (min 10 chars)');
  } else if (phase === 2) { // EXPERIMENT → STABILIZE
    const cards = loop.experiment || [];
    const allFilled = cards.length > 0 && cards.every(c => (c.action||'').trim() && (c.owner||'').trim());
    if (!allFilled) missing.push('Complete all experiment card fields (action + owner required)');
    if (_boardPatternCount() === 0) missing.push('Place at least 1 pattern on the board');
    if (_connectionCount() === 0) missing.push('Draw at least 1 Nexus connection');
    if (_experimentResultCount() === 0) missing.push('Register at least 1 S2F experiment');
  } else if (phase === 3) { // STABILIZE → DIFFUSE
    if ((loop.stabilize.norm || '').trim().length < 5) missing.push('Write the Minimum Viable Norm (min 5 chars)');
    if (!(loop.stabilize.owner || '').trim()) missing.push('Assign an owner for the norm');
  } else if (phase === 4) { // DIFFUSE → COMPLETE
    if ((loop.diffuse.changed || '').trim().length < 5) missing.push('Describe what changed');
    if (!(loop.diffuse.audience || '').trim()) missing.push('Identify the audience for this story');
  }

  return { ready: missing.length === 0, missing };
};

// ── Session Management ───────────────────────────────────────────────

window.startLoop = function(anchorId, anchorName, anchorHexKey) {
  if (window.activeLoop) {
    if (!confirm('A loop session is already active. Start a new one? (current session will be cancelled)')) return;
    window.activeLoop = null;
  }

  // Count existing completed loops for this anchor to determine cycleNum
  const prevCycles = window.loopSessions.filter(s => s.anchorId === anchorId && s.completedAt).length;

  window.activeLoop = {
    id:           'loop_' + Date.now(),
    anchorId,
    anchorName,
    anchorHexKey,
    cycleNum:     prevCycles + 1,
    phase:        0,
    sense:        { signals: [] },
    focus:        { selected: [], behavior: '' },
    experiment:   [],
    stabilize:    { norm: '', owner: '', cadence: '' },
    diffuse:      { changed: '', surprised: '', audience: '' },
    completedAt:  null,
    nextSignal:   ''
  };

  window.loopDockOpen = true;
  if (window.renderLoopDock) window.renderLoopDock();
  if (window.renderBoard)    window.renderBoard();
  if (window.renderLoopModal) {
    document.getElementById('loopModal').classList.add('show');
    window.renderLoopModal();
  }
};

window.advanceLoopPhase = function() {
  const loop = window.activeLoop;
  if (!loop) return;

  const { ready, missing } = window.getLoopReadiness(loop.phase);
  if (!ready) {
    // Show inline — the UI already renders the checklist; just shake the button
    const btn = document.getElementById('loopAdvanceBtn');
    if (btn) { btn.classList.add('shake'); setTimeout(() => btn.classList.remove('shake'), 500); }
    return;
  }

  if (loop.phase === 4) {
    window.completeLoop();
    return;
  }

  // Pre-populate experiment cards when entering phase 2
  if (loop.phase === 1) {
    loop.experiment = loop.focus.selected.map((hexId, i) => {
      const existing = loop.experiment[i];
      if (existing) return existing;
      const item = window.allItems ? window.allItems.find(it => it.id === hexId) : null;
      return { signal: item ? item.name : `Focus item ${i+1}`, action: '', owner: '', by: '', successCriteria: '' };
    });
    // If no specific anti-patterns were selected, use behavior description as one card
    if (!loop.experiment.length) {
      loop.experiment = [{ signal: loop.focus.behavior, action: '', owner: '', by: '', successCriteria: '' }];
    }
  }

  loop.phase++;
  if (window.renderLoopDock)  window.renderLoopDock();
  if (window.renderLoopModal) window.renderLoopModal();
  if (window.renderBoard)     window.renderBoard();
  if (window.scheduleAutoSave) window.scheduleAutoSave();
};

window.backLoopPhase = function() {
  const loop = window.activeLoop;
  if (!loop || loop.phase === 0) return;
  loop.phase--;
  if (window.renderLoopDock)  window.renderLoopDock();
  if (window.renderLoopModal) window.renderLoopModal();
};

window.completeLoop = function() {
  const loop = window.activeLoop;
  if (!loop) return;

  loop.completedAt = new Date().toISOString();
  window.loopSessions.push({ ...loop });
  window.activeLoop = null;

  document.getElementById('loopModal').classList.remove('show');
  if (window.renderLoopDock) window.renderLoopDock();
  if (window.renderBoard)    window.renderBoard();
  if (window.scheduleAutoSave) window.scheduleAutoSave();

  // Prompt for next cycle seed
  const next = loop.diffuse.nextSignal || loop.nextSignal || '';
  if (next && next.trim()) {
    setTimeout(() => {
      const msg = `Loop completed! "${next}" noted as the seed for Cycle ${loop.cycleNum + 1}.`;
      if (window.addLog) window.addLog(msg, 'success');
    }, 300);
  }
  if (window.addLog) window.addLog(`Möbius Loop Cycle ${loop.cycleNum} completed — anchor: ${loop.anchorName}`, 'success');
};

window.cancelLoop = function() {
  if (window.activeLoop) {
    if (!confirm('Cancel this loop session? Unsaved progress will be lost.')) return;
    window.activeLoop = null;
  }
  document.getElementById('loopModal').classList.remove('show');
  if (window.renderLoopDock) window.renderLoopDock();
  if (window.renderBoard)    window.renderBoard();
};

window.toggleLoopDock = function() {
  window.loopDockOpen = !window.loopDockOpen;
  if (window.renderLoopDock) window.renderLoopDock();
};

window.openLoopModal = function() {
  if (!window.activeLoop) return;
  document.getElementById('loopModal').classList.add('show');
  if (window.renderLoopModal) window.renderLoopModal();
};

window.openLoopLog = function() {
  document.getElementById('loopModal').classList.add('show');
  if (window.renderLoopModal) window.renderLoopModal('log');
};
