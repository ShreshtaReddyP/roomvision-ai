import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

/** Drag (or use arrow keys on) the slider to reveal the "before" layer over the "after" layer. */
export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Original",
  afterLabel = "Redesign",
  aspectRatio = "4 / 3",
}) {
  const [position, setPosition] = useState(50);

  return (
    <div className="ba" style={{ aspectRatio }}>
      <div className="ba-layer">{after}</div>
      <div className="ba-layer" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {before}
      </div>
      <span className="ba-tag ba-tag-before">{beforeLabel}</span>
      <span className="ba-tag ba-tag-after">{afterLabel}</span>
      <div className="ba-divider" style={{ left: `${position}%` }} aria-hidden="true">
        <span className="ba-knob">
          <MoveHorizontal size={18} />
        </span>
      </div>
      <input
        className="ba-range"
        type="range"
        min="0"
        max="100"
        step="0.5"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Compare ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()}`}
      />
    </div>
  );
}
