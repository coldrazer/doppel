import React, { useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { Check, Copy, ExternalLink, X, LoaderCircle } from "lucide-react";
import Editor from "./Editor.jsx";
import Player from "./Player.jsx";
import { seed, blank, api } from "./data.js";
import { exportWalkthrough } from "./export.js";
export default function App() {
  const [draft, setDraft] = useState(seed),
    [ready, setReady] = useState(false),
    [saveState, setSaveState] = useState("Loading your draft…"),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [analyzing, setAnalyzing] = useState(false),
    [toast, setToast] = useState(null),
    [published, setPublished] = useState(null),
    [shared, setShared] = useState(null),
    [loadError, setLoadError] = useState(""),
    [confirmNew, setConfirmNew] = useState(false),
    [copied, setCopied] = useState(false);
  const shareId = location.pathname.startsWith("/play/")
    ? location.pathname.split("/")[2]
    : null;
  const noticeTimer = useRef();
  const saveQueue = useRef(Promise.resolve());
  function notify(text, type = "success") {
    setToast({ text, type });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setToast(null), 7000);
  }
  useEffect(() => {
    if (shareId) {
      api("/api/walkthroughs/" + shareId)
        .then(setShared)
        .catch((e) => setLoadError(e.message));
      return;
    }
    get("doppel-draft")
      .then((d) => {
        if (d?.steps && Array.isArray(d.steps)) setDraft(d);
      })
      .catch(() => notify("Could not restore your draft.", "error"))
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    setSaveState("Saving…");
    const timer = setTimeout(() => {
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(() => set("doppel-draft", draft))
        .then(() => setSaveState("Changes saved locally"))
        .catch(() => setSaveState("Could not save — export your work"));
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, ready]);
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") {
        setPreview(false);
        setPublished(null);
        setConfirmNew(false);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    if (!published && !confirmNew) return;
    const dialog = document.querySelector('[role="dialog"]');
    const previousFocus = document.activeElement;
    const controls = () => [
      ...dialog.querySelectorAll(
        "button:not(:disabled), a[href], input, textarea",
      ),
    ];
    controls()[0]?.focus();
    const trap = (event) => {
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => {
      dialog.removeEventListener("keydown", trap);
      previousFocus?.focus();
    };
  }, [published, confirmNew]);
  function validate() {
    if (
      !draft.title.trim() ||
      !draft.goal.trim() ||
      !draft.steps.length ||
      draft.steps.some((s) => !s.title.trim() || !s.instruction.trim())
    ) {
      notify(
        "Add a walkthrough title, learning goal, and a title and instruction for every step.",
        "error",
      );
      return false;
    }
    return true;
  }
  async function publish() {
    if (!validate()) return;
    setBusy(true);
    try {
      const r = await api("/api/walkthroughs", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setPublished(location.origin + r.url);
      setCopied(false);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function analyze() {
    setBusy(true);
    setAnalyzing(true);
    const snapshot = draft;
    try {
      const result = await api("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          goal: draft.goal,
          images: draft.steps.map((s) => s.image),
        }),
      });
      setDraft((d) => ({
        ...d,
        steps: d.steps.map((s) => {
          const i = snapshot.steps.findIndex((a) => a.id === s.id);
          return i >= 0 ? { ...s, ...result.steps[i] } : s;
        }),
      }));
      notify("AI suggestions are ready. Review each target before publishing.");
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(false);
      setAnalyzing(false);
    }
  }
  if (shareId)
    return shared ? (
      <Player walkthrough={shared} />
    ) : (
      <div className="loading-state">
        {loadError ? (
          <>
            <h1>We couldn’t open this walkthrough.</h1>
            <p>{loadError}</p>
            <a className="button" href="/">
              Open Doppel
            </a>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Preparing your practice run…</p>
          </>
        )}
      </div>
    );
  if (!ready)
    return (
      <div className="loading-state">
        <LoaderCircle className="spin" />
        <p>Opening your workspace…</p>
      </div>
    );
  return (
    <>
      {preview ? (
        <Player walkthrough={draft} onClose={() => setPreview(false)} preview />
      ) : (
        <Editor
          {...{ draft, setDraft, saveState, busy, analyzing, notify }}
          onPreview={() => setPreview(true)}
          onPublish={publish}
          onAnalyze={analyze}
          onNew={() => setConfirmNew(true)}
          onDemo={() => setDraft(structuredClone(seed))}
          onExport={async () => {
            if (!validate()) return;
            try {
              await exportWalkthrough(draft);
              notify("Your standalone walkthrough is downloaded.");
            } catch (e) {
              notify("Could not export your walkthrough. Try again.", "error");
            }
          }}
        />
      )}
      {toast && (
        <div className={"toast " + toast.type} role="status">
          {toast.type === "success" && <Check size={17} />}
          <span>{toast.text}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {published && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-heading"
          >
            <button
              className="modal-close"
              aria-label="Close publish dialog"
              onClick={() => setPublished(null)}
              autoFocus
            >
              <X size={20} />
            </button>
            <div className="success-icon">
              <Check size={28} />
            </div>
            <h2 id="publish-heading">Ready for a practice run.</h2>
            <p>
              Your published snapshot is ready. Later edits won’t change this
              version.
            </p>
            <label>
              Walkthrough link
              <input
                readOnly
                value={published}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <div className="modal-actions">
              <button
                className="button primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(published);
                    setCopied(true);
                  } catch {
                    notify("Select and copy the link above.", "error");
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                className="button"
                href={published}
                target="_blank"
                rel="noreferrer"
              >
                Open walkthrough
                <ExternalLink size={15} />
              </a>
            </div>
            <p className="privacy-note">
              This link works wherever this server is reachable. To share
              without a server, use Export HTML.
            </p>
          </section>
        </div>
      )}
      {confirmNew && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-heading"
          >
            <h2 id="new-heading">Start a fresh walkthrough?</h2>
            <p>
              This replaces your local draft. Export or publish your current
              walkthrough first if you want to keep it.
            </p>
            <div className="modal-actions">
              <button
                className="button"
                autoFocus
                onClick={() => setConfirmNew(false)}
              >
                Keep editing
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setDraft(structuredClone(blank));
                  setConfirmNew(false);
                }}
              >
                Start fresh
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
