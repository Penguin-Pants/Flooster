import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../ui/Input";

interface ApiKeyFieldProps {
  value: string;
  onBlur: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  className?: string;
}

export const ApiKeyField: React.FC<ApiKeyFieldProps> = React.memo(
  ({ value, onBlur, disabled, placeholder, className = "" }) => {
    const { t } = useTranslation();
    const [localValue, setLocalValue] = useState(value);
    // Masked by default; the toggle lets the user check a pasted key.
    const [revealed, setRevealed] = useState(false);

    // Sync with prop changes. A new value is another provider's key (the
    // component stays mounted across provider switches), so mask it again
    // rather than showing it in plain text because the previous one was shown.
    React.useEffect(() => {
      setLocalValue(value);
      setRevealed(false);
    }, [value]);

    return (
      <div
        className={`flex flex-1 items-center gap-1 min-w-[320px] ${className}`}
      >
        <Input
          type={revealed ? "text" : "password"}
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          onBlur={() => onBlur(localValue)}
          placeholder={placeholder}
          variant="compact"
          disabled={disabled}
          className="flex-1"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setRevealed((shown) => !shown)}
          disabled={disabled}
          aria-pressed={revealed}
          aria-label={
            revealed
              ? t("settings.postProcessing.api.apiKey.hide")
              : t("settings.postProcessing.api.apiKey.show")
          }
          className="p-1.5 rounded-md text-text/60 hover:text-logo-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {revealed ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

ApiKeyField.displayName = "ApiKeyField";
