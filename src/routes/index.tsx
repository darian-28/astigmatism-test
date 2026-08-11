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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Test for Astigmatism — Educational Screening Demonstration" },
      {
        name: "description",
        content:
          "An interactive school-exhibition demonstration of how the eye focuses lines at different orientations. Educational screening only, not a medical diagnosis.",
      },
      { property: "og:title", content: "Test for Astigmatism — Educational Screening Demonstration" },
      {
        property: "og:description",
        content:
          "A simple fan-chart visual demonstration showing how line orientation can appear different to the eye. Not a medical diagnostic test.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Screen = "welcome" | "instructions" | "correction" | "setup" | "test" | "results";
const LETTERS = ["A", "B", "C"];

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
          This is not a medical diagnostic test. Only an eye-care professional can diagnose astigmatism.
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
  const [screen, setScreen] = useState<Screen>("welcome");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [visitors, setVisitors] = useState(0);

  useEffect(() => setVisitors(readVisitorCount()), []);

  const reset = useCallback(() => {
    const s = resetSession();
    setTrials(s.trials);
    setAnswers(s.answers);
    setCurrent(0);
    setSelected(null);
    setError("");
    setCorrection(null);
    setResult(null);
  }, []);

  const startTrials = () => {
    const s = resetSession();
    setTrials(s.trials);
    setAnswers(s.answers);
    setCurrent(0);
    setSelected(null);
    setError("");
    setScreen("test");
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

  if (screen === "welcome") {
    return (
      <Shell>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Test for Astigmatism</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          An interactive demonstration of how the human eye focuses light in different directions.
        </p>
        <p className="mt-6 text-lg">
          Look carefully at the line patterns and tell us which direction appears darkest or sharpest.
        </p>
        <button type="button" className="btn-primary mt-10" onClick={() => setScreen("instructions")}>
          START TEST
        </button>
        <p className="mt-3 text-sm text-muted-foreground">
          Educational screening only — not a medical diagnosis.
        </p>
        {visitors > 0 && (
          <p className="mt-8 text-sm text-muted-foreground">Visitors tested on this laptop: {visitors}</p>
        )}
      </Shell>
    );
  }

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
        <button type="button" className="btn-primary mt-8" onClick={() => setScreen("correction")}>
          CONTINUE
        </button>
      </Shell>
    );
  }

  if (screen === "correction") {
    const options = ["Glasses", "Contact lenses", "Neither", "Prefer not to say"];
    return (
      <Shell>
        <h1 className="text-3xl font-semibold tracking-tight">Do you normally use vision correction?</h1>
        <p className="mt-4 text-muted-foreground">
          Stay in your usual, comfortable viewing condition. This answer is not stored anywhere.
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
        <button
          type="button"
          className="btn-primary mt-8"
          onClick={() => {
            if (!correction) {
              setError("Please select an answer to continue.");
              return;
            }
            setError("");
            setScreen("setup");
          }}
        >
          CONTINUE
        </button>
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
        <button type="button" className="btn-primary mt-8" onClick={startTrials}>
          BEGIN TEST
        </button>
      </Shell>
    );
  }

  if (screen === "test") {
    const trial = trials[current];
    if (!trial) {
      return (
        <Shell>
          <p className="text-lg">Session ended.</p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => {
              reset();
              setScreen("welcome");
            }}
          >
            RESTART
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

  // results
  const r = result;
  return (
    <Shell>
      {r && (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">
            {r.outcome === "positive"
              ? "Possible indication of astigmatism"
              : r.outcome === "negative"
                ? "No indication detected"
                : "Screening inconclusive"}
          </h1>

          {r.outcome === "positive" && (
            <div className="mt-6 space-y-4 text-lg">
              <p>
                Your responses showed a consistent difference in how you perceived lines at different
                orientations.
              </p>
              <p>This can be associated with astigmatism, but this screening cannot diagnose it.</p>
              <h2 className="pt-2 text-xl font-semibold">What should you do?</h2>
              <ul className="space-y-2">
                <li>Consider getting a comprehensive eye examination.</li>
                <li>Tell the eye-care professional about any blurred or distorted vision you experience.</li>
                <li>
                  If you already wear glasses or contact lenses, bring your current prescription information
                  if available.
                </li>
                <li>Do not change your glasses or contact lenses based on this test alone.</li>
              </ul>
              <p className="border border-border p-4 text-lg font-semibold">
                Only an eye-care professional can diagnose astigmatism.
              </p>
            </div>
          )}

          {r.outcome === "negative" && (
            <div className="mt-6 space-y-4 text-lg">
              <p>This screening did not find a clear directional pattern in your responses.</p>
              <p>This does not prove that your vision is free from astigmatism or other eye problems.</p>
              <p>
                If you experience blurred, distorted, uncomfortable, or otherwise unusual vision, consider
                getting your eyes checked by an eye-care professional.
              </p>
            </div>
          )}

          {r.outcome === "inconclusive" && (
            <div className="mt-6 space-y-4 text-lg">
              <p>Your answers did not produce a clear enough pattern for this demonstration.</p>
              <p>
                This result is not a diagnosis. If you have concerns about your vision, consider a
                professional eye examination.
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-6 text-lg">
            <p>
              Response consistency: {r.clusterCount}/{r.totalTrials}
            </p>
            <p>
              Directional pattern:{" "}
              {r.outcome === "positive" ? "Consistent" : r.outcome === "negative" ? "Not consistent" : "Unclear"}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                reset();
                setScreen("welcome");
                setScreen("instructions");
              }}
            >
              {r.outcome === "inconclusive" ? "TRY AGAIN" : "TEST AGAIN"}
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                reset();
                setScreen("welcome");
              }}
            >
              {r.outcome === "inconclusive" ? "FINISH" : "DONE"}
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}

void NUMBER_OF_TRIALS;
