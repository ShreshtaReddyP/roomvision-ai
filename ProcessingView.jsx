import { useEffect, useState } from "react";

const MESSAGES = [
  "Analysing your room...",
  "Identifying furniture and objects...",
  "Understanding your design preferences...",
  "Preparing your new interior...",
  "Creating your AI redesign...",
  "Your new space is almost ready!",
];
const STEP_MS = 6000;

// The messages rotate on a timer to show the app is working. They are NOT real progress
// and no percentage is shown, because the backend does not report progress.
export default function ProcessingView({ onCancel }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, MESSAGES.length - 1)), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="processing" role="dialog" aria-modal="true" aria-label="Creating your redesign">
      <div className="processing-card">
        <svg className="blueprint" viewBox="0 0 320 200" aria-hidden="true">
          <path className="bp-line bp-1" d="M20 170V40l140-24 140 24v130z" />
          <path className="bp-line bp-2" d="M20 170h280M20 120h280" />
          <rect className="bp-line bp-3" x="205" y="55" width="62" height="48" />
          <path className="bp-line bp-4" d="M50 120v-30h110v30M40 120h130v22H40z" />
          <path className="bp-line bp-5" d="M236 170v-38m-14 0h28" />
        </svg>

        <p className="processing-message" key={index} aria-live="polite">
          {MESSAGES[index]}
        </p>
        <div className="processing-bar" aria-hidden="true">
          <span />
        </div>
        <p className="processing-note">
          A redesign can take a minute or two. If the server has been idle, the first request takes longer while it wakes up.
        </p>
        <button type="button" className="btn btn-light" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
