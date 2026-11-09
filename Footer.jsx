import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Logo />
        <p className="footer-note">
          Built with React, FastAPI, Google Gemini and YOLO11. Redesigns are stored on the server for a short time, so
          download the ones you want to keep.
        </p>
      </div>
    </footer>
  );
}
