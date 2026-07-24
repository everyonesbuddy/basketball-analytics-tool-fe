import { useEffect, useMemo, useState } from "react";

type Option = {
  id: string;
  label: string;
};

type SearchableEntitySelectProps = {
  id: string;
  label: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  fallbackPrefix?: string;
  emptyMessage?: string;
  onQueryChange?: (query: string) => void;
  onChange: (nextId: string) => void;
};

const formatOptionLabel = (option: Option): string =>
  `${option.label} (#${option.id})`;

const SearchableEntitySelect = ({
  id,
  label,
  value,
  options,
  disabled,
  placeholder,
  fallbackPrefix = "Entry",
  emptyMessage,
  onQueryChange,
  onChange,
}: SearchableEntitySelectProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.id === value),
    [options, value],
  );

  const selectedLabel = useMemo(() => {
    if (selected) {
      return formatOptionLabel(selected);
    }

    return value ? `${fallbackPrefix} #${value} (#${value})` : "";
  }, [selected, value, fallbackPrefix]);

  useEffect(() => {
    // Keep text stable while typing; only sync when the menu is closed.
    if (isOpen) {
      return;
    }

    setQuery(selectedLabel);
  }, [selectedLabel, isOpen]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle.length) {
      return options.slice(0, 25);
    }

    return options
      .filter((option) => {
        const text = `${option.label} ${option.id}`.toLowerCase();
        return text.includes(needle);
      })
      .slice(0, 25);
  }, [options, query]);

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    onQueryChange?.("");
    onChange("");
  };

  const showClearButton = Boolean((query.trim() || value) && !disabled);

  return (
    <div className="searchable-select">
      <label htmlFor={id}>{label}</label>
      <div className="searchable-input-wrap">
        <input
          id={id}
          className="searchable-input"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            onQueryChange?.(nextQuery);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false);
            }, 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && filtered.length) {
              event.preventDefault();
              const next = filtered[0];
              onChange(next.id);
              setQuery(formatOptionLabel(next));
              setIsOpen(false);
            }

            if (event.key === "Escape") {
              handleClear();
            }
          }}
          placeholder={placeholder ?? "Search by name or ID"}
          disabled={disabled}
          autoComplete="off"
        />

        {showClearButton ? (
          <button
            type="button"
            className="searchable-clear"
            aria-label={`Clear ${label}`}
            onMouseDown={(event) => {
              event.preventDefault();
              handleClear();
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div className="searchable-menu" role="listbox" aria-label={label}>
          {filtered.length ? (
            filtered.map((option) => (
              <button
                key={`${id}-${option.id}`}
                type="button"
                className={`searchable-item ${option.id === value ? "active" : ""}`}
                onMouseDown={() => {
                  onChange(option.id);
                  setQuery(formatOptionLabel(option));
                  setIsOpen(false);
                }}
              >
                {formatOptionLabel(option)}
              </button>
            ))
          ) : (
            <p className="searchable-empty">
              {emptyMessage ?? "No matching options found."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchableEntitySelect;
