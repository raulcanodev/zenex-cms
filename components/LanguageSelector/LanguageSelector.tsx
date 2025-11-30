"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { languages, getLanguageName, type Language } from "@/lib/languages";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function LanguageSelector({
  value,
  onValueChange,
  required = true,
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLanguage = value ? languages.find((lang) => lang.code === value) : null;

  const filteredLanguages = languages.filter((lang) => {
    const query = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function handleSelect(language: Language) {
    onValueChange(language.code);
    setIsOpen(false);
    setSearchQuery("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function handleTriggerClick() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : selectedLanguage ? `${selectedLanguage.name} (${selectedLanguage.code})` : ""}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search language..."
          required={required}
          className="h-9 w-auto max-w-md border-0 bg-transparent px-2 pr-8 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
          onClick={handleTriggerClick}
        />
        <button
          type="button"
          onClick={handleTriggerClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <ChevronDownIcon
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleSelect(language)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    value === language.code && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="flex-1 text-left">
                    {language.name} ({language.code})
                  </span>
                  {value === language.code && (
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

