import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
export function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <i />
        <i />
      </span>
      <span>doppel</span>
    </div>
  );
}
export function Target({ target, children, ...props }) {
  return (
    <button
      {...props}
      className={"target " + (props.className || "")}
      style={{
        left: target.x * 100 + "%",
        top: target.y * 100 + "%",
        width: target.w * 100 + "%",
        height: target.h * 100 + "%",
      }}
    >
      {children}
    </button>
  );
}
export default function Player({ walkthrough, onClose, preview = false }) {
  const [index, setIndex] = useState(0),
    [misses, setMisses] = useState(0),
    [hint, setHint] = useState(false),
    [feedback, setFeedback] = useState("");
  const done = index >= walkthrough.steps.length;
  const step = walkthrough.steps[index];
  function advance(e) {
    e.stopPropagation();
    setIndex((i) => i + 1);
    setHint(false);
    setFeedback("");
    if (index + 1 === walkthrough.steps.length && !preview) {
      try {
        localStorage.setItem(
          "doppel-completed-" + walkthrough.id,
          new Date().toISOString(),
        );
      } catch {}
    }
  }
  function restart() {
    setIndex(0);
    setMisses(0);
    setHint(false);
    setFeedback("");
  }
  return (
    <div className="player">
      <header className="topbar">
        <Logo />
        <span className="player-title">{walkthrough.title}</span>
        {onClose ? (
          <button className="button" onClick={onClose}>
            <ArrowLeft size={16} /> Back to editor
          </button>
        ) : (
          <span className="safe-label">A safe place to practice</span>
        )}
      </header>
      <main className="player-main">
        {done ? (
          <section className="completion">
            <div className="success-icon">
              <CheckCircle2 size={42} />
            </div>
            <p className="eyebrow">PRACTICE MAKES PROGRESS</p>
            <h1>You’ve got this.</h1>
            <p>
              You completed “{walkthrough.title}”.
              <br />
              Now you’re ready for the real thing.
            </p>
            <div className="completion-stats">
              <span>
                <b>{walkthrough.steps.length}</b> steps completed
              </span>
              <span>
                <b>{misses}</b> learning moments
              </span>
            </div>
            <button className="button primary" onClick={restart}>
              <RotateCcw size={17} /> Practice again
            </button>
          </section>
        ) : (
          <>
            <div className="player-intro">
              <p className="eyebrow">YOUR PRACTICE RUN</p>
              <h1>{walkthrough.title}</h1>
              <p>{walkthrough.goal}</p>
            </div>
            <div
              className="progress-track"
              aria-label={`Step ${index + 1} of ${walkthrough.steps.length}`}
            >
              {walkthrough.steps.map((s, i) => (
                <span key={s.id} className={i <= index ? "active" : ""} />
              ))}
            </div>
            <div className="lesson-layout">
              <div
                className="screenshot player-screen"
                onClick={() => {
                  setMisses((m) => m + 1);
                  setHint(true);
                  setFeedback(
                    step.hint || "Not quite. Try the highlighted target.",
                  );
                }}
              >
                <img
                  src={step.image}
                  alt={`Practice screen: ${step.title}`}
                  draggable="false"
                />
                <Target
                  target={step.target}
                  className={hint ? "revealed" : "quiet"}
                  aria-label={step.instruction}
                  onClick={advance}
                >
                  <span className="sr-only">{step.instruction}</span>
                </Target>
              </div>
              <aside className="coach">
                <div className="coach-top">
                  <span className="step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    of {String(walkthrough.steps.length).padStart(2, "0")} steps
                  </span>
                </div>
                <h2>{step.title}</h2>
                <p>{step.instruction}</p>
                <div className="coach-divider" />
                <p className="coach-note">
                  Go ahead, try it. Nothing you do here changes the real app.
                </p>
                <button
                  className="button hint-button"
                  onClick={() => {
                    setHint((h) => !h);
                    setFeedback(hint ? "" : step.hint);
                  }}
                >
                  <Lightbulb size={17} />
                  {hint ? "Hide hint" : "Show me a hint"}
                </button>
                <div className="feedback" aria-live="polite">
                  {feedback}
                </div>
                <ul className="checklist">
                  {walkthrough.steps.map((s, i) => (
                    <li key={s.id} className={i < index ? "checked" : ""}>
                      {i < index ? (
                        <Check size={15} />
                      ) : (
                        <span className="check-dot" />
                      )}
                      {s.title}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
            <div className="player-bottom">
              <span>
                Learn by doing. Powered by <b>doppel</b>.
              </span>
              <button className="text-button" onClick={restart}>
                <RotateCcw size={14} /> Restart
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
