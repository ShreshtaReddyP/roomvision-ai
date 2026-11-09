import { navigate } from "../hooks/useHashRoute";
import Logo from "./Logo";

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar({ route }) {
  const onLanding = route === "/";
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        <nav className="navbar-links" aria-label="Main">
          {onLanding && (
            <>
              <button type="button" className="link-button" onClick={() => scrollToSection("features")}>
                Features
              </button>
              <button type="button" className="link-button" onClick={() => scrollToSection("how-it-works")}>
                How it works
              </button>
            </>
          )}
          {route !== "/design" && (
            <button type="button" className="btn btn-small btn-dark" onClick={() => navigate("/design")}>
              Design my room
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
