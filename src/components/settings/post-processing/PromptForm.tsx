import React, { useId } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui";
import { Input } from "../../ui/Input";

interface PromptFormProps {
  name: string;
  text: string;
  onNameChange: (value: string) => void;
  onTextChange: (value: string) => void;
  /** Button row rendered under the fields (differs between create and edit). */
  actions: React.ReactNode;
}

/**
 * The prompt name and instructions fields, shared by the create and edit
 * views. Labels are tied to their inputs with `htmlFor`.
 */
export const PromptForm: React.FC<PromptFormProps> = ({
  name,
  text,
  onNameChange,
  onTextChange,
  actions,
}) => {
  const { t } = useTranslation();
  const nameId = useId();
  const textId = useId();

  return (
    <div className="space-y-3">
      <div className="space-y-2 flex flex-col">
        <label htmlFor={nameId} className="text-sm font-semibold">
          {t("settings.postProcessing.prompts.promptLabel")}
        </label>
        <Input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t(
            "settings.postProcessing.prompts.promptLabelPlaceholder",
          )}
          variant="compact"
        />
      </div>

      <div className="space-y-2 flex flex-col">
        <label htmlFor={textId} className="text-sm font-semibold">
          {t("settings.postProcessing.prompts.promptInstructions")}
        </label>
        <Textarea
          id={textId}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={t(
            "settings.postProcessing.prompts.promptInstructionsPlaceholder",
          )}
        />
        <p className="text-xs text-mid-gray/70">
          <Trans
            i18nKey="settings.postProcessing.prompts.promptTip"
            components={{ code: <code /> }}
          />
        </p>
      </div>

      <div className="flex gap-2 pt-2">{actions}</div>
    </div>
  );
};
