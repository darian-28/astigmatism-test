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
/** Multiple-choice options per trial. */
export const CHOICES_PER_TRIAL = 4;
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
  /** Multiple-choice options in randomized order (one is `value`). */
  choices: string[];
};

export type AcuityAnswer = { trialIndex: number; choice: string; correct: boolean };

export type AcuityOutcome = "good" | "reduced" | "inconclusive";

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

function mutate(value: string): string {
  const pos = randInt(value.length);
  let d = value[pos]!;
  while (d === value[pos]) d = ACUITY_DIGITS[randInt(ACUITY_DIGITS.length)]!;
  return value.slice(0, pos) + d + value.slice(pos + 1);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function generateAcuityTest(trials: number = ACUITY_TRIALS): AcuityTrial[] {
  const out: AcuityTrial[] = [];
  for (let i = 0; i < trials; i++) {
    const value = randomDigits(DIGITS_PER_TRIAL);
    const set = new Set<string>([value]);
    let guard = 0;
    while (set.size < CHOICES_PER_TRIAL && guard++ < 50) set.add(mutate(value));
    out.push({
      index: i,
      sizePx: ACUITY_SIZES_PX[i] ?? ACUITY_SIZES_PX[ACUITY_SIZES_PX.length - 1]!,
      value,
      choices: shuffle([...set]),
    });
  }
  return out;
}

export function recordAcuityAnswer(
  answers: AcuityAnswer[],
  trial: AcuityTrial,
  choice: string,
): AcuityAnswer[] {
  const next = answers.filter((a) => a.trialIndex !== trial.index);
  next.push({ trialIndex: trial.index, choice, correct: choice === trial.value });
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
  let consistentLevel = -1;
  let stillConsistent = true;
  let reversals = 0;
  let largeErrors = 0;
  let missedEarlier = false;

  for (const t of trials) {
    const a = byIndex.get(t.index);
    if (!a) continue;
    if (a.correct) {
      correctCount++;
      smallestCorrectLevel = Math.max(smallestCorrectLevel, t.index);
      if (stillConsistent) consistentLevel = t.index;
      if (missedEarlier) reversals++;
    } else {
      stillConsistent = false;
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
