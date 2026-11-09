import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { ACCEPTED_TYPES, MAX_UPLOAD_MB } from "../constants/options";

function formatSize(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function UploadZone({ file, previewUrl, onSelect, onRemove, onError }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function accept(candidate) {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      onError("That file type is not supported. Please use a JPG, PNG or WEBP photo.");
      return;
    }
    if (candidate.size > MAX_UPLOAD_MB * 1024 * 1024) {
      onError(`That photo is ${formatSize(candidate.size)}. The limit is ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    onError("");
    onSelect(candidate);
  }

  function handleInput(event) {
    accept(event.target.files?.[0]);
    event.target.value = ""; // lets the same file be chosen again
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="upload">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleInput}
        className="visually-hidden"
        tabIndex={-1}
      />

      {file && previewUrl ? (
        <figure className="upload-preview">
          <img src={previewUrl} alt="Your uploaded room" />
          <figcaption>
            <span className="upload-name">{file.name}</span>
            <span className="upload-size">{formatSize(file.size)}</span>
          </figcaption>
          <div className="upload-actions">
            <button type="button" className="btn btn-small btn-light" onClick={openPicker}>
              <RefreshCw size={16} aria-hidden="true" /> Replace
            </button>
            <button type="button" className="btn btn-small btn-light" onClick={onRemove}>
              <X size={16} aria-hidden="true" /> Remove
            </button>
          </div>
        </figure>
      ) : (
        <div
          className={`dropzone${dragging ? " is-dragging" : ""}`}
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openPicker())}
          onDragOver={(e) => (e.preventDefault(), setDragging(true))}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          aria-label="Upload a photo of your room. Press Enter to browse files."
        >
          <span className="dropzone-icon">
            <ImagePlus size={28} aria-hidden="true" />
          </span>
          <strong>Drop a photo of your room here</strong>
          <span className="dropzone-sub">or browse your files</span>
          <span className="dropzone-rules">JPG, PNG or WEBP, up to {MAX_UPLOAD_MB} MB. A straight-on, well-lit photo works best.</span>
        </div>
      )}
    </div>
  );
}
