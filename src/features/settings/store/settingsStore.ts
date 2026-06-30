import { create } from "zustand";
import { getStartupContext, updateUserSettings } from "../../../infrastructure/tauri";
import type {
  SettingsCommandError,
  ThemePreference,
  UpdateUserSettingsRequest,
  UserSettings,
} from "../../../shared/types/library";

interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  initialized: boolean;
  error: string | null;
  warnings: string[];
  restoreAlbumId: string | null;
  loadSettings: () => Promise<boolean>;
  saveSettings: ( payload: UpdateUserSettingsRequest ) => Promise<boolean>;
  applyRuntimePreferences: () => void;
}

const defaultSettings: UserSettings = {
  theme: "system",
  albums_directory: null,
  fullscreen: false,
  remember_last_album: false,
  initial_zoom: 1,
  updated_at: "0",
};

function applyTheme( theme: ThemePreference ) {
  if ( typeof document === "undefined" ) {
    return;
  }

  const root = document.documentElement;
  root.setAttribute( "data-theme", theme );
}

function applyFullscreenPreference( fullscreen: boolean ) {
  if ( typeof document === "undefined" ) {
    return;
  }

  document.documentElement.setAttribute( "data-fullscreen-pref", fullscreen ? "true" : "false" );
}

const settingsErrorMessages: Record<string, string> = {
  SETTINGS_READ_FAILURE: "Unable to read saved settings.",
  SETTINGS_WRITE_FAILURE: "Unable to save settings.",
  INVALID_ALBUMS_DIRECTORY: "The selected albums folder is not accessible.",
  INVALID_ZOOM_VALUE: "Initial zoom must be between 0.5 and 3.0.",
  STARTUP_CONTEXT_FAILURE: "Unable to initialize startup settings.",
};

function resolveSettingsError( error: unknown, fallback: string ): string {
  if ( error && typeof error === "object" && "code" in error ) {
    const typed = error as Partial<SettingsCommandError>;
    if ( typed.code && typed.code in settingsErrorMessages ) {
      return settingsErrorMessages[typed.code];
    }
  }

  if ( error instanceof Error ) {
    return error.message;
  }

  return fallback;
}

export const useSettingsStore = create<SettingsState>( ( set, get ) => ( {
  settings: defaultSettings,
  loading: false,
  saving: false,
  initialized: false,
  error: null,
  warnings: [],
  restoreAlbumId: null,

  loadSettings: async () => {
    set( { loading: true, error: null } );
    try {
      const context = await getStartupContext();
      set( {
        settings: context.settings,
        warnings: context.warnings,
        restoreAlbumId: context.restore_album_id,
        loading: false,
        initialized: true,
      } );
      get().applyRuntimePreferences();
      return true;
    } catch ( error ) {
      set( {
        loading: false,
        initialized: true,
        error: resolveSettingsError( error, "Unable to load settings" ),
      } );
      return false;
    }
  },

  saveSettings: async ( payload ) => {
    set( { saving: true, error: null } );
    try {
      const response = await updateUserSettings( payload );
      set( { settings: response.settings, saving: false } );
      get().applyRuntimePreferences();
      return true;
    } catch ( error ) {
      set( {
        saving: false,
        error: resolveSettingsError( error, "Unable to save settings" ),
      } );
      return false;
    }
  },

  applyRuntimePreferences: () => {
    const settings = get().settings;
    if ( !settings ) {
      return;
    }

    applyTheme( settings.theme );
    applyFullscreenPreference( settings.fullscreen );
  },
} ) );
