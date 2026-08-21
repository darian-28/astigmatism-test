// ---------------------------------------------------------------------------
// Astigmatism screening demonstration - configuration & scoring
//
// IMPORTANT: The thresholds below are an EXHIBITION SCREENING RULE ONLY.
// They are NOT medically validated and carry no clinical accuracy. Only an
// eye-care professional can diagnose astigmatism.
//
// Design notes (false-positive control):
//  - Every trial is a triad of widely separated orientations, drawn with
//    identical stroke width / colour, so no direction is rendered stronger.
//  - Each triad is presented TWICE (a cross-check pair) with a different chart
//    rotation and a different A/B/C ordering, so a visitor cannot repeat an
//    answer by remembering a letter or a screen position.
//  - Scoring separates directional preference, cross-check repeatability and
//    pattern strength. A positive requires ALL of them.
// ---------------------------------------------------------------------------

/** Trials in one astigmatism session (4 cross-check pairs). */
export const NUMBER_OF_TRIALS = 8;
/** Orientations drawn in the fan chart, degrees, spread over 180. */
export const ORIENTATIONS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];
/** Two answers within this many degrees count as the same directional cluster. */
export const CLUSTER_TOLERANCE_DEG = 20;
/** Selections inside the dominant cluster needed for a strong pattern. */
export const POSITIVE_THRESHOLD = 6;
/** Below this dominant-cluster size there is no usable directional preference. */
export const CONSISTENCY_THRESHOLD = 4;
/** Fraction of cross-check pairs that must agree for a positive result. */
export const CROSSCHECK_MIN_AGREEMENT = 0.75;
/** Below this cross-check agreement the responses are treated as unreliable. */
export const RELIABILITY_MIN = 0.5;

export type Trial = {
  index: number;
  /**
   * Orientation (deg, screen space) behind each option A, B, C. This is what
   * the eye actually sees, so scoring works directly on these values.
   */
  options: number[];
  /** Rotation applied to the whole chart (multiple of 15 to keep the lattice). */
  chartRotation: number;
  /** Trials sharing a crossCheckGroup present the same screen orientations. */
  crossCheckGroup: number;
};

export type Answer = { trialIndex: number; orientation: number };

export type Outcome = "positive" | "negative" | "inconclusive";

export type ScreeningResult = {
  outcome: Outcome;
  /** Answers falling in the dominant directional cluster. */
  clusterCount: number;
  totalTrials: number;
  preferredOrientation: number | null;
  /** Cross-check pairs where both answers pointed the same way. */
  crossCheckAgreed: number;
  crossCheckPairs: number;
  /** crossCheckAgreed / crossCheckPairs (1 when no pairs). */
  reliability: number;
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
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

/**
 * Build a session: 4 orientation triads, each presented twice (cross-check),
 * interleaved so the repeat never follows its partner immediately.
 */
export function generateTest(trials: number = NUMBER_OF_TRIALS): Trial[] {
  const rand = Math.random;
  // Triads spread widely apart so the three options are clearly different.
  const baseTriads: number[][] = [
    [0, 60, 120],
    [15, 75, 135],
    [30, 90, 150],
    [45, 105, 165],
  ];
  const rotations = [0, 15, 30, 45, 60, 75, 90, 105];
  // Presentation order: A B C D  A B C D (repeat never adjacent to partner).
  const order: number[] = [];
  const pairs = Math.max(1, Math.floor(trials / 2));
  for (let round = 0; round < 2; round++) {
    for (let g = 0; g < pairs; g++) order.push(g % baseTriads.length);
  }

  return order.slice(0, trials).map((group, i) => ({
    index: i,
    options: shuffle((baseTriads[group] ?? baseTriads[0]!).map(normalizeOrientation), rand),
    chartRotation: rotations[i % rotations.length]!,
    crossCheckGroup: group,
  }));
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
  const { clusterCount, preferredOrientation } = calculateConsistency(answers);

  // --- Cross-check: within each repeated triad, did both answers point the
  // same way? This is measured pair-by-pair and is independent of the
  // dominant cluster, so a single strong answer cannot carry the result.
  const byGroup = new Map<number, Answer[]>();
  for (const a of answers) {
    const t = trials.find((x) => x.index === a.trialIndex);
    if (!t) continue;
    const list = byGroup.get(t.crossCheckGroup) ?? [];
    list.push(a);
    byGroup.set(t.crossCheckGroup, list);
  }
  let pairs = 0;
  let agreed = 0;
  for (const list of byGroup.values()) {
    if (list.length < 2) continue;
    pairs++;
    const allAgree = list.every(
      (a) => orientationDistance(a.orientation, list[0]!.orientation) <= CLUSTER_TOLERANCE_DEG,
    );
    if (allAgree) agreed++;
  }
  const reliability = pairs === 0 ? 1 : agreed / pairs;
  const crossCheckConsistent = reliability >= CROSSCHECK_MIN_AGREEMENT;

  let outcome: Outcome;
  if (answers.length < total) {
    // Incomplete session - never claim a finding.
    outcome = "inconclusive";
  } else if (clusterCount >= POSITIVE_THRESHOLD && crossCheckConsistent) {
    // Strong preference AND repeatable across cross-checks.
    outcome = "positive";
  } else if (clusterCount >= CONSISTENCY_THRESHOLD && reliability < RELIABILITY_MIN) {
    // A partial directional preference that the repeats contradict: the
    // responses carry a hint of a pattern but disagree with themselves.
    outcome = "inconclusive";
  } else if (clusterCount >= POSITIVE_THRESHOLD) {
    // Strong preference but not repeatable enough to call it a finding.
    outcome = "inconclusive";
  } else {
    // No meaningful directional preference at all - scattered answers mean
    // no direction stood out, which is the expected pattern without
    // astigmatism, not a failed session.
    outcome = "negative";
  }

  return {
    outcome,
    clusterCount,
    totalTrials: total,
    preferredOrientation,
    crossCheckAgreed: agreed,
    crossCheckPairs: pairs,
    reliability,
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
