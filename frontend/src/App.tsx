import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppProvider } from "./context/AppContext";
import CollectionPage from "./pages/CollectionPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import { NotFoundPage, PrivacyPage, TermsPage } from "./pages/LegalPages";
import PlatformsPage from "./pages/PlatformsPage";
import ProgressPage from "./pages/ProgressPage";
import ResultsPage from "./pages/ResultsPage";
import SavedPage from "./pages/SavedPage";
import SettingsPage from "./pages/SettingsPage";
import ServicesPage from "./pages/ServicesPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  const Router = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter;

  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="collection" element={<CollectionPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="platforms" element={<PlatformsPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
