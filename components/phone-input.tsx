"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/* ── Extended country data with masks and validation ── */
const countries = [
  // CIS & Eastern Europe (priority)
  { code: "BY", dial: "+375", name: "Беларусь", flag: "\u{1F1E7}\u{1F1FE}", mask: "## ###-##-##", length: 9, example: "29 123-45-67" },
  { code: "RU", dial: "+7", name: "Россия", flag: "\u{1F1F7}\u{1F1FA}", mask: "### ###-##-##", length: 10, example: "999 123-45-67" },
  { code: "UA", dial: "+380", name: "Украина", flag: "\u{1F1FA}\u{1F1E6}", mask: "## ###-##-##", length: 9, example: "67 123-45-67" },
  { code: "KZ", dial: "+77", name: "Казахстан", flag: "\u{1F1F0}\u{1F1FF}", mask: "## ###-##-##", length: 9, example: "01 234-56-78" },
  { code: "UZ", dial: "+998", name: "Узбекистан", flag: "\u{1F1FA}\u{1F1FF}", mask: "## ###-##-##", length: 9, example: "90 123-45-67" },
  { code: "GE", dial: "+995", name: "Грузия", flag: "\u{1F1EC}\u{1F1EA}", mask: "### ##-##-##", length: 9, example: "555 12-34-56" },
  { code: "AM", dial: "+374", name: "Армения", flag: "\u{1F1E6}\u{1F1F2}", mask: "## ######", length: 8, example: "91 123456" },
  { code: "AZ", dial: "+994", name: "Азербайджан", flag: "\u{1F1E6}\u{1F1FF}", mask: "## ### ## ##", length: 9, example: "50 123 45 67" },
  { code: "TJ", dial: "+992", name: "Таджикистан", flag: "\u{1F1F9}\u{1F1EF}", mask: "## ### ## ##", length: 9, example: "90 123 45 67" },
  { code: "KG", dial: "+996", name: "Кыргызстан", flag: "\u{1F1F0}\u{1F1EC}", mask: "### ##-##-##", length: 9, example: "555 12-34-56" },
  { code: "MD", dial: "+373", name: "Молдова", flag: "\u{1F1F2}\u{1F1E9}", mask: "### ## ###", length: 8, example: "691 23 456" },
  
  // Baltic
  { code: "LT", dial: "+370", name: "Литва", flag: "\u{1F1F1}\u{1F1F9}", mask: "### #####", length: 8, example: "612 34567" },
  { code: "LV", dial: "+371", name: "Латвия", flag: "\u{1F1F1}\u{1F1FB}", mask: "## ### ###", length: 8, example: "21 234 567" },
  { code: "EE", dial: "+372", name: "Эстония", flag: "\u{1F1EA}\u{1F1EA}", mask: "#### ####", length: 8, example: "5123 4567" },
  
  // Europe
  { code: "PL", dial: "+48", name: "Польша", flag: "\u{1F1F5}\u{1F1F1}", mask: "### ### ###", length: 9, example: "123 456 789" },
  { code: "DE", dial: "+49", name: "Германия", flag: "\u{1F1E9}\u{1F1EA}", mask: "### #######", length: 10, example: "170 1234567" },
  { code: "GB", dial: "+44", name: "Великобритания", flag: "\u{1F1EC}\u{1F1E7}", mask: "#### ######", length: 10, example: "7911 123456" },
  { code: "FR", dial: "+33", name: "Франция", flag: "\u{1F1EB}\u{1F1F7}", mask: "# ## ## ## ##", length: 9, example: "6 12 34 56 78" },
  { code: "IT", dial: "+39", name: "Италия", flag: "\u{1F1EE}\u{1F1F9}", mask: "### ### ####", length: 10, example: "312 345 6789" },
  { code: "ES", dial: "+34", name: "Испания", flag: "\u{1F1EA}\u{1F1F8}", mask: "### ### ###", length: 9, example: "612 345 678" },
  { code: "CZ", dial: "+420", name: "Чехия", flag: "\u{1F1E8}\u{1F1FF}", mask: "### ### ###", length: 9, example: "601 123 456" },
  { code: "AT", dial: "+43", name: "Австрия", flag: "\u{1F1E6}\u{1F1F9}", mask: "### #######", length: 10, example: "664 1234567" },
  { code: "CH", dial: "+41", name: "Швейцария", flag: "\u{1F1E8}\u{1F1ED}", mask: "## ### ## ##", length: 9, example: "79 123 45 67" },
  { code: "NL", dial: "+31", name: "Нидерланды", flag: "\u{1F1F3}\u{1F1F1}", mask: "# ########", length: 9, example: "6 12345678" },
  { code: "BE", dial: "+32", name: "Бельгия", flag: "\u{1F1E7}\u{1F1EA}", mask: "### ## ## ##", length: 9, example: "470 12 34 56" },
  { code: "SE", dial: "+46", name: "Швеция", flag: "\u{1F1F8}\u{1F1EA}", mask: "##-### ## ##", length: 9, example: "70-123 45 67" },
  { code: "NO", dial: "+47", name: "Норвегия", flag: "\u{1F1F3}\u{1F1F4}", mask: "### ## ###", length: 8, example: "912 34 567" },
  { code: "FI", dial: "+358", name: "Финляндия", flag: "\u{1F1EB}\u{1F1EE}", mask: "## ### ####", length: 9, example: "40 123 4567" },
  { code: "DK", dial: "+45", name: "Дания", flag: "\u{1F1E9}\u{1F1F0}", mask: "## ## ## ##", length: 8, example: "20 12 34 56" },
  { code: "PT", dial: "+351", name: "Португалия", flag: "\u{1F1F5}\u{1F1F9}", mask: "### ### ###", length: 9, example: "912 345 678" },
  { code: "GR", dial: "+30", name: "Греция", flag: "\u{1F1EC}\u{1F1F7}", mask: "### ### ####", length: 10, example: "697 123 4567" },
  
  // Middle East
  { code: "TR", dial: "+90", name: "Турция", flag: "\u{1F1F9}\u{1F1F7}", mask: "### ###-##-##", length: 10, example: "532 123-45-67" },
  { code: "AE", dial: "+971", name: "ОАЭ", flag: "\u{1F1E6}\u{1F1EA}", mask: "## ### ####", length: 9, example: "50 123 4567" },
  { code: "IL", dial: "+972", name: "Израиль", flag: "\u{1F1EE}\u{1F1F1}", mask: "##-###-####", length: 9, example: "50-123-4567" },
  { code: "SA", dial: "+966", name: "Саудовская Аравия", flag: "\u{1F1F8}\u{1F1E6}", mask: "## ### ####", length: 9, example: "50 123 4567" },
  
  // Americas
  { code: "US", dial: "+1", name: "США", flag: "\u{1F1FA}\u{1F1F8}", mask: "### ###-####", length: 10, example: "202 555-1234" },
  { code: "CA", dial: "+1", name: "Канада", flag: "\u{1F1E8}\u{1F1E6}", mask: "### ###-####", length: 10, example: "416 555-1234" },
  { code: "BR", dial: "+55", name: "Бразилия", flag: "\u{1F1E7}\u{1F1F7}", mask: "## #####-####", length: 11, example: "11 91234-5678" },
  { code: "MX", dial: "+52", name: "Мексика", flag: "\u{1F1F2}\u{1F1FD}", mask: "## #### ####", length: 10, example: "55 1234 5678" },
  
  // Asia
  { code: "CN", dial: "+86", name: "Китай", flag: "\u{1F1E8}\u{1F1F3}", mask: "### #### ####", length: 11, example: "138 1234 5678" },
  { code: "JP", dial: "+81", name: "Япония", flag: "\u{1F1EF}\u{1F1F5}", mask: "##-####-####", length: 10, example: "90-1234-5678" },
  { code: "KR", dial: "+82", name: "Южная Корея", flag: "\u{1F1F0}\u{1F1F7}", mask: "##-####-####", length: 10, example: "10-1234-5678" },
  { code: "IN", dial: "+91", name: "Индия", flag: "\u{1F1EE}\u{1F1F3}", mask: "##### #####", length: 10, example: "98765 43210" },
  { code: "TH", dial: "+66", name: "Таиланд", flag: "\u{1F1F9}\u{1F1ED}", mask: "## ### ####", length: 9, example: "81 234 5678" },
  
  // Oceania
  { code: "AU", dial: "+61", name: "Австралия", flag: "\u{1F1E6}\u{1F1FA}", mask: "### ### ###", length: 9, example: "412 345 678" },
  { code: "NZ", dial: "+64", name: "Новая Зеландия", flag: "\u{1F1F3}\u{1F1FF}", mask: "## ### ####", length: 9, example: "21 123 4567" },
]

