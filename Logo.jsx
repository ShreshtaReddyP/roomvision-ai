export default function Logo({ onClick }) {
  return (
    <a className="logo" href="#/" onClick={onClick} aria-label="RoomVision AI home">
      <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <path d="M7 25V12.5L16 7l9 5.5V25" fill="none" stroke="#F6F1E7" strokeWidth="2" strokeLinejoin="round" />
        <rect x="12" y="15" width="8" height="10" fill="#B5654A" />
      </svg>
      <span className="logo-word">
        RoomVision <span className="logo-ai">AI</span>
      </span>
    </a>
  );
}
