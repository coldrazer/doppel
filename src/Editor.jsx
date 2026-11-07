import React, { useRef, useState } from "react";
import {
  Plus,
  Play,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles,
  Crosshair,
  Check,
  Download,
  FilePlus2,
  LoaderCircle,
  ImagePlus,
} from "lucide-react";
import { Logo, Target } from "./Player.jsx";
import { readScreenshot } from "./data.js";
export default function Editor({
  draft,
  setDraft,
  saveState,
  onPreview,
  onPublish,
  onAnalyze,
  busy,
  analyzing,
  onExport,
  onNew,
  onDemo,
  notify,
}) {
  const [selected, setSelected] = useState(0),
    [placing, setPlacing] = useState(false),
    [dragging, setDragging] = useState(false);
  const input = useRef();
  const index = Math.min(selected, Math.max(0, draft.steps.length - 1));
  const step = draft.steps[index];
  function updateStep(patch) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }
  async function upload(files) {
    try {
      if (draft.steps.length + files.length > 12)
        throw new Error("A walkthrough can have up to 12 screenshots.");
      const steps = await Promise.all([...files].map(readScreenshot));
      setDraft((d) => ({ ...d, steps: [...d.steps, ...steps] }));
      setSelected(draft.steps.length);
      notify(
        `${steps.length} screenshot${steps.length === 1 ? "" : "s"} added. Place a target or generate with AI.`,
      );
    } catch (e) {
      notify(e.message, "error");
    }
    if (input.current) input.current.value = "";
  }
  function move(direction) {
    const next = index + direction;
    if (next < 0 || next >= draft.steps.length) return;
    setDraft((d) => {
      const steps = [...d.steps];
      [steps[index], steps[next]] = [steps[next], steps[index]];
      return { ...d, steps };
    });
    setSelected(next);
  }
  function place(e) {
    if (!placing || !step) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        1 - step.target.w,
        (e.clientX - rect.left) / rect.width - step.target.w / 2,
      ),
    );
    const y = Math.max(
      0,
      Math.min(
        1 - step.target.h,
        (e.clientY - rect.top) / rect.height - step.target.h / 2,
      ),
    );
    updateStep({ target: { ...step.target, x, y } });
    setPlacing(false);
  }
  function resize(key, value) {
    const number = Math.max(1, Math.min(80, Number(value) || 1)) / 100;
    const t = { ...step.target, [key]: number };
    t.x = Math.min(t.x, 1 - t.w);
    t.y = Math.min(t.y, 1 - t.h);
    updateStep({ target: t });
  }
  return (
    <div className="editor">
      <header className="topbar">
        <Logo />
        <input
          className="title-input"
          aria-label="Walkthrough title"
          maxLength={160}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <div className="header-actions">
          <button
            className="button"
            disabled={!step || busy}
            onClick={onPreview}
          >
            <Play size={15} />
            Preview
          </button>
          <button
            className="button primary"
            disabled={!step || busy}
            onClick={onPublish}
          >
            Publish
          </button>
        </div>
      </header>
      <div className="breadcrumb">
        <span>Workspace</span>
        <span>/</span>
        <span>
          {draft.title === "Submit your first expense"
            ? "Expense onboarding"
            : draft.title || "Untitled walkthrough"}
        </span>
        <div className="breadcrumb-actions">
          <button className="text-button" onClick={onNew} disabled={busy}>
            <FilePlus2 size={14} />
            New walkthrough
          </button>
          <button
            className="text-button"
            onClick={onExport}
            disabled={!step || busy}
          >
            <Download size={14} />
            Export HTML
          </button>
        </div>
      </div>
      <div className="workspace">
        <aside className="steps-panel panel">
          <div className="panel-heading">
            <h2>Your walkthrough</h2>
            <span className="count">{draft.steps.length}</span>
          </div>
          <div className="steps-list">
            {draft.steps.map((s, i) => (
              <button
                key={s.id}
                className={"step-row " + (i === index ? "selected" : "")}
                onClick={() => {
                  setSelected(i);
                  setPlacing(false);
                }}
              >
                <span className="step-index">{i + 1}</span>
                <img src={s.image} alt="" />
                <span>{s.title || "Untitled step"}</span>
              </button>
            ))}
            {!step && (
              <p className="empty-steps">
                Every journey starts with a first screen.
              </p>
            )}
          </div>
          <button
            className="upload-button"
            disabled={busy}
            onClick={() => input.current.click()}
          >
            <Plus size={20} />
            Add screenshots
          </button>
          <p className="upload-help">PNG, JPG or WebP · up to 12 screens</p>
          <input
            ref={input}
            className="sr-only"
            aria-label="Upload screenshots"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => upload(e.target.files)}
          />
        </aside>
        <main
          className={"canvas-area " + (dragging ? "dragging" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy) upload(e.dataTransfer.files);
          }}
        >
          <div className="canvas-intro">
            <h1>
              A little practice. <br />A lot of confidence.
            </h1>
            <p>Turn your product into a place to learn by doing.</p>
          </div>
          {step ? (
            <>
              <div
                className={
                  "screenshot editor-screen " + (placing ? "placing" : "")
                }
                onClick={place}
              >
                <img
                  src={step.image}
                  alt={`Screenshot ${index + 1}: ${step.title}`}
                  draggable="false"
                />
                <Target
                  target={step.target}
                  aria-label="Click target — click to reposition"
                  onClick={(e) => {
                    if (!placing) {
                      e.stopPropagation();
                      setPlacing(true);
                    }
                  }}
                >
                  <span className="target-pin">{index + 1}</span>
                </Target>
              </div>
              <button
                className={"canvas-caption " + (placing ? "placing-label" : "")}
                onClick={() => setPlacing((p) => !p)}
              >
                <Crosshair size={18} />
                {placing
                  ? "Click the screenshot to move your target"
                  : "Click here to place a target"}
              </button>
              <div className="step-tools">
                <button
                  className="text-button"
                  aria-label="Move step earlier"
                  disabled={index === 0 || busy}
                  onClick={() => move(-1)}
                >
                  <ArrowUp size={14} />
                  Move up
                </button>
                <button
                  className="text-button"
                  aria-label="Move step later"
                  disabled={index === draft.steps.length - 1 || busy}
                  onClick={() => move(1)}
                >
                  <ArrowDown size={14} />
                  Move down
                </button>
                <button
                  className="text-button danger"
                  disabled={busy}
                  onClick={() => {
                    setDraft((d) => ({
                      ...d,
                      steps: d.steps.filter((_, i) => i !== index),
                    }));
                    setSelected(Math.max(0, index - 1));
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </>
          ) : (
            <div className="empty-canvas">
              <ImagePlus size={40} strokeWidth={1.3} />
              <h2>Make your first practice run.</h2>
              <p>
                Drop screenshots here, in the order you want
                <br />
                someone to learn your workflow.
              </p>
              <button
                className="button primary"
                onClick={() => input.current.click()}
              >
                <Upload size={17} />
                Choose screenshots
              </button>
              <button
                className="text-button"
                onClick={() => {
                  onDemo();
                  setSelected(0);
                }}
              >
                Or explore the sample walkthrough
              </button>
            </div>
          )}
        </main>
        <aside className="inspector panel">
          <h2>
            {step
              ? `Step ${String(index + 1).padStart(2, "0")}`
              : "Let’s set the scene"}
          </h2>
          {step && (
            <>
              <label>
                Step title
                <input
                  maxLength={120}
                  value={step.title}
                  onChange={(e) => updateStep({ title: e.target.value })}
                />
              </label>
              <label>
                Instruction
                <textarea
                  rows={3}
                  maxLength={800}
                  value={step.instruction}
                  onChange={(e) => updateStep({ instruction: e.target.value })}
                />
              </label>
              <details className="hint-editor">
                <summary>Hint after a missed click</summary>
                <label className="sr-label">
                  Hint after a missed click
                  <textarea
                    rows={2}
                    maxLength={800}
                    value={step.hint}
                    onChange={(e) => updateStep({ hint: e.target.value })}
                  />
                </label>
              </details>
              <div className="target-heading">
                <Crosshair size={17} />
                Target region
              </div>
              <div className="size-fields">
                <label>
                  Width %
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={Math.round(step.target.w * 100)}
                    onChange={(e) => resize("w", e.target.value)}
                  />
                </label>
                <label>
                  Height %
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={Math.round(step.target.h * 100)}
                    onChange={(e) => resize("h", e.target.value)}
                  />
                </label>
              </div>
            </>
          )}
          <div className="ai-section">
            <label>
              What should someone learn?
              <textarea
                placeholder="e.g. Submit their first expense"
                rows={2}
                maxLength={1000}
                value={draft.goal}
                onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
              />
            </label>
            <button
              className="button primary ai-button"
              disabled={!step || !draft.goal.trim() || busy}
              onClick={onAnalyze}
            >
              {analyzing ? (
                <LoaderCircle size={19} className="spin" />
              ) : (
                <Sparkles size={19} />
              )}{" "}
              {analyzing ? "Reading your screens…" : "Generate with AI"}
            </button>
            <p className="inspector-note">
              {busy
                ? "Finding the next action in each screenshot. This can take a minute."
                : "Every great walkthrough starts with a clear next step."}
            </p>
            <p className="privacy-note">
              Generation sends these screenshots to GMI Cloud. Review suggested
              targets before publishing.
            </p>
          </div>
        </aside>
      </div>
      <footer className="statusbar">
        <span>
          {draft.steps.length} steps <span className="dot">•</span> {saveState}
        </span>
        <span>
          <span className="status-dot" />
          Made for learning by doing
        </span>
      </footer>
    </div>
  );
}
