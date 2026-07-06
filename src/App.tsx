import { ResultsPage } from "./pages/ResultsPage";
import { SurveyPage } from "./pages/SurveyPage";

export function App() {
  const route = window.location.pathname === "/results" ? "results" : "survey";

  return route === "results" ? <ResultsPage /> : <SurveyPage />;
}
