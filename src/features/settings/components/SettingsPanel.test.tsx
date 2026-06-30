import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPanel from "./SettingsPanel";
import { useSettingsStore } from "../store/settingsStore";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn().mockResolvedValue(null),
}));

describe("SettingsPanel", () => {
  beforeEach(() => {
    useSettingsStore.setState({
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
      initialized: true,
      error: null,
      warnings: [],
      restoreAlbumId: null,
    });
  });

  it("renders all primary settings controls", () => {
    render(<SettingsPanel />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Start in fullscreen" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Remember last opened album" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save settings" })).toBeInTheDocument();
  });

  it("shows validation message for invalid zoom before save", () => {
    render(<SettingsPanel />);

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(screen.getByText("Initial zoom must be between 0.5 and 3.0.")).toBeInTheDocument();
  });
});
