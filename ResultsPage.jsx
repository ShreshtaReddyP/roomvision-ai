import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import DetectionList from "../components/DetectionList";
import ErrorBanner from "../components/ErrorBanner";
import { BUDGETS, COLOR_PALETTES, DESIGN_STYLES, ROOM_TYPES, labelFor } from "../constants/options";
import { downloadImage } from "../services/api";

export default function ResultsPage({ result, originalUrl, onAnother }) {
  const [ratio, setRatio] = useState("4 / 3");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const { metadata, detection } = result;
  const palette =
    metadata.color_palette === "custom" && metadata.custom_palette
      ? `Custom: ${metadata.custom_palette}`
      : labelFor(COLOR_PALETTES, metadata.color_palette);

  const details = [
    ["Room", labelFor(ROOM_TYPES, metadata.room_type)],
    ["Style", labelFor(DESIGN_STYLES, metadata.design_style)],
    ["Palette", palette],
    ["Budget", labelFor(BUDGETS, metadata.budget)],
    ["Layout", metadata.preserve_layout ? "Original arrangement kept" : "Rearranged for flow"],
  ];

  async function handleDownload() {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadImage(result);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="results">
      <div className="results-head">
        <h1>Your redesigned {labelFor(ROOM_TYPES, metadata.room_type).toLowerCase()}</h1>
        <p>Drag the slider to compare your original photo with the AI redesign.</p>
      </div>

      <div className="results-stage">
        <BeforeAfterSlider
          aspectRatio={ratio}
          before={<img className="ba-img" src={originalUrl} alt="Your original room" />}
          after={
            <img
              className="ba-img"
              src={result.image_url}
              alt="AI redesigned version of your room"
              onLoad={(e) => setRatio(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)}
            />
          }
        />
      </div>

      <div className="results-actions">
        <button type="button" className="btn btn-primary btn-large" onClick={handleDownload} disabled={downloading}>
          <Download size={18} aria-hidden="true" /> {downloading ? "Preparing download..." : "Download redesign"}
        </button>
        <button type="button" className="btn btn-light btn-large" onClick={onAnother}>
          <RefreshCw size={18} aria-hidden="true" /> Generate another design
        </button>
      </div>
      <ErrorBanner message={downloadError} onDismiss={() => setDownloadError("")} />
      <p className="results-note">Redesigns are kept on the server for a limited time. Download yours to keep it.</p>

      <div className="results-grid">
        <section className="panel">
          <h2 className="panel-title">Design details</h2>
          <dl className="details">
            {details.map(([label, value]) => (
              <div key={label} className="detail">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {metadata.additional_instructions && (
              <div className="detail detail-wide">
                <dt>Your notes</dt>
                <dd>{metadata.additional_instructions}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="panel">
          <h2 className="panel-title">Furniture detected in your photo</h2>
          {detection.available && (
            <p className="analysis-count">
              {detection.count} {detection.count === 1 ? "object" : "objects"} found
            </p>
          )}
          <DetectionList objects={detection.objects} available={detection.available} />
        </section>
      </div>
    </div>
  );
}
