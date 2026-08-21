import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { FanChart } from "@/components/FanChart";
import {
  NUMBER_OF_TRIALS,
  calculateResult,
  incrementVisitorCount,
  readVisitorCount,
  recordAnswer,
  resetSession,
  type Answer,
  type ScreeningResult,
  type Trial,
} from "@/lib/astigmatism";
import {
  calculateAcuityResult,
  recordAcuityAnswer,
  resetAcuitySession,
  type AcuityAnswer,
  type AcuityResult,
  type AcuityTrial,
} from "@/lib/acuity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beyond Sight" },
      {
        name: "description",
        content:
          "An interactive school-exhibition demonstration of astigmatism and visual acuity screening. Educational screening only, not a medical diagnosis.",
      },
      { property: "og:title", content: "Beyond Sight" },
      {
        property: "og:description",
        content:
          "An interactive school-exhibition demonstration of astigmatism and visual acuity screening. Educational screening only, not a medical diagnosis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Screen =
  | "home"
  | "instructions"
  | "correction"
  | "setup"
  | "test"
  | "results"
  | "acuity-instructions"
  | "acuity-correction"
  | "acuity-test"
  | "acuity-results";

const LETTERS = ["A", "B", "C", "D"];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <span className="text-sm font-medium tracking-wide text-muted-foreground">
            Educational screening demonstration
          </span>
          <FullscreenButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-4 text-sm text-muted-foreground">
          This is an educational screening demonstration, not a medical diagnostic test. Only an eye-care
          professional can diagnose eye conditions.
        </div>
      </footer>
    </div>
  );
}

