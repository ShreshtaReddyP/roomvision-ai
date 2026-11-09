import { Armchair, ScanSearch, ShieldCheck, SlidersHorizontal } from "lucide-react";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import RoomIllustration from "../components/RoomIllustration";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Sees what is in your room",
    text: "YOLO computer vision finds the beds, sofas, tables and plants in your photo before any design begins.",
  },
  {
    icon: ShieldCheck,
    title: "Keeps your architecture",
    text: "Walls, windows, doors and the camera angle stay exactly as they are. Only the interior changes.",
  },
  {
    icon: SlidersHorizontal,
    title: "Follows your brief",
    text: "Pick a style, palette and budget, then add your own notes for the details that matter to you.",
  },
  {
    icon: Armchair,
    title: "Your layout, your call",
    text: "Keep your furniture where it is, or let the AI rearrange it for better flow.",
  },
];

const STEPS = [
  { title: "Upload a photo", text: "Add a picture of the room you want to redesign." },
  { title: "Set your preferences", text: "Choose the room type, style, colours and budget." },
  { title: "Let the AI redesign it", text: "Gemini creates a photorealistic version of your room." },
  { title: "Compare and download", text: "Slide between before and after, then save your favourite." },
];

export default function LandingPage({ onStart }) {
  const scrollToHow = () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Reimagine your space with AI</h1>
          <p className="hero-lede">
            Upload a photo of your room, choose a style, a palette and a budget, and RoomVision creates a photorealistic
            redesign that keeps your walls, windows and doors right where they are.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
              Design my room
            </button>
            <button type="button" className="btn btn-ghost btn-large" onClick={scrollToHow}>
              See how it works
            </button>
          </div>
        </div>

        <figure className="hero-visual">
          <BeforeAfterSlider
            before={<RoomIllustration variant="before" />}
            after={<RoomIllustration variant="after" />}
            beforeLabel="Before"
            afterLabel="After"
            aspectRatio="10 / 7"
          />
          <figcaption>Illustration. Drag the slider to compare a plain room with a styled one.</figcaption>
        </figure>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <h2>Design that respects the room you have</h2>
          <p>Every redesign starts from your own photograph, so the result looks like your home, only better.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="feature">
              <span className="feature-icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tinted" id="how-it-works">
        <div className="section-head">
          <h2>From photo to finished design in four steps</h2>
        </div>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="step">
              <span className="step-number">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="section-cta">
          <button type="button" className="btn btn-primary btn-large" onClick={onStart}>
            Design my room
          </button>
        </div>
      </section>
    </>
  );
}
