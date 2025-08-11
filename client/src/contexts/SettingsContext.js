import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  orgName: 'TechKnoGeeks',
  brandingPrefix: 'ProjectHub',
  workHoursPerDay: 8,
  weekStart: 'Monday', // Monday | Sunday
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('appSettings');
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
