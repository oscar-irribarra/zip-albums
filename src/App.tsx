import { useEffect, useRef, useState } from "react";
import { LibraryView } from "./features/library";
import { SettingsFAB, SettingsSidePanel, useSettingsStore } from "./features/settings";
import { useLibraryStore } from "./features/library/store/libraryStore";
import "./App.css";

function App() {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const restoreAlbumId = useSettingsStore((state) => state.restoreAlbumId);
  const startupWarnings = useSettingsStore((state) => state.warnings);
  const initialized = useSettingsStore((state) => state.initialized);
  const rememberLastAlbum = useSettingsStore((state) => state.settings?.remember_last_album ?? false);
  const openAlbumViewer = useLibraryStore((state) => state.openAlbumViewer);
  const restoredAlbumRef = useRef<string | null>(null);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!initialized || !restoreAlbumId) {
      return;
    }

    if (restoredAlbumRef.current === restoreAlbumId) {
      return;
    }

    restoredAlbumRef.current = restoreAlbumId;
    void openAlbumViewer(restoreAlbumId, true);
  }, [initialized, openAlbumViewer, restoreAlbumId]);

  return (
    <main className="app-shell">
      <LibraryView startupWarnings={startupWarnings} rememberLastAlbum={rememberLastAlbum} />
      <SettingsFAB onClick={() => setSettingsPanelOpen(true)} />
      <SettingsSidePanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        startupWarnings={startupWarnings}
        rememberLastAlbum={rememberLastAlbum}
      />
    </main>
  );
}

export default App;
