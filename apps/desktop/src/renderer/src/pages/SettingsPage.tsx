import React from 'react';
import type { SettingsSection } from '@blackia/shared/types';
import {
  SettingsLayout,
  GeneralSection,
  KeyboardShortcutsSection,
  InterfaceSection,
  AboutSection,
} from '../components/settings';

export function SettingsPage() {
  const renderSection = (activeSection: SettingsSection) => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection />;
      case 'keyboardShortcuts':
        return <KeyboardShortcutsSection />;
      case 'interface':
        return <InterfaceSection />;
      case 'about':
        return <AboutSection />;
      default:
        return <GeneralSection />;
    }
  };

  return <SettingsLayout>{renderSection}</SettingsLayout>;
}
