import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { DEFAULT_FORM } from "./constants/options";
import { navigate, useHashRoute } from "./hooks/useHashRoute";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { useObjectUrl } from "./hooks/useObjectUrl";
import { useRedesign } from "./hooks/useRedesign";
import LandingPage from "./pages/LandingPage";
import ResultsPage from "./pages/ResultsPage";
import WorkspacePage from "./pages/WorkspacePage";

export default function App() {
  const route = useHashRoute();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const originalUrl = useObjectUrl(file);
  const redesign = useRedesign();
  const backend = useBackendStatus(); // also wakes a sleeping server

  const resultsReady = Boolean(redesign.result && originalUrl);

  // Opening #/results without a finished design sends people back to the workspace.
  useEffect(() => {
    if (route === "/results" && !resultsReady && redesign.status !== "processing") navigate("/design");
  }, [route, resultsReady, redesign.status]);

  async function handleGenerate() {
    if (!file) return;
    const data = await redesign.run(file, form);
    if (data) navigate("/results");
  }

  let page;
  if (route === "/design") {
    page = (
      <WorkspacePage
        file={file}
        previewUrl={originalUrl}
        onFileChange={setFile}
        form={form}
        setForm={setForm}
        redesign={redesign}
        onGenerate={handleGenerate}
        backend={backend}
      />
    );
  } else if (route === "/results") {
    page = resultsReady ? (
      <ResultsPage
        result={redesign.result}
        originalUrl={originalUrl}
        onAnother={() => {
          redesign.reset();
          navigate("/design");
        }}
      />
    ) : null;
  } else {
    page = <LandingPage onStart={() => navigate("/design")} />;
  }

  return (
    <div className="app">
      <Navbar route={route} />
      <main>{page}</main>
      <Footer />
    </div>
  );
}
