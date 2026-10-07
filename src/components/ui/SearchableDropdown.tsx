import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: SearchableOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  /** Visible trigger content (label text, optional icon). */
  trigger: React.ReactNode;
  triggerClassName: string;
  /** Accessible name for the trigger when its visible content is not enough. */
  triggerAriaLabel?: string;
  /** Position/size classes for the menu (defaults to full trigger width). */
  menuClassName?: string;
  searchPlaceholder: string;
  noResultsText: string;
  disabled?: boolean;
  /** An option listed above the filtered ones and never filtered out. */
  leadingOption?: SearchableOption;
  /** Chevron is rendered by the caller inside `trigger`; this reports state. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A searchable listbox: trigger button, search field, filtered options. One
 * implementation for every language-style picker, with the ARIA wiring and
 * keyboard handling (type to filter, arrows to move, Enter to pick, Escape to
 * close) that the previous copies lacked.
 */
export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  trigger,
  triggerClassName,
  triggerAriaLabel,
  menuClassName = "left-0 right-0",
  searchPlaceholder,
  noResultsText,
  disabled = false,
  leadingOption,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  // Latest callback for the document-level listener registered in an effect.
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter((o) => o.label.toLowerCase().includes(q))
      : options;
    return leadingOption ? [leadingOption, ...matches] : matches;
  }, [options, query, leadingOption]);

  const close = (returnFocus: boolean) => {
    setIsOpen(false);
    setQuery("");
    setHighlighted(0);
    onOpenChange?.(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setHighlighted(
      Math.max(
        0,
        filtered.findIndex((o) => o.value === selectedValue),
      ),
    );
    onOpenChange?.(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        // Same as close(false); inlined so the effect depends on state only.
        setIsOpen(false);
        setQuery("");
        setHighlighted(0);
        onOpenChangeRef.current?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  // Keep the highlight inside the filtered list as the query changes.
  useEffect(() => {
    if (highlighted >= filtered.length) setHighlighted(0);
  }, [filtered.length, highlighted]);

  const pick = (value: string) => {
    onSelect(value);
    close(true);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlighted((i) =>
          filtered.length ? (i + 1) % filtered.length : 0,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlighted((i) =>
          filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
        );
        break;
      case "Enter":
        event.preventDefault();
        if (filtered[highlighted]) pick(filtered[highlighted].value);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        onClick={() => (isOpen ? close(false) : open())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={triggerAriaLabel}
      >
        {trigger}
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute top-full mt-1 bg-background border border-mid-gray/80 rounded-md shadow-lg z-50 overflow-hidden ${menuClassName}`}
        >
          <div className="p-2 border-b border-mid-gray/40">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={
                filtered[highlighted] ? `${listId}-${highlighted}` : undefined
              }
              role="combobox"
              aria-expanded={true}
              aria-autocomplete="list"
              className="w-full px-2 py-1 text-sm bg-mid-gray/10 border border-mid-gray/40 rounded-md focus:outline-none focus:ring-1 focus:ring-logo-primary focus:border-logo-primary"
            />
          </div>
          <div
            id={listId}
            role="listbox"
            aria-label={t("common.options")}
            className="max-h-48 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="px-2 py-2 text-sm text-mid-gray text-center">
                {noResultsText}
              </div>
            ) : (
              filtered.map((option, index) => {
                const selected = option.value === selectedValue;
                const active = index === highlighted;
                return (
                  <button
                    key={option.value}
                    id={`${listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={-1}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => pick(option.value)}
                    className={`w-full px-3 py-1.5 text-sm text-start transition-colors duration-150 ${
                      selected
                        ? "bg-logo-primary/20 text-logo-primary font-semibold"
                        : active
                          ? "bg-logo-primary/10"
                          : "hover:bg-logo-primary/10"
                    }`}
                  >
                    <span className="block truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
