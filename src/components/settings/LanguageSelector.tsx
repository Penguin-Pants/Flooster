import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../ui/SettingContainer";
import { ResetButton } from "../ui/ResetButton";
import { SearchableDropdown } from "../ui/SearchableDropdown";
import { useSettings } from "../../hooks/useSettings";
import {
  getLanguageLabel,
  LANGUAGES,
  recognitionLanguage,
  supportsLanguageCode,
} from "../../lib/constants/languages";

interface LanguageSelectorProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
  supportedLanguages?: string[];
  // Whether the model can auto-detect language. Gates the "Auto" option:
  // must-pick models (no detection) omit it and force a concrete choice.
  supportsLanguageDetection?: boolean;
}

// Mirrors the matching logic of `effective_language` in
// src-tauri/src/managers/model.rs. The Rust function is authoritative for the
// *concrete* code the engine receives (e.g. `nb`); this resolves the canonical
// picker intent (e.g. `no`) so model switches preserve the user's language.
// Model codes such as `en-US` and `nb` resolve to their `en` / `no` entry.
const effectiveLanguage = (
  intent: string,
  supported: string[],
  supportsDetection: boolean,
): string => {
  if (supported.length === 0) return recognitionLanguage(intent);
  if (intent !== "auto" && supportsLanguageCode(supported, intent))
    return recognitionLanguage(intent);
  if (supportsDetection) return "auto";
  if (supportsLanguageCode(supported, "en")) return "en";
  return recognitionLanguage(supported[0]);
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  descriptionMode = "tooltip",
  grouped = false,
  supportedLanguages,
  supportsLanguageDetection = true,
}) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, resetSetting, isUpdating } = useSettings();

  // The persisted *intent* (auto | code). What's actually used/shown is the
  // effective value resolved against the current model's capabilities.
  const intent = getSetting("selected_language") || "auto";
  const selectedLanguage = effectiveLanguage(
    intent,
    supportedLanguages ?? [],
    supportsLanguageDetection,
  );

  const availableLanguages = useMemo(() => {
    if (!supportedLanguages || supportedLanguages.length === 0)
      return LANGUAGES;
    return LANGUAGES.filter((lang) =>
      lang.value === "auto"
        ? supportsLanguageDetection
        : supportsLanguageCode(supportedLanguages, lang.value),
    );
  }, [supportedLanguages, supportsLanguageDetection]);

  const selectedLanguageName =
    getLanguageLabel(selectedLanguage) || t("settings.general.language.auto");

  const handleLanguageSelect = async (languageCode: string) => {
    await updateSetting("selected_language", languageCode);
  };

  const handleReset = async () => {
    await resetSetting("selected_language");
  };

  const updating = isUpdating("selected_language");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SettingContainer
      title={t("settings.general.language.title")}
      description={t("settings.general.language.description")}
      descriptionMode={descriptionMode}
      grouped={grouped}
    >
      <div className="flex items-center space-x-1">
        <SearchableDropdown
          options={availableLanguages}
          selectedValue={selectedLanguage}
          onSelect={handleLanguageSelect}
          disabled={updating}
          searchPlaceholder={t("settings.general.language.searchPlaceholder")}
          noResultsText={t("settings.general.language.noResults")}
          onOpenChange={setIsOpen}
          triggerAriaLabel={`${t("settings.general.language.title")}: ${selectedLanguageName}`}
          triggerClassName={`px-2 py-1 text-sm font-semibold bg-mid-gray/10 border border-mid-gray/80 rounded min-w-[200px] text-start flex items-center justify-between transition-all duration-150 ${
            updating
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-logo-primary/10 cursor-pointer hover:border-logo-primary"
          }`}
          trigger={
            <>
              <span className="truncate">{selectedLanguageName}</span>
              <svg
                className={`w-4 h-4 ms-2 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          }
        />
        <ResetButton onClick={handleReset} disabled={updating} />
      </div>
      {updating && (
        <div className="absolute inset-0 bg-mid-gray/10 rounded flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-logo-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </SettingContainer>
  );
};
