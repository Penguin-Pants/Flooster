import React from "react";
import { useTranslation } from "react-i18next";
import type { ShortcutBinding } from "@/bindings";
import { formatKeyCombination, type OSType } from "../../lib/utils/keyboard";
import { ResetButton } from "../ui/ResetButton";
import { SettingContainer } from "../ui/SettingContainer";

export interface ShortcutInputViewProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
  disabled?: boolean;
  shortcutId: string;
  osType: OSType;
  isLoading: boolean;
  hasBindings: boolean;
  binding: ShortcutBinding | undefined;
  isRecording: boolean;
  /** Text shown while recording (the keys pressed so far, or a prompt). */
  recordingLabel: string;
  recordingRef?: React.Ref<HTMLDivElement>;
  onStartRecording: () => void;
  onReset: () => void;
  resetDisabled: boolean;
}

/**
 * Presentation shared by the Tauri and HandyKeys shortcut inputs: loading,
 * empty and not-found states, the translated binding name, and the control
 * row. The capture logic stays in each implementation.
 */
export const ShortcutInputView: React.FC<ShortcutInputViewProps> = ({
  descriptionMode = "tooltip",
  grouped = false,
  disabled = false,
  shortcutId,
  osType,
  isLoading,
  hasBindings,
  binding,
  isRecording,
  recordingLabel,
  recordingRef,
  onStartRecording,
  onReset,
  resetDisabled,
}) => {
  const { t } = useTranslation();

  if (isLoading || !hasBindings || !binding) {
    return (
      <SettingContainer
        title={t("settings.general.shortcut.title")}
        description={
          !isLoading && hasBindings && !binding
            ? t("settings.general.shortcut.notFound")
            : t("settings.general.shortcut.description")
        }
        descriptionMode={descriptionMode}
        grouped={grouped}
      >
        <div className="text-sm text-mid-gray">
          {isLoading
            ? t("settings.general.shortcut.loading")
            : t("settings.general.shortcut.none")}
        </div>
      </SettingContainer>
    );
  }

  const translatedName = t(
    `settings.general.shortcut.bindings.${shortcutId}.name`,
    binding.name,
  );
  const translatedDescription = t(
    `settings.general.shortcut.bindings.${shortcutId}.description`,
    binding.description,
  );

  return (
    <SettingContainer
      title={translatedName}
      description={translatedDescription}
      descriptionMode={descriptionMode}
      grouped={grouped}
      disabled={disabled}
      layout="horizontal"
    >
      <div className="flex items-center space-x-1">
        {isRecording ? (
          <div
            ref={recordingRef}
            role="status"
            aria-live="polite"
            className="px-2 py-1 text-sm font-semibold border border-logo-primary bg-logo-primary/30 rounded-md"
          >
            {recordingLabel}
          </div>
        ) : (
          <button
            type="button"
            className="px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 hover:bg-logo-primary/10 rounded-md cursor-pointer hover:border-logo-primary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStartRecording}
            disabled={disabled}
            aria-label={t("settings.general.shortcut.changeShortcut", {
              name: translatedName,
            })}
          >
            {formatKeyCombination(binding.current_binding, osType)}
          </button>
        )}
        <ResetButton onClick={onReset} disabled={resetDisabled} />
      </div>
    </SettingContainer>
  );
};
