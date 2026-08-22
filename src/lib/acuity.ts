// ---------------------------------------------------------------------------
// Visual acuity screening demonstration - configuration & scoring
//
// EXHIBITION SCREENING ONLY. This does not measure acuity clinically, does not
// produce a prescription, and cannot tell myopia from hypermetropia or any
// other cause of reduced vision.
// ---------------------------------------------------------------------------

/** Trials in one acuity session (one per size level). */
export const ACUITY_TRIALS = 8;
/** Digit heights in CSS pixels, progressively smaller. Tune for the exhibition laptop. */
export const ACUITY_SIZES_PX = [80, 60, 44, 32, 24, 18, 14, 11];
/** Digits used - visually unambiguous in a plain sans font. */
export const ACUITY_DIGITS = ["2", "3", "4", "5", "6", "8", "9"];
/** Digits shown per trial. */
export const DIGITS_PER_TRIAL = 3;
/**
 * Smallest level index (0 = largest) the visitor must reach correctly to count
 * as good acuity in this screening. Not a clinical threshold.
 */
export const ACUITY_PASS_LEVEL = 5;
/** Wrong answers at large sizes that still count as attentive responding. */
export const MAX_LARGE_SIZE_ERRORS = 1;
/** Level index at/below which an error is considered a "large size" error. */
export const LARGE_SIZE_LEVEL = 2;
/** Reversals (wrong big, right small) tolerated before calling it inconclusive. */
export const MAX_REVERSALS = 2;

export type AcuityTrial = {
  index: number;
  /** Digit height in px for this trial. */
  sizePx: number;
  /** The digit string actually displayed. */
  value: string;
};

export type AcuityAnswer = {
  trialIndex: number;
  /** What the visitor typed (trimmed); null when they pressed CANNOT READ. */
  entry: string | null;
  /** True when the visitor said the number was unreadable at this size. */
  cannotRead: boolean;
  correct: boolean;
};

export type AcuityOutcome = "good" | "reduced" | "inconclusive" | "myopia" | "hypermetropia";

export type AcuityResult = {
  outcome: AcuityOutcome;
  correctCount: number;
  totalTrials: number;
  /** Smallest level index answered correctly (-1 when none). */
  smallestCorrectLevel: number;
  /** Deepest level reached with no earlier miss. */
  consistentLevel: number;
  reversals: number;
};

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function randomDigits(count: number): string {
  let s = "";
  for (let i = 0; i < count; i++) s += ACUITY_DIGITS[randInt(ACUITY_DIGITS.length)]!;
  return s;
}

export function generateAcuityTest(trials: number = ACUITY_TRIALS): AcuityTrial[] {
  const out: AcuityTrial[] = [];
  for (let i = 0; i < trials; i++) {
    out.push({
      index: i,
      sizePx: ACUITY_SIZES_PX[i] ?? ACUITY_SIZES_PX[ACUITY_SIZES_PX.length - 1]!,
      value: randomDigits(DIGITS_PER_TRIAL),
    });
  }
  return out;
}

/**
 * Record a typed answer. Pass `null` for CANNOT READ: that is stored as an
 * explicit "could not identify" response, never as a guess.
 */
export function recordAcuityAnswer(
  answers: AcuityAnswer[],
  trial: AcuityTrial,
  entry: string | null,
): AcuityAnswer[] {
  const next = answers.filter((a) => a.trialIndex !== trial.index);
  const cleaned = entry === null ? null : entry.trim().replace(/\s+/g, "");
  next.push({
    trialIndex: trial.index,
    entry: cleaned,
    cannotRead: cleaned === null,
    correct: cleaned !== null && cleaned === trial.value,
  });
  return next.sort((a, b) => a.trialIndex - b.trialIndex);
}

export function calculateAcuityResult(
  trials: AcuityTrial[],
  answers: AcuityAnswer[],
): AcuityResult {
  const total = trials.length;
  const byIndex = new Map(answers.map((a) => [a.trialIndex, a]));
  let correctCount = 0;
  let smallestCorrectLevel = -1;
  // consistentLevel = deepest level reached while tolerating at most one miss
  // along the way, so a single slip does not decide the whole screening.
  let consistentLevel = -1;
  let errorsSoFar = 0;
  let reversals = 0;
  let largeErrors = 0;
  let missedEarlier = false;

  for (const t of trials) {
    const a = byIndex.get(t.index);
    if (!a) continue;
    if (a.correct) {
      correctCount++;
      smallestCorrectLevel = Math.max(smallestCorrectLevel, t.index);
      if (errorsSoFar <= MAX_LARGE_SIZE_ERRORS) consistentLevel = t.index;
      if (missedEarlier) reversals++;
    } else {
      errorsSoFar++;
      missedEarlier = true;
      if (t.index <= LARGE_SIZE_LEVEL) largeErrors++;
    }
  }

  let outcome: AcuityOutcome;
  if (answers.length < total) {
    outcome = "inconclusive";
  } else if (largeErrors > MAX_LARGE_SIZE_ERRORS || reversals > MAX_REVERSALS) {
    // Contradictory responding: missed easy sizes, or read smaller ones after
    // missing larger ones. Not enough consistency for a screening statement.
    outcome = "inconclusive";
  } else if (consistentLevel >= ACUITY_PASS_LEVEL) {
    outcome = "good";
  } else {
    outcome = "reduced";
  }

  return {
    outcome,
    correctCount,
    totalTrials: total,
    smallestCorrectLevel,
    consistentLevel,
    reversals,
  };
}

export function resetAcuitySession(): { trials: AcuityTrial[]; answers: AcuityAnswer[] } {
  return { trials: generateAcuityTest(), answers: [] };
}
