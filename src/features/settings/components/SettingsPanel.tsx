import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useSettingsStore } from "../store/settingsStore";
import type { ThemePreference, UpdateUserSettingsRequest } from "../../../shared/types/library";

interface SettingsFormState {
  theme: ThemePreference;
  albums_directory: string;
  fullscreen: boolean;
  remember_last_album: boolean;
  initial_zoom: string;
}

function toFormState(payload: UpdateUserSettingsRequest): SettingsFormState {
  return {
    theme: payload.theme,
    albums_directory: payload.albums_directory ?? "",
    fullscreen: payload.fullscreen,
    remember_last_album: payload.remember_last_album,
    initial_zoom: payload.initial_zoom.toString(),
  };
}

function parseFormState(form: SettingsFormState): UpdateUserSettingsRequest | null {
  const zoom = Number(form.initial_zoom);
  if (!Number.isFinite(zoom) || zoom < 0.5 || zoom > 3.0) {
    return null;
  }

  return {
    theme: form.theme,
    albums_directory: form.albums_directory.trim() || null,
    fullscreen: form.fullscreen,
    remember_last_album: form.remember_last_album,
    initial_zoom: zoom,
  };
}

function SettingsPanel() {
  const { settings, loading, saving, error, warnings, saveSettings } = useSettingsStore();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsFormState>( {
    theme: "system",
    albums_directory: "",
    fullscreen: false,
    remember_last_album: false,
    initial_zoom: "1",
  } );

  useEffect(() => {
    if (!settings) {
      return;
    }

    setForm( toFormState( {
      theme: settings.theme,
      albums_directory: settings.albums_directory,
      fullscreen: settings.fullscreen,
      remember_last_album: settings.remember_last_album,
      initial_zoom: settings.initial_zoom,
    } ) );
  }, [settings]);

  const warningText = useMemo(() => warnings.join(" "), [warnings]);

  const handleSave = async () => {
    setValidationError(null);
    const payload = parseFormState(form);
    if (!payload) {
      setValidationError("Initial zoom must be between 0.5 and 3.0.");
      return;
    }

    await saveSettings(payload);
  };

  const handleChooseFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) {
      return;
    }

    setForm((current) => ({ ...current, albums_directory: selected }));
  };

  const handleReset = () => {
    if (!settings) {
      return;
    }

    setValidationError(null);
    setForm(toFormState({
      theme: settings.theme,
      albums_directory: settings.albums_directory,
      fullscreen: settings.fullscreen,
      remember_last_album: settings.remember_last_album,
      initial_zoom: settings.initial_zoom,
    }));
  };

  return (
    <section aria-label="Settings" className="settings-panel">
      <h2>Settings</h2>
      {loading && <p>Loading settings...</p>}
      {saving && <p>Saving settings...</p>}
      {error && <p className="error-message">{error}</p>}
      {validationError && <p className="error-message">{validationError}</p>}
      {warningText && <p>{warningText}</p>}

      <div className="settings-grid">
        <label>
          Theme
          <select
            value={form.theme}
            onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value as ThemePreference }))}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label>
          Albums folder
          <div className="settings-folder-row">
            <input
              type="text"
              value={form.albums_directory}
              onChange={(event) => setForm((current) => ({ ...current, albums_directory: event.target.value }))}
              placeholder="Select a folder"
            />
            <button type="button" onClick={() => void handleChooseFolder()}>
              Browse
            </button>
          </div>
        </label>

        <label>
          Initial zoom
          <input
            type="number"
            min="0.5"
            max="3"
            step="0.05"
            value={form.initial_zoom}
            onChange={(event) => setForm((current) => ({ ...current, initial_zoom: event.target.value }))}
          />
        </label>

        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={form.fullscreen}
            onChange={(event) => setForm((current) => ({ ...current, fullscreen: event.target.checked }))}
          />
          Start in fullscreen
        </label>

        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={form.remember_last_album}
            onChange={(event) => setForm((current) => ({ ...current, remember_last_album: event.target.checked }))}
          />
          Remember last opened album
        </label>
      </div>

      <div className="settings-actions">
        <button type="button" onClick={() => void handleSave()} disabled={saving}>
          Save settings
        </button>
        <button type="button" onClick={handleReset} disabled={saving}>
          Reset
        </button>
      </div>
    </section>
  );
}

export default SettingsPanel;
