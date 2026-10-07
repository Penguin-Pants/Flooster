import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "../stores/settingsStore";
import type { AppSettings as Settings, AudioDevice } from "@/bindings";

interface UseSettingsReturn {
  // State
  settings: Settings | null;
  isLoading: boolean;
  isUpdating: (key: string) => boolean;
  audioDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  audioFeedbackEnabled: boolean;
  postProcessModelOptions: Record<string, string[]>;
  updateChecksLocked: boolean | null;

  // Actions
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K],
    options?: { silent?: boolean },
  ) => Promise<void>;
  resetSetting: (key: keyof Settings) => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshAudioDevices: () => Promise<void>;
  refreshOutputDevices: () => Promise<void>;

  // Binding-specific actions
  updateBinding: (id: string, binding: string) => Promise<void>;
  resetBinding: (id: string) => Promise<void>;

  // Convenience getters
  getSetting: <K extends keyof Settings>(key: K) => Settings[K] | undefined;

  // Post-processing helpers
  setPostProcessProvider: (providerId: string) => Promise<void>;
  updatePostProcessBaseUrl: (
    providerId: string,
    baseUrl: string,
  ) => Promise<void>;
  updatePostProcessApiKey: (
    providerId: string,
    apiKey: string,
  ) => Promise<void>;
  updatePostProcessModel: (providerId: string, model: string) => Promise<void>;
  fetchPostProcessModels: (providerId: string) => Promise<string[]>;
}

export const useSettings = (): UseSettingsReturn => {
  // Select only what the hook returns. A bare `useSettingsStore()` subscribes
  // every consumer to the whole store, so each `isUpdating` flip re-renders
  // every mounted settings component.
  const store = useSettingsStore(
    useShallow((state) => ({
      settings: state.settings,
      isLoading: state.isLoading,
      // `isUpdating` is selected for its identity only: it is what changes when
      // a flag flips, so consumers re-render and `isUpdatingKey` reads fresh.
      isUpdating: state.isUpdating,
      isUpdatingKey: state.isUpdatingKey,
      audioDevices: state.audioDevices,
      outputDevices: state.outputDevices,
      postProcessModelOptions: state.postProcessModelOptions,
      updateChecksLocked: state.updateChecksLocked,
      initialize: state.initialize,
      updateSetting: state.updateSetting,
      resetSetting: state.resetSetting,
      refreshSettings: state.refreshSettings,
      refreshAudioDevices: state.refreshAudioDevices,
      refreshOutputDevices: state.refreshOutputDevices,
      updateBinding: state.updateBinding,
      resetBinding: state.resetBinding,
      getSetting: state.getSetting,
      setPostProcessProvider: state.setPostProcessProvider,
      updatePostProcessBaseUrl: state.updatePostProcessBaseUrl,
      updatePostProcessApiKey: state.updatePostProcessApiKey,
      updatePostProcessModel: state.updatePostProcessModel,
      fetchPostProcessModels: state.fetchPostProcessModels,
    })),
  );

  // Initialize on first mount. The store guards against repeat calls.
  useEffect(() => {
    if (store.isLoading) {
      store.initialize();
    }
  }, [store.initialize, store.isLoading]);

  return {
    settings: store.settings,
    isLoading: store.isLoading,
    isUpdating: store.isUpdatingKey,
    audioDevices: store.audioDevices,
    outputDevices: store.outputDevices,
    audioFeedbackEnabled: store.settings?.audio_feedback || false,
    postProcessModelOptions: store.postProcessModelOptions,
    updateChecksLocked: store.updateChecksLocked,
    updateSetting: store.updateSetting,
    resetSetting: store.resetSetting,
    refreshSettings: store.refreshSettings,
    refreshAudioDevices: store.refreshAudioDevices,
    refreshOutputDevices: store.refreshOutputDevices,
    updateBinding: store.updateBinding,
    resetBinding: store.resetBinding,
    getSetting: store.getSetting,
    setPostProcessProvider: store.setPostProcessProvider,
    updatePostProcessBaseUrl: store.updatePostProcessBaseUrl,
    updatePostProcessApiKey: store.updatePostProcessApiKey,
    updatePostProcessModel: store.updatePostProcessModel,
    fetchPostProcessModels: store.fetchPostProcessModels,
  };
};
