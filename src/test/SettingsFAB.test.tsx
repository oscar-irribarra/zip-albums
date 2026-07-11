import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsFAB from "../features/settings/components/SettingsFAB";

describe( "SettingsFAB", () => {
  it( "renders a settings button and fires onClick", () => {
    const onClick = vi.fn();

    render( <SettingsFAB onClick={onClick} /> );

    const button = screen.getByRole( "button", { name: /open settings/i } );
    expect( button ).toBeInTheDocument();

    fireEvent.click( button );
    expect( onClick ).toHaveBeenCalledTimes( 1 );
  } );
} );
