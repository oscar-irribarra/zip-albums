import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "./settingsStore";

const getStartupContextMock = vi.fn();
const updateUserSettingsMock = vi.fn();

vi.mock( "../../../infrastructure/tauri", () => ( {
  getStartupContext: ( ...args: unknown[] ) => getStartupContextMock( ...args ),
  updateUserSettings: ( ...args: unknown[] ) => updateUserSettingsMock( ...args ),
} ) );

describe( "settingsStore", () => {
  beforeEach( () => {
    getStartupContextMock.mockReset();
    updateUserSettingsMock.mockReset();
    useSettingsStore.setState( {
      settings: {
        theme: "system",
        albums_directory: null,
        fullscreen: false,
        remember_last_album: false,
        initial_zoom: 1,
        updated_at: "0",
      },
      loading: false,
      saving: false,
      initialized: false,
      error: null,
      warnings: [],
      restoreAlbumId: null,
    } );
  } );

  it( "loads startup settings with warnings and restore album id", async () => {
    getStartupContextMock.mockResolvedValue( {
      settings: {
        theme: "dark",
        albums_directory: "C:/albums",
        fullscreen: true,
        remember_last_album: true,
        initial_zoom: 1.2,
        updated_at: "1",
      },
      restore_album_id: "album-1",
      warnings: ["folder unavailable"],
    } );

    const result = await useSettingsStore.getState().loadSettings();

    expect( result ).toBe( true );
    expect( useSettingsStore.getState().settings?.theme ).toBe( "dark" );
    expect( useSettingsStore.getState().restoreAlbumId ).toBe( "album-1" );
    expect( useSettingsStore.getState().warnings ).toEqual( ["folder unavailable"] );
    expect( document.documentElement.getAttribute( "data-theme" ) ).toBe( "dark" );
    expect( document.documentElement.getAttribute( "data-fullscreen-pref" ) ).toBe( "true" );
  } );

  it( "does not expose restore album id when startup context has none", async () => {
    getStartupContextMock.mockResolvedValue( {
      settings: {
        theme: "light",
        albums_directory: null,
        fullscreen: false,
        remember_last_album: false,
        initial_zoom: 1,
        updated_at: "2",
      },
      restore_album_id: null,
      warnings: [],
    } );

    const result = await useSettingsStore.getState().loadSettings();

    expect( result ).toBe( true );
    expect( useSettingsStore.getState().restoreAlbumId ).toBeNull();
    expect( useSettingsStore.getState().settings?.remember_last_album ).toBe( false );
  } );

  it( "maps save validation failures to user-facing message", async () => {
    updateUserSettingsMock.mockRejectedValue( { code: "INVALID_ZOOM_VALUE" } );

    const result = await useSettingsStore.getState().saveSettings( {
      theme: "system",
      albums_directory: null,
      fullscreen: false,
      remember_last_album: false,
      initial_zoom: 4,
    } );

    expect( result ).toBe( false );
    expect( useSettingsStore.getState().error ).toBe( "Initial zoom must be between 0.5 and 3.0." );
  } );
} );
