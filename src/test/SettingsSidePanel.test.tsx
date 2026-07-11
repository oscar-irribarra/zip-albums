import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsSidePanel from "../features/settings/components/SettingsSidePanel";

describe( "SettingsSidePanel", () => {
  it( "does not render when closed", () => {
    render( <SettingsSidePanel isOpen={false} onClose={vi.fn()} /> );

    expect( screen.queryByRole( "dialog", { name: /settings panel/i } ) ).not.toBeInTheDocument();
  } );

  it( "closes with X button", () => {
    const onClose = vi.fn();

    render( <SettingsSidePanel isOpen={true} onClose={onClose} /> );

    fireEvent.click( screen.getByRole( "button", { name: /close settings/i } ) );
    expect( onClose ).toHaveBeenCalledTimes( 1 );
  } );

  it( "closes on backdrop click", () => {
    const onClose = vi.fn();

    render( <SettingsSidePanel isOpen={true} onClose={onClose} /> );

    const backdrop = document.querySelector( ".side-panel-backdrop" );
    expect( backdrop ).not.toBeNull();

    fireEvent.click( backdrop as HTMLElement );
    expect( onClose ).toHaveBeenCalledTimes( 1 );
  } );

  it( "closes on Escape key", () => {
    const onClose = vi.fn();

    render( <SettingsSidePanel isOpen={true} onClose={onClose} /> );

    fireEvent.keyDown( window, { key: "Escape" } );
    expect( onClose ).toHaveBeenCalledTimes( 1 );
  } );
} );
