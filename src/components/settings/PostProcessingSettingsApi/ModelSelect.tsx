import React from "react";
import { useTranslation } from "react-i18next";
import type { ModelOption } from "./types";
import { Select } from "../../ui/Select";

type ModelSelectProps = {
  value: string;
  options: ModelOption[];
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  onSelect: (value: string) => void;
  onCreate: (value: string) => void;
  className?: string;
};

export const ModelSelect: React.FC<ModelSelectProps> = React.memo(
  ({
    value,
    options,
    disabled,
    placeholder,
    isLoading,
    onSelect,
    onCreate,
    className = "flex-1 min-w-[360px]",
  }) => {
    const { t } = useTranslation();
    const handleCreate = (inputValue: string) => {
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      onCreate(trimmed);
    };

    const computedClassName = `text-sm ${className}`;

    return (
      <Select
        className={computedClassName}
        value={value || null}
        options={options}
        onChange={(selected) => onSelect(selected ?? "")}
        onCreateOption={handleCreate}
        placeholder={placeholder}
        disabled={disabled}
        isLoading={isLoading}
        isCreatable
        formatCreateLabel={(input) =>
          t("settings.postProcessing.api.model.useCustom", { input })
        }
      />
    );
  },
);

ModelSelect.displayName = "ModelSelect";
