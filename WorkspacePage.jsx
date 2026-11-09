import { useEffect, useRef, useState } from "react";
import { ScanSearch, Sparkles } from "lucide-react";
import DetectionList from "../components/DetectionList";
import ErrorBanner from "../components/ErrorBanner";
import OptionGroup from "../components/OptionGroup";
import ProcessingView from "../components/ProcessingView";
import UploadZone from "../components/UploadZone";
import {
  BUDGETS,
  COLOR_PALETTES,
  DESIGN_STYLES,
  MAX_CUSTOM_PALETTE,
  MAX_INSTRUCTIONS,
  ROOM_TYPES,
} from "../constants/options";
import { analyzeRoom } from "../services/api";

const IDLE_ANALYSIS = { status: "idle", data: null, error: "" };

export default function WorkspacePage({ file, previewUrl, onFileChange, form, setForm, redesign, onGenerate, backend }) {
  const [uploadError, setUploadError] = useState("");
  const [analysis, setAnalysis] = useState(IDLE_ANALYSIS);
  const analysisToken = useRef(0);

  // A new or removed photo invalidates any earlier detection preview.
  useEffect(() => {
    analysisToken.current += 1;
    setAnalysis(IDLE_ANALYSIS);
  }, [file]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const processing = redesign.status === "processing";
  const needsCustomPalette = form.color_palette === "custom" && !form.custom_palette.trim();
  const canGenerate = Boolean(file) && !processing && !needsCustomPalette;

  async function handleAnalyze() {
    const token = ++analysisToken.current;
    setAnalysis({ status: "loading", data: null, error: "" });
    try {
      const data = await analyzeRoom(file);
      if (token === analysisToken.current) setAnalysis({ status: "done", data, error: "" });
    } catch (err) {
      if (token === analysisToken.current) setAnalysis({ status: "error", data: null, error: err.message });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (canGenerate) onGenerate();
  }

  let hint = "";
  if (!file) hint = "Add a photo of your room to begin.";
  else if (needsCustomPalette) hint = "Describe your custom palette to continue.";

  return (
    <div className="workspace">
      <div className="workspace-head">
        <h1>Design workspace</h1>
        <p>Tell us about the room and the look you want. Everything below is sent to the AI with your photo.</p>
        {backend.status === "checking" && <p className="status-line">Connecting to the design server. If it was idle, this can take about a minute.</p>}
        {backend.status === "offline" && (
          <div className="banner banner-warn" role="status">
            <p>The design server is not responding yet. It may still be waking up.</p>
            <button type="button" className="btn btn-small btn-light" onClick={backend.recheck}>
              Check again
            </button>
          </div>
        )}
      </div>

      <form className="workspace-grid" onSubmit={handleSubmit}>
        <section className="panel panel-upload" aria-labelledby="upload-title">
          <h2 id="upload-title" className="panel-title">
            Your room
          </h2>
          <UploadZone
            file={file}
            previewUrl={previewUrl}
            onSelect={onFileChange}
            onRemove={() => {
              onFileChange(null);
              setUploadError("");
            }}
            onError={setUploadError}
          />
          <ErrorBanner message={uploadError} onDismiss={() => setUploadError("")} />

          {file && (
            <div className="analysis">
              <button
                type="button"
                className="btn btn-light btn-small"
                onClick={handleAnalyze}
                disabled={analysis.status === "loading" || processing}
              >
                <ScanSearch size={16} aria-hidden="true" />
                {analysis.status === "loading" ? "Detecting..." : "Detect furniture"}
              </button>
              {analysis.status === "done" && (
                <div className="analysis-result">
                  <p className="analysis-count">
                    {analysis.data.count} {analysis.data.count === 1 ? "object" : "objects"} found
                  </p>
                  <DetectionList objects={analysis.data.objects} />
                </div>
              )}
              {analysis.status === "error" && <p className="field-error">{analysis.error}</p>}
            </div>
          )}
        </section>

        <section className="panel panel-options" aria-labelledby="brief-title">
          <h2 id="brief-title" className="panel-title">
            Design brief
          </h2>

          <OptionGroup legend="Room type" options={ROOM_TYPES} value={form.room_type} onChange={(v) => update("room_type", v)} variant="chip" />
          <OptionGroup legend="Style" options={DESIGN_STYLES} value={form.design_style} onChange={(v) => update("design_style", v)} variant="card" />
          <OptionGroup legend="Colour palette" options={COLOR_PALETTES} value={form.color_palette} onChange={(v) => update("color_palette", v)} variant="palette" />

          {form.color_palette === "custom" && (
            <div className="field">
              <label htmlFor="custom-palette">Describe your colours</label>
              <input
                id="custom-palette"
                type="text"
                value={form.custom_palette}
                maxLength={MAX_CUSTOM_PALETTE}
                placeholder="For example: sage green, cream and walnut"
                onChange={(e) => update("custom_palette", e.target.value)}
              />
            </div>
          )}

          <OptionGroup legend="Budget" options={BUDGETS} value={form.budget} onChange={(v) => update("budget", v)} variant="segment" />

          <div className="field">
            <label htmlFor="instructions">Anything else?</label>
            <textarea
              id="instructions"
              rows={4}
              maxLength={MAX_INSTRUCTIONS}
              value={form.additional_instructions}
              placeholder="For example: add a reading corner by the window, and keep the wooden floor."
              onChange={(e) => update("additional_instructions", e.target.value)}
            />
            <span className="field-counter">
              {form.additional_instructions.length} / {MAX_INSTRUCTIONS}
            </span>
          </div>

          <div className="switch-row">
            <div>
              <span className="switch-title" id="preserve-label">
                Keep my furniture layout
              </span>
              <p className="field-hint">
                {form.preserve_layout
                  ? "Furniture stays where it is. Styles, colours and finishes change."
                  : "The AI may rearrange furniture for better flow. Walls, windows and doors stay put."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.preserve_layout}
              aria-labelledby="preserve-label"
              className={`switch${form.preserve_layout ? " is-on" : ""}`}
              onClick={() => update("preserve_layout", !form.preserve_layout)}
            >
              <span className="switch-thumb" />
            </button>
          </div>

          <ErrorBanner message={redesign.error} onDismiss={redesign.clearError} />

          <div className="generate">
            <button type="submit" className="btn btn-primary btn-large" disabled={!canGenerate}>
              <Sparkles size={18} aria-hidden="true" /> Generate redesign
            </button>
            {hint && <p className="field-hint">{hint}</p>}
          </div>
        </section>
      </form>

      {processing && <ProcessingView onCancel={redesign.cancel} />}
    </div>
  );
}
