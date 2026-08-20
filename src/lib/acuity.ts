// ---------------------------------------------------------------------------
// Visual acuity screening demonstration - configuration & scoring
//
// EXHIBITION SCREENING ONLY. This does not measure acuity clinically, does not
// produce a prescription, and cannot tell myopia from hypermetropia or any
// other cause of reduced vision.
//
// Structure: 10 typed-entry trials over a descending size ladder. Two size
// levels are repeated so the visitor's threshold can be confirmed instead of
// being decided by a single lucky or unlucky trial.
// ---------------------------------------------------------------------------

/** Trials in one acuity session. */
export const ACUITY_TRIALS = 10;
/**
 * Digit heights in CSS pixels for each trial, progressively smaller. Levels 4
 * and 8 repeat the preceding size so the threshold can be confirmed.
 */
export const ACUITY_SIZES_PX = [88, 68, 54, 44, 44, 35, 28, 22, 22, 17];
/** Digits used - visually unambiguous in a plain sans font. */
export const ACUITY_DIGITS = ["2", "3", "4", "5", "6", "8", "9"];
/** Digits shown per trial. */
export const DIGITS_PER_TRIAL = 3;
/**
 * Smallest size (px) the visitor must resolve consistently to count as good
 * acuity in this screening. Not a clinical threshold.
 */
export const ACUITY_PASS_SIZE_PX = 28;
/** Sizes at or above this are considered "easy"; misses here are suspicious. */
export const LARGE_SIZE_PX = 54;
/** Easy-size misses tolerated before the session is called inconclusive. */
export const MAX_LARGE_SIZE_ERRORS = 1;
/** Correct answers at sizes below a failed threshold tolerated before inconclusive. */
export const MAX_REVERSALS = 2;
/** Fraction of trials at a size that must be correct for that size to pass. */
export const LEVEL_PASS_FRACTION = 0.5;

export type AcuityTrial = {
  index: number;
  /** Digit height in px for this trial. */
  sizePx: number;
  /** The digit string actually displayed. */
  value: string;
};

export type AcuityAnswer = {
  trialIndex: number;
  /** Exactly what the visitor typed (empty when they chose CANNOT READ). */
  typed: string;
  /** True when the visitor pressed CANNOT READ instead of typing. */
  cannotRead: boolean;
  correct: boolean;
};

export type AcuityOutcome = "good" | "reduced" | "inconclusive";

export type AcuityResult = {
  outcome: AcuityOutcome;
  correctCount: number;
  totalTrials: number;
  cannotReadCount: number;
  /** Smallest size (px) resolved consistently, with all larger sizes passed. */
  thresholdSizePx: number | null;
  /** Smallest size (px) answered correctly at least once (null when none). */
  smallestCorrectSizePx: number | null;
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

/** Strip whitespace and any non-digit characters before comparing. */
export function normalizeTypedAnswer(input: string): string {
  return input.replace(/\D/g, "");
}

export function recordAcuityAnswer(
  answers: AcuityAnswer[],
  trial: AcuityTrial,
  typed: string,
  cannotRead = false,
): AcuityAnswer[] {
  const clean = cannotRead ? "" : normalizeTypedAnswer(typed);
  const next = answers.filter((a) => a.trialIndex !== trial.index);
  next.push({
    trialIndex: trial.index,
    typed: clean,
    cannotRead,
    correct: !cannotRead && clean === trial.value,
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
  let cannotReadCount = 0;
  let largeErrors = 0;
  let smallestCorrectSizePx: number | null = null;

  // Group results by size level so repeated sizes confirm each other.
  const levels = new Map<number, { correct: number; attempted: number }>();
  for (const t of trials) {
    const a = byIndex.get(t.index);
    if (!a) continue;
    const level = levels.get(t.sizePx) ?? { correct: 0, attempted: 0 };
    level.attempted++;
    if (a.correct) {
      level.correct++;
      correctCount++;
      if (smallestCorrectSizePx === null || t.sizePx < smallestCorrectSizePx)
        smallestCorrectSizePx = t.sizePx;
    } else {
      if (a.cannotRead) cannotReadCount++;
      if (t.sizePx >= LARGE_SIZE_PX) largeErrors++;
    }
    levels.set(t.sizePx, level);
  }

  // Threshold: the smallest size that passes, with every larger size also
  // passing. A single miss at one size therefore does not end the ladder,
  // and a single lucky small read does not extend it.
  const sizesDescending = [...levels.keys()].sort((a, b) => b - a);
  let thresholdSizePx: number | null = null;
  for (const size of sizesDescending) {
    const level = levels.get(size)!;
    const passed = level.attempted > 0 && level.correct / level.attempted >= LEVEL_PASS_FRACTION;
    if (!passed) break;
    thresholdSizePx = size;
  }

  // Reversals: correct reads at sizes smaller than the failed threshold.
  let reversals = 0;
  if (thresholdSizePx !== null) {
    for (const t of trials) {
      const a = byIndex.get(t.index);
      if (a?.correct && t.sizePx < thresholdSizePx) reversals++;
    }
  } else if (smallestCorrectSizePx !== null) {
    reversals = correctCount;
  }

  let outcome: AcuityOutcome;
  if (answers.length < total) {
    outcome = "inconclusive";
  } else if (largeErrors > MAX_LARGE_SIZE_ERRORS || reversals > MAX_REVERSALS) {
    // Missed easy sizes, or read smaller ones after failing larger ones:
    // not consistent enough for a screening statement.
    outcome = "inconclusive";
  } else if (thresholdSizePx !== null && thresholdSizePx <= ACUITY_PASS_SIZE_PX) {
    outcome = "good";
  } else if (thresholdSizePx === null) {
    outcome = "inconclusive";
  } else {
    outcome = "reduced";
  }

  return {
    outcome,
    correctCount,
    totalTrials: total,
    cannotReadCount,
    thresholdSizePx,
    smallestCorrectSizePx,
    reversals,
  };
}

export function resetAcuitySession(): { trials: AcuityTrial[]; answers: AcuityAnswer[] } {
  return { trials: generateAcuityTest(), answers: [] };
}
