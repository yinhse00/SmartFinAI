import { useState, useEffect } from 'react';

export type ApiUsageMode = 'economy' | 'balanced' | 'automatic';

interface ApiUsageSettings {
  mode: ApiUsageMode;
  manualConnectionTesting: boolean;
  manualContentLoading: boolean;
  manualBackgroundChecks: boolean;
  apiCallCounter: number;
  lastResetTime: number;
}

const DEFAULT_SETTINGS: ApiUsageSettings = {
  mode: 'economy',
  manualConnectionTesting: true,
  manualContentLoading: true,
  manualBackgroundChecks: true,
  apiCallCounter: 0,
  lastResetTime: Date.now()
};

const STORAGE_KEY = 'api_usage_settings';

export const useApiUsageSettings = () => {
  const [settings, setSettings] = useState<ApiUsageSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset counter daily
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        if (now - parsed.lastResetTime > dayMs) {
          parsed.apiCallCounter = 0;
          parsed.lastResetTime = now;
        }
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load API usage settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save API usage settings:', error);
    }
  }, [settings]);

  const updateMode = (mode: ApiUsageMode) => {
    const newSettings = {
      ...settings,
      mode,
      manualConnectionTesting: mode === 'economy',
      manualContentLoading: mode === 'economy',
      manualBackgroundChecks: mode === 'economy' || mode === 'balanced'
    };
    setSettings(newSettings);
  };

  const incrementApiCallCounter = () => {
    setSettings(prev => ({
      ...prev,
      apiCallCounter: prev.apiCallCounter + 1
    }));
  };

  const resetApiCallCounter = () => {
    setSettings(prev => ({
      ...prev,
      apiCallCounter: 0,
      lastResetTime: Date.now()
    }));
  };

  const updateSetting = <K extends keyof ApiUsageSettings>(
    key: K, 
    value: ApiUsageSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    updateMode,
    incrementApiCallCounter,
    resetApiCallCounter,
    updateSetting,
    
    // Computed properties for easy access
    isEconomyMode: settings.mode === 'economy',
    isBalancedMode: settings.mode === 'balanced',
    isAutomaticMode: settings.mode === 'automatic',
    shouldUseManualControls: settings.mode === 'economy',
    apiCallsToday: settings.apiCallCounter
  };
};