// ---------------------------------------------------------------------------
// Astigmatism screening demonstration - configuration & scoring
//
// IMPORTANT: The thresholds below are an EXHIBITION SCREENING RULE ONLY.
// They are NOT a medically validated diagnostic threshold and carry no
// clinical accuracy. Only an eye-care professional can diagnose astigmatism.
// ---------------------------------------------------------------------------

export const NUMBER_OF_TRIALS = 8;
/** Orientations used in the fan chart, degrees, spread over 180. */
export const ORIENTATIONS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];
/** Two answers within this many degrees count as the same directional cluster. */
export const CLUSTER_TOLERANCE_DEG = 25;
/** Selections inside the dominant cluster needed for a "possible indication". */
export const POSITIVE_THRESHOLD = 5;
/** Below this cluster size the responses are treated as inconclusive/no pattern. */
export const CONSISTENCY_THRESHOLD = 3;
/** Cross-check trials repeat orientation sets; agreement is required for positive. */
export const CROSSCHECK_MIN_AGREEMENT = 0.5;

export type Trial = {
  index: number;
  /** Orientation (deg) behind each of the three options A, B, C. */
  options: number[];
  /** Rotation applied to the whole chart for visual variation. */
  chartRotation: number;
  /** Trials sharing a crossCheckGroup test the same orientations again. */
  crossCheckGroup: number;
};

export type Answer = { trialIndex: number; orientation: number };

export type Outcome = "positive" | "negative" | "inconclusive";

export type ScreeningResult = {
  outcome: Outcome;
  clusterCount: number;
  totalTrials: number;
  preferredOrientation: number | null;
  crossCheckConsistent: boolean;
};

/** Normalize an orientation into the 0-180 range (lines are 180-symmetric). */
export function normalizeOrientation(deg: number): number {
  const n = deg % 180;
  return n < 0 ? n + 180 : n;
}

/** Smallest angular distance between two line orientations (0-90). */
export function orientationDistance(a: number, b: number): number {
  const d = Math.abs(normalizeOrientation(a) - normalizeOrientation(b)) % 180;
  return d > 90 ? 180 - d : d;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic-but-varied test generation. */
export function generateTest(trials: number = NUMBER_OF_TRIALS): Trial[] {
  const rand = Math.random;
  const out: Trial[] = [];
  // Base triads spread widely apart so the three options are clearly different.
  const baseTriads: number[][] = [
    [0, 60, 120],
    [15, 75, 135],
    [30, 90, 150],
    [45, 105, 165],
  ];
  for (let i = 0; i < trials; i++) {
    const group = i % baseTriads.length; // later trials cross-check earlier ones
    const triad = baseTriads[group].map(normalizeOrientation);
    out.push({
      index: i,
      options: shuffle(triad, rand),
      chartRotation: (i * 7) % 15,
      crossCheckGroup: group,
    });
  }
  return out;
}

export function recordAnswer(answers: Answer[], trialIndex: number, orientation: number): Answer[] {
  const next = answers.filter((a) => a.trialIndex !== trialIndex);
  next.push({ trialIndex, orientation: normalizeOrientation(orientation) });
  return next.sort((a, b) => a.trialIndex - b.trialIndex);
}

/** Largest group of selections falling within CLUSTER_TOLERANCE_DEG of a centre. */
export function calculateConsistency(answers: Answer[]): {
  clusterCount: number;
  preferredOrientation: number | null;
  members: Answer[];
} {
  if (answers.length === 0) return { clusterCount: 0, preferredOrientation: null, members: [] };
  let best: Answer[] = [];
  let bestCentre: number | null = null;
  for (const candidate of answers) {
    const members = answers.filter(
      (a) => orientationDistance(a.orientation, candidate.orientation) <= CLUSTER_TOLERANCE_DEG,
    );
    if (members.length > best.length) {
      best = members;
      bestCentre = candidate.orientation;
    }
  }
  return { clusterCount: best.length, preferredOrientation: bestCentre, members: best };
}

export function calculateResult(trials: Trial[], answers: Answer[]): ScreeningResult {
  const total = trials.length;
  const { clusterCount, preferredOrientation, members } = calculateConsistency(answers);

  // Cross-check: among trials repeating the same orientation triad, how often
  // did the visitor stay inside the dominant cluster?
  let crossTotal = 0;
  let crossAgree = 0;
  const byGroup = new Map<number, Answer[]>();
  for (const a of answers) {
    const t = trials.find((x) => x.index === a.trialIndex);
    if (!t) continue;
    const list = byGroup.get(t.crossCheckGroup) ?? [];
    list.push(a);
    byGroup.set(t.crossCheckGroup, list);
  }
  for (const list of byGroup.values()) {
    if (list.length < 2) continue;
    for (const a of list) {
      crossTotal++;
      if (members.some((m) => m.trialIndex === a.trialIndex)) crossAgree++;
    }
  }
  const crossCheckConsistent = crossTotal === 0 || crossAgree / crossTotal >= CROSSCHECK_MIN_AGREEMENT;

  let outcome: Outcome;
  if (answers.length < total) {
    outcome = "inconclusive";
  } else if (clusterCount >= POSITIVE_THRESHOLD && crossCheckConsistent) {
    outcome = "positive";
  } else if (clusterCount < CONSISTENCY_THRESHOLD) {
    outcome = "inconclusive";
  } else {
    outcome = "negative";
  }

  return {
    outcome,
    clusterCount,
    totalTrials: total,
    preferredOrientation: preferredOrientation,
    crossCheckConsistent,
  };
}

export function resetSession(): { trials: Trial[]; answers: Answer[] } {
  return { trials: generateTest(), answers: [] };
}

// --- Optional anonymous local counter (no personal data, localStorage only) ---
const COUNTER_KEY = "astig_demo_visitor_count";
export function readVisitorCount(): number {
  if (typeof window === "undefined") return 0;
  const v = Number(window.localStorage.getItem(COUNTER_KEY));
  return Number.isFinite(v) && v > 0 ? v : 0;
}
export function incrementVisitorCount(): number {
  if (typeof window === "undefined") return 0;
  const next = readVisitorCount() + 1;
  window.localStorage.setItem(COUNTER_KEY, String(next));
  return next;
}