/* ── Helper functions ── */
function applyMask(value: string, mask: string): string {
  if (!value) return ""
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

// Detect country from dial code input
function detectCountryFromDial(digits: string): typeof countries[0] | null {
  if (digits.length < 1) return null
  
  // Sort by dial code length (longest first) for accurate matching
  const sorted = [...countries].sort((a, b) => {
    const aDigits = stripNonDigits(a.dial)
    const bDigits = stripNonDigits(b.dial)
    return bDigits.length - aDigits.length
  })
  
  for (const country of sorted) {
    const dialDigits = stripNonDigits(country.dial)
    if (digits.startsWith(dialDigits)) {
      return country
    }
  }
  return null
}

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  error?: string
  className?: string
}

export function PhoneInput({ value, onChange, error, className }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [localDigits, setLocalDigits] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const hasDetected = useRef(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Auto-detect country on mount
  useEffect(() => {
    if (hasDetected.current) return
    hasDetected.current = true
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const tzMap: Record<string, string> = {
        "Minsk": "BY", "Moscow": "RU", "Russia": "RU",
        "Kiev": "UA", "Kyiv": "UA", "Warsaw": "PL",
        "Berlin": "DE", "London": "GB",
        "New_York": "US", "Los_Angeles": "US", "Chicago": "US",
        "Istanbul": "TR", "Tbilisi": "GE", "Tashkent": "UZ",
        "Almaty": "KZ", "Astana": "KZ",
      }
      for (const [key, code] of Object.entries(tzMap)) {
        if (tz.includes(key)) {
          const found = countries.find(c => c.code === code)
          if (found) { setSelectedCountry(found); break }
        }
      }
    } catch { /* noop */ }
  }, [])

  // Parse initial value
  useEffect(() => {
    if (value) {
      const digits = stripNonDigits(value)
      const detected = detectCountryFromDial(digits)
      if (detected) {
        setSelectedCountry(detected)
        const dialDigits = stripNonDigits(detected.dial)
        setLocalDigits(digits.slice(dialDigits.length))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  const propagate = useCallback((country: typeof countries[0], digits: string) => {
    onChange(country.dial + digits)
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    // Get raw digits from the masked input
    const raw = stripNonDigits(inputValue)
    const maxDigits = selectedCountry.length
    const capped = raw.slice(0, maxDigits)
    
    setLocalDigits(capped)
    propagate(selectedCountry, capped)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 46, 9, 27, 13].includes(e.keyCode)) return
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) return
    // Allow: home, end, left, right
    if ([35, 36, 37, 39].includes(e.keyCode)) return
    // Block non-numeric
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const selectCountry = (c: typeof countries[0]) => {
    setSelectedCountry(c)
    setLocalDigits("")
    setIsOpen(false)
    propagate(c, "")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Computed values
  const maskedValue = useMemo(() => 
    applyMask(localDigits, selectedCountry.mask),
    [localDigits, selectedCountry.mask]
  )
  
  const isComplete = localDigits.length === selectedCountry.length
  const isPartiallyFilled = localDigits.length > 0
  const progress = selectedCountry.length > 0 
    ? (localDigits.length / selectedCountry.length) * 100 
    : 0

  // Group countries by region for better UX
  const groupedCountries = useMemo(() => {
    const groups = {
      "СНГ": countries.slice(0, 11),
      "Балтика": countries.slice(11, 14),
      "Европа": countries.slice(14, 31),
      "Ближний Восток": countries.slice(31, 35),
      "Америка": countries.slice(35, 39),
      "Азия": countries.slice(39, 44),
      "Океания": countries.slice(44),
    }
    return groups
  }, [])

  return (
    <div className={cn("relative", className)}>
      {/* Main container */}
      <div
        className={cn(
          "relative flex items-center rounded-xl overflow-hidden transition-all duration-300",
          "border-2 bg-background/50 backdrop-blur-sm",
          error 
            ? "border-red-500/50" 
            : isFocused 
              ? "border-primary shadow-lg shadow-primary/10" 
              : "border-border hover:border-border/80"
        )}
      >
        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/30">
          <motion.div
            className={cn(
              "h-full transition-colors duration-300",
              isComplete ? "bg-green-500" : "bg-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Country selector button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 h-12 sm:h-14",
            "border-r border-border/50",
            "hover:bg-secondary/50 active:bg-secondary/70",
            "transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          {/* Flag with animation */}
          <motion.span 
            key={selectedCountry.code}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl sm:text-2xl leading-none"
          >
            {selectedCountry.flag}
          </motion.span>
          
          {/* Dial code */}
          <span className="text-sm sm:text-base font-semibold text-foreground tabular-nums min-w-[3.5rem]">
            {selectedCountry.dial}
          </span>
          
          {/* Chevron */}
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </button>

        {/* Phone number input */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={maskedValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={selectedCountry.example}
            className={cn(
              "w-full h-12 sm:h-14 px-3 sm:px-4",
              "text-base sm:text-lg font-medium tabular-nums",
              "bg-transparent focus:outline-none",
              "text-foreground placeholder:text-muted-foreground/40",
              "transition-colors duration-200"
            )}
          />
          
          {/* Validation status indicator */}
          <div className="pr-3 sm:pr-4 flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10"
                >
                  <Check className="w-4 h-4 text-green-500" />
                </motion.div>
              ) : isPartiallyFilled ? (
                <motion.span
                  key="counter"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "text-xs font-medium tabular-nums px-2 py-1 rounded-md",
                    "bg-secondary/50 text-muted-foreground"
                  )}
                >
                  {localDigits.length}/{selectedCountry.length}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50",
              "bg-popover/95 backdrop-blur-xl",
              "border border-border rounded-xl",
              "shadow-2xl shadow-black/20",
              "overflow-hidden"
            )}
          >
            {/* Scrollable country list */}
            <div className="max-h-[320px] overflow-y-auto overscroll-contain">
              {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                <div key={region}>
                  {/* Region header */}
                  <div className="sticky top-0 px-3 py-2 bg-secondary/80 backdrop-blur-sm border-b border-border/50">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {region}
                    </span>
                  </div>
                  
                  {/* Countries in region */}
                  {regionCountries.map((c) => (
                    <button
                      key={c.code + c.dial}
                      type="button"
                      onClick={() => selectCountry(c)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 sm:py-3",
                        "text-left transition-colors duration-150",
                        "hover:bg-accent/50 active:bg-accent/70",
                        "focus:outline-none focus-visible:bg-accent/50",
                        c.code === selectedCountry.code && c.dial === selectedCountry.dial && 
                          "bg-primary/5 border-l-2 border-primary"
                      )}
                    >
                      {/* Flag */}
                      <span className="text-xl sm:text-2xl leading-none flex-shrink-0">
                        {c.flag}
                      </span>
                      
                      {/* Country name */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm sm:text-base text-foreground truncate block">
                          {c.name}
                        </span>
                      </div>
                      
                      {/* Dial code */}
                      <span className="text-xs sm:text-sm text-muted-foreground tabular-nums flex-shrink-0">
                        {c.dial}
                      </span>
                      
                      {/* Selected indicator */}
                      {c.code === selectedCountry.code && c.dial === selectedCountry.dial && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-red-500 flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