function FullscreenButton() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setSupported(typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
    const onChange = () => setActive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* Fullscreen denied — the app keeps working normally. */
    }
  };

  return (
    <button type="button" onClick={toggle} className="btn-quiet">
      {active ? "EXIT FULLSCREEN" : "FULLSCREEN"}
    </button>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>("home");

  // Astigmatism session state (session-only, never persisted).
  const [trials, setTrials] = useState<Trial[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  // Visual acuity session state (session-only, never persisted).
  const [aTrials, setATrials] = useState<AcuityTrial[]>([]);
  const [aAnswers, setAAnswers] = useState<AcuityAnswer[]>([]);
  const [aCurrent, setACurrent] = useState(0);
  const [aSelected, setASelected] = useState<string | null>(null);
  const [aResult, setAResult] = useState<AcuityResult | null>(null);

  const [error, setError] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [visitors, setVisitors] = useState(0);

  useEffect(() => setVisitors(readVisitorCount()), []);

  const reset = useCallback(() => {
    const s = resetSession();
    setTrials(s.trials);
    setAnswers(s.answers);
    setCurrent(0);
    setSelected(null);
    const a = resetAcuitySession();
    setATrials(a.trials);
    setAAnswers(a.answers);
    setACurrent(0);
    setASelected(null);
    setError("");
    setCorrection(null);
    setResult(null);
    setAResult(null);
  }, []);

  const goHome = () => {
    reset();
    setScreen("home");
  };

  const startTrials = () => {
    const s = resetSession();
    setTrials(s.trials);
    setAnswers(s.answers);
    setCurrent(0);
    setSelected(null);
    setError("");
    setScreen("test");
  };

  const startAcuityTrials = () => {
    const a = resetAcuitySession();
    setATrials(a.trials);
    setAAnswers(a.answers);
    setACurrent(0);
    setASelected(null);
    setError("");
    setScreen("acuity-test");
  };

  const next = () => {
    if (selected === null) {
      setError("Please select an answer to continue.");
      return;
    }
    const trial = trials[current];
    if (!trial) return;
    const updated = recordAnswer(answers, trial.index, trial.options[selected]!);
    setAnswers(updated);
    setSelected(null);
    setError("");
    if (current + 1 < trials.length) {
      setCurrent(current + 1);
    } else {
      setResult(calculateResult(trials, updated));
      setVisitors(incrementVisitorCount());
      setScreen("results");
    }
  };

  const acuityNext = () => {
    if (aSelected === null) {
      setError("Please select an answer to continue.");
      return;
    }
    const trial = aTrials[aCurrent];
    if (!trial) return;
    const updated = recordAcuityAnswer(aAnswers, trial, aSelected);
    setAAnswers(updated);
    setASelected(null);
    setError("");
    if (aCurrent + 1 < aTrials.length) {
      setACurrent(aCurrent + 1);
    } else {
      setAResult(calculateAcuityResult(aTrials, updated));
      setVisitors(incrementVisitorCount());
      setScreen("acuity-results");
    }
  };

  // ------------------------------------------------------------------ home
  if (screen === "home") {
    return (
      <Shell>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Beyond Sight</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Interactive demonstrations of how the human eye focuses light and resolves fine detail.
        </p>
        <p className="mt-6 text-lg">Choose a screening to try.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              reset();
              setScreen("instructions");
            }}
          >
            ASTIGMATISM
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              reset();
              setScreen("acuity-instructions");
            }}
          >
            MYOPIA / HYPERMETROPIA
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Educational screening only — not a medical diagnosis.
        </p>
        {visitors > 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Tests taken on this laptop: {visitors}</p>
        )}
      </Shell>
    );
  }

  // ---------------------------------------------------- astigmatism: intro
  if (screen === "instructions") {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">Before you start</h1>
        <ul className="mt-6 space-y-3 text-lg">
          <li>Sit comfortably in front of the laptop.</li>
          <li>Keep your face approximately 40–60 cm from the screen.</li>
          <li>Keep the screen brightness at a normal, comfortable level.</li>
          <li>Avoid strong glare or direct light reflected on the screen.</li>
          <li>Keep your head reasonably straight.</li>
          <li>If you normally use glasses for seeing the screen clearly, keep them on.</li>
          <li>Answer based on what you actually see. There are no “correct” answers.</li>
          <li>Do not squint.</li>
        </ul>
        <p className="mt-6 text-lg text-muted-foreground">The test takes about 2–3 minutes.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => setScreen("correction")}>
            CONTINUE
          </button>
          <button type="button" className="btn-quiet" onClick={goHome}>
            BACK TO HOME
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "correction" || screen === "acuity-correction") {
    const options = ["Glasses", "Contact lenses", "Neither", "Prefer not to say"];
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">Do you normally use vision correction?</h1>
        <p className="mt-4 text-muted-foreground">
          Keep your normal glasses or contact lenses on. This answer is not stored anywhere.
        </p>
        <div className="mt-8 grid gap-3">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setCorrection(o)}
              aria-pressed={correction === o}
              className={correction === o ? "btn-option btn-option-selected" : "btn-option"}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (!correction) {
                setError("Please select an answer to continue.");
                return;
              }
              setError("");
              if (screen === "correction") setScreen("setup");
              else startAcuityTrials();
            }}
          >
            CONTINUE
          </button>
          <button type="button" className="btn-quiet" onClick={goHome}>
            BACK TO HOME
          </button>
        </div>
        {error && <p className="mt-3 text-base font-medium text-destructive">{error}</p>}
      </Shell>
    );
  }

  if (screen === "setup") {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">Get ready</h1>
        <ul className="mt-6 space-y-3 text-lg">
          <li>You will see a pattern of lines pointing in different directions.</li>
          <li>For each question, choose the group of lines that looks darkest or sharpest to you.</li>
          <li>Look at the centre of the pattern.</li>
          <li>Do not move closer to the screen to inspect it.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={startTrials}>
            BEGIN TEST
          </button>
          <button type="button" className="btn-quiet" onClick={goHome}>
            BACK TO HOME
          </button>
        </div>
      </Shell>
    );
  }

  // ---------------------------------------------------- astigmatism: trials
  if (screen === "test") {
    const trial = trials[current];
    if (!trial) {
      return (
        <Shell>
          <p className="text-lg">Session ended.</p>
          <button type="button" className="btn-primary mt-6" onClick={goHome}>
            BACK TO HOME
          </button>
        </Shell>
      );
    }
    return (
      <Shell>
        <p className="text-sm font-medium text-muted-foreground">
          Question {current + 1} of {trials.length}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Which lines look darkest or sharpest?
        </h1>
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-[420px]">
            <FanChart rotation={trial.chartRotation} optionOrientations={trial.options} />
          </div>
        </div>
        <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3">
          {trial.options.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelected(i);
                setError("");
              }}
              aria-pressed={selected === i}
              className={selected === i ? "btn-option btn-option-selected" : "btn-option"}
            >
              {LETTERS[i]}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center">
          <button type="button" className="btn-primary" onClick={next}>
            {current + 1 === trials.length ? "SEE RESULT" : "NEXT"}
          </button>
          {error && <p className="mt-3 text-base font-medium text-destructive">{error}</p>}
        </div>
      </Shell>
    );
  }

  // --------------------------------------------------- acuity: instructions
  if (screen === "acuity-instructions") {
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">Visual Acuity Screening</h1>
        <ul className="mt-6 space-y-3 text-lg">
          <li>Sit approximately 40–50 cm from the screen.</li>
          <li>Keep your normal glasses or contact lenses on.</li>
          <li>Keep the laptop screen at a comfortable normal brightness.</li>
          <li>Do not move closer to the screen to read the numbers.</li>
          <li>Read the numbers normally and choose what you actually see.</li>
        </ul>
        <p className="mt-6 text-lg text-muted-foreground">
          Visual acuity screening cannot determine which refractive error is responsible for reduced vision.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => setScreen("acuity-correction")}>
            CONTINUE
          </button>
          <button type="button" className="btn-quiet" onClick={goHome}>
            BACK TO HOME
          </button>
        </div>
      </Shell>
    );
  }

  // --------------------------------------------------------- acuity: trials
  if (screen === "acuity-test") {
    const trial = aTrials[aCurrent];
    if (!trial) {
      return (
        <Shell>
          <p className="text-lg">Session ended.</p>
          <button type="button" className="btn-primary mt-6" onClick={goHome}>
            BACK TO HOME
          </button>
        </Shell>
      );
    }
    return (
      <Shell>
        <p className="text-sm font-medium text-muted-foreground">
          Question {aCurrent + 1} of {aTrials.length}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Which number do you see?</h1>
        <div className="mt-8 flex min-h-[140px] items-center justify-center border border-border">
          <span
            aria-label="Displayed number"
            style={{
              fontSize: `${trial.sizePx}px`,
              lineHeight: 1.2,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
              letterSpacing: "0.12em",
            }}
          >
            {trial.value}
          </span>
        </div>
        <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3">
          {trial.choices.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setASelected(c);
                setError("");
              }}
              aria-pressed={aSelected === c}
              className={aSelected === c ? "btn-option btn-option-selected" : "btn-option"}
            >
              {LETTERS[i]}: {c}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center">
          <button type="button" className="btn-primary" onClick={acuityNext}>
            {aCurrent + 1 === aTrials.length ? "SEE RESULT" : "NEXT"}
          </button>
          {error && <p className="mt-3 text-base font-medium text-destructive">{error}</p>}
        </div>
      </Shell>
    );
  }

  // -------------------------------------------------------- acuity: results
  if (screen === "acuity-results") {
    const r = aResult;
    return (
      <Shell>
        {r && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              {r.outcome === "good"
                ? "No reduced visual acuity detected"
                : r.outcome === "reduced"
                  ? "Reduced visual acuity detected"
                  : "Screening inconclusive"}
            </h1>

            {r.outcome === "good" && (
              <div className="mt-6 space-y-4 text-lg">
                <p>You were able to identify the smaller numbers in this screening.</p>
                <p>
                  This does not rule out myopia, hypermetropia, astigmatism, or other vision conditions.
                </p>
              </div>
            )}

            {r.outcome === "reduced" && (
              <div className="mt-6 space-y-4 text-lg">
                <p>
                  Your responses suggest that you may have difficulty resolving smaller visual details at
                  the tested distance.
                </p>
                <p>
                  This screening cannot determine the cause. Reduced visual acuity can have several causes,
                  including refractive errors such as myopia or hypermetropia.
                </p>
                <p>Consider getting your vision checked by an eye-care professional.</p>
              </div>
            )}

            {r.outcome === "inconclusive" && (
              <div className="mt-6 space-y-4 text-lg">
                <p>Your responses were not consistent enough to produce a clear screening result.</p>
                <p>If you have concerns about your vision, consider an eye examination.</p>
              </div>
            )}

            <div className="mt-8 border-t border-border pt-6 text-lg">
              <p>
                Correct answers: {r.correctCount}/{r.totalTrials}
              </p>
              <p>Smallest size read consistently: level {r.consistentLevel + 1} of {r.totalTrials}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                      startAcuityTrials();
                }}
              >
                TEST AGAIN
              </button>
              <button type="button" className="btn-quiet" onClick={goHome}>
                BACK TO HOME
              </button>
            </div>
          </>
        )}
      </Shell>
    );
  }

  // --------------------------------------------------- astigmatism: results
  const r = result;
  return (
    <Shell>
      {r && (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">
            {r.outcome === "positive"
              ? "Possible indication of astigmatism"
              : r.outcome === "negative"
                ? "No clear indication detected"
                : "Screening inconclusive"}
          </h1>

          {r.outcome === "positive" && (
            <div className="mt-6 space-y-4 text-lg">
              <p>
                Your responses showed a consistent directional difference in how you perceived the line
                pattern.
              </p>
              <p>This can be associated with astigmatism, but this screening cannot diagnose it.</p>
              <p>Consider getting your vision checked by an eye-care professional.</p>
              <p className="border border-border p-4 text-lg font-semibold">
                Only an eye-care professional can diagnose astigmatism.
              </p>
            </div>
          )}

          {r.outcome === "negative" && (
            <div className="mt-6 space-y-4 text-lg">
              <p>This screening did not find a clear directional pattern in your responses.</p>
              <p>This does not rule out astigmatism or other vision problems.</p>
            </div>
          )}

          {r.outcome === "inconclusive" && (
            <div className="mt-6 space-y-4 text-lg">
              <p>Your responses did not produce a clear enough pattern for this screening.</p>
              <p>If you have concerns about your vision, consider getting an eye examination.</p>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-6 text-lg">
            <p>
              Directional preference: {r.clusterCount}/{r.totalTrials}
            </p>
            <p>
              Cross-check agreement: {r.crossCheckAgreed}/{r.crossCheckPairs} repeated pairs
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                  startTrials();
              }}
            >
              TEST AGAIN
            </button>
            <button type="button" className="btn-quiet" onClick={goHome}>
              BACK TO HOME
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}

void NUMBER_OF_TRIALS;
