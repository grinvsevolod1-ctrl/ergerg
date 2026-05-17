"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Search, X, AlertCircle } from "lucide-react"

/* ── Country data with emoji flags ── */
const countries = [
  { code: "BY", dial: "+375", name: "Беларусь", flag: "\u{1F1E7}\u{1F1FE}", mask: "(##) ###-##-##" },
  { code: "RU", dial: "+7", name: "Россия", flag: "\u{1F1F7}\u{1F1FA}", mask: "(###) ###-##-##" },
  { code: "UA", dial: "+380", name: "Украина", flag: "\u{1F1FA}\u{1F1E6}", mask: "(##) ###-##-##" },
  { code: "KZ", dial: "+7", name: "Казахстан", flag: "\u{1F1F0}\u{1F1FF}", mask: "(###) ###-##-##" },
  { code: "PL", dial: "+48", name: "Польша", flag: "\u{1F1F5}\u{1F1F1}", mask: "(###) ###-###" },
  { code: "LT", dial: "+370", name: "Литва", flag: "\u{1F1F1}\u{1F1F9}", mask: "(###) ##-###" },
  { code: "LV", dial: "+371", name: "Латвия", flag: "\u{1F1F1}\u{1F1FB}", mask: "(####) ####" },
  { code: "DE", dial: "+49", name: "Германия", flag: "\u{1F1E9}\u{1F1EA}", mask: "(####) #######" },
  { code: "US", dial: "+1", name: "США", flag: "\u{1F1FA}\u{1F1F8}", mask: "(###) ###-####" },
  { code: "GB", dial: "+44", name: "Великобритания", flag: "\u{1F1EC}\u{1F1E7}", mask: "(####) ######" },
  { code: "UZ", dial: "+998", name: "Узбекистан", flag: "\u{1F1FA}\u{1F1FF}", mask: "(##) ###-##-##" },
  { code: "GE", dial: "+995", name: "Грузия", flag: "\u{1F1EC}\u{1F1EA}", mask: "(###) ##-##-##" },
  { code: "TR", dial: "+90", name: "Турция", flag: "\u{1F1F9}\u{1F1F7}", mask: "(###) ###-##-##" },
  { code: "AE", dial: "+971", name: "ОАЭ", flag: "\u{1F1E6}\u{1F1EA}", mask: "(##) ###-####" },
  { code: "IL", dial: "+972", name: "Израиль", flag: "\u{1F1EE}\u{1F1F1}", mask: "(##) ###-####" },
]

/* ── Helpers ── */
function applyMask(value: string, mask: string): string {
  let result = ""
  let vi = 0
  for (let mi = 0; mi < mask.length && vi < value.length; mi++) {
    if (mask[mi] === "#") {
      result += value[vi]
      vi++
    } else {
      result += mask[mi]
    }
  }
  return result
}

function stripNonDigits(s: string): string {
  return s.replace(/\D/g, "")
}

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  error?: string
  className?: string
}

