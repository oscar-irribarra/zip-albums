import { useEffect } from "react";
import SettingsPanel from "./SettingsPanel";

interface SettingsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  startupWarnings?: string[];
  rememberLastAlbum?: boolean;
}

function SettingsSidePanel( {
  isOpen,
  onClose,
  startupWarnings,
  rememberLastAlbum,
}: SettingsSidePanelProps ) {
  useEffect( () => {
    if ( !isOpen ) {
      return;
    }

    const handleKeyDown = ( event: KeyboardEvent ) => {
      if ( event.key === "Escape" ) {
        onClose();
      }
    };

    window.addEventListener( "keydown", handleKeyDown );
    return () => window.removeEventListener( "keydown", handleKeyDown );
  }, [isOpen, onClose] );

  if ( !isOpen ) {
    return null;
  }

  return (
    <>
      <div className="side-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="side-panel side-panel--open" aria-label="Settings panel" role="dialog" aria-modal="true">
        <button type="button" className="side-panel-close" onClick={onClose} aria-label="Close settings">
          x
        </button>
        <SettingsPanel startupWarnings={startupWarnings} rememberLastAlbum={rememberLastAlbum} />
      </aside>
    </>
  );
}

export default SettingsSidePanel;