export function PhoneInput({ value, onChange, error, className }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const hasDetected = useRef(false)

  useEffect(() => {
    if (hasDetected.current) return
    hasDetected.current = true
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const map: Record<string, string> = {
        "Minsk": "BY", "Moscow": "RU", "Russia": "RU",
        "Kiev": "UA", "Kyiv": "UA", "Warsaw": "PL",
        "Berlin": "DE", "London": "GB",
        "New_York": "US", "Los_Angeles": "US", "Chicago": "US",
        "Istanbul": "TR", "Tbilisi": "GE", "Tashkent": "UZ",
        "Almaty": "KZ", "Astana": "KZ",
      }
      for (const [key, code] of Object.entries(map)) {
        if (tz.includes(key)) {
          const found = countries.find(c => c.code === code)
          if (found) { setSelectedCountry(found); break }
        }
      }
    } catch { /* noop */ }
  }, [])

  const [localDigits, setLocalDigits] = useState("")
  const [isMerged, setIsMerged] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const mergedRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Parse initial value
  useEffect(() => {
    if (value) {
      const digits = stripNonDigits(value)
      for (const c of countries) {
        const dialDigits = stripNonDigits(c.dial)
        if (digits.startsWith(dialDigits)) {
          setSelectedCountry(c)
          setLocalDigits(digits.slice(dialDigits.length))
          return
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  /* Focus search when dropdown opens */
  useEffect(() => {
    if (isOpen && searchRef.current) {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [isOpen])

  const propagate = useCallback((country: typeof countries[0], digits: string) => {
    onChange(country.dial + digits)
  }, [onChange])

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripNonDigits(e.target.value)
    const maxDigits = selectedCountry.mask.split("").filter(c => c === "#").length
    const capped = raw.slice(0, maxDigits)
    setLocalDigits(capped)
    propagate(selectedCountry, capped)
  }

  const handleLocalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && localDigits === "") {
      e.preventDefault()
      setIsMerged(true)
      setTimeout(() => {
        if (mergedRef.current) {
          mergedRef.current.focus()
          const v = mergedRef.current.value
          mergedRef.current.setSelectionRange(v.length, v.length)
        }
      }, 10)
    }
  }

  const handleMergedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const digits = stripNonDigits(raw)

    if (raw.startsWith("+") && digits.length >= 2) {
      for (const c of countries) {
        const dialDigits = stripNonDigits(c.dial)
        if (digits.startsWith(dialDigits)) {
          const rest = digits.slice(dialDigits.length)
          setSelectedCountry(c)
          setLocalDigits(rest)
          setIsMerged(false)
          propagate(c, rest)
          setTimeout(() => inputRef.current?.focus(), 10)
          return
        }
      }
    }

    if (raw === "" || raw === "+") {
      onChange("")
      return
    }
    onChange(raw)
  }

  const handleMergedKeyDown = (e: React.KeyboardEvent) => {
    if (mergedRef.current) {
      const val = mergedRef.current.value
      if (val === "" && e.key !== "Backspace") {
        setIsMerged(false)
        setLocalDigits("")
        setTimeout(() => inputRef.current?.focus(), 10)
      }
    }
  }

  const selectCountry = (c: typeof countries[0]) => {
    setSelectedCountry(c)
    setLocalDigits("")
    setIsMerged(false)
    setIsOpen(false)
    setSearch("")
    propagate(c, "")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  /* Filter: search by name, dial code, or country code */
  const filteredCountries = search.trim()
    ? countries.filter(c => {
        const q = search.trim().toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.dial.includes(q) ||
          c.code.toLowerCase().includes(q)
        )
      })
    : countries

  const maskedValue = applyMask(localDigits, selectedCountry.mask)
  const maxDigits = selectedCountry.mask.split("").filter(c => c === "#").length
  const isComplete = localDigits.length === maxDigits

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center h-12 rounded-xl border-2 transition-all duration-200 overflow-hidden",
          error ? "border-red-500" : "border-border focus-within:border-primary",
          "bg-background/50"
        )}
      >
        {!isMerged ? (
          <>
            {/* Country selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 h-12 border-r border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <span className="text-base leading-none">{selectedCountry.flag}</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {selectedCountry.dial}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 max-h-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl z-50">
                  {/* Search */}
                  <div className="p-2 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Поиск страны..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full h-8 pl-8 pr-8 text-xs bg-background/50 rounded-lg border border-border/50 text-foreground focus:border-primary focus:outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => { setSearch(""); searchRef.current?.focus() }}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Country list */}
                  <div className="overflow-y-auto max-h-48 overscroll-contain">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code + c.dial}
                        type="button"
                        onClick={() => selectCountry(c)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors",
                          c.code === selectedCountry.code && "bg-primary/5"
                        )}
                      >
                        <span className="text-lg leading-none">{c.flag}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-foreground">{c.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{c.dial}</span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Страна не найдена
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Phone number input */}
            <input
              ref={inputRef}
              type="tel"
              value={maskedValue}
              onChange={handleLocalChange}
              onKeyDown={handleLocalKeyDown}
              placeholder={selectedCountry.mask.replace(/#/g, "0")}
              className="flex-1 h-full px-3 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/50 tabular-nums"
            />

            {/* Validation indicator */}
            {localDigits.length > 0 && (
              <div className="pr-3">
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {localDigits.length}/{maxDigits}
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <input
            ref={mergedRef}
            type="tel"
            defaultValue={selectedCountry.dial}
            onChange={handleMergedChange}
            onKeyDown={handleMergedKeyDown}
            placeholder="+375..."
            className="flex-1 h-full px-3 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/50 tabular-nums"
          />
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  )
}
