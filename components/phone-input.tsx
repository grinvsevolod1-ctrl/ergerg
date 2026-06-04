"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/* ── Country data with masks, validation and SVG flags ── */
interface Country {
  code: string
  dial: string
  name: string
  flag: string
  mask: string
  length: number
  example: string
}

const countries: Country[] = [
  // CIS & Eastern Europe (priority)
  { code: "BY", dial: "+375", name: "Беларусь", flag: "🇧🇾", mask: "## ###-##-##", length: 9, example: "29 123-45-67" },
  { code: "RU", dial: "+7", name: "Россия", flag: "🇷🇺", mask: "### ###-##-##", length: 10, example: "999 123-45-67" },
  { code: "UA", dial: "+380", name: "Украина", flag: "🇺🇦", mask: "## ###-##-##", length: 9, example: "67 123-45-67" },
  { code: "KZ", dial: "+77", name: "Казахстан", flag: "🇰🇿", mask: "## ###-##-##", length: 9, example: "01 234-56-78" },
  { code: "UZ", dial: "+998", name: "Узбекистан", flag: "🇺🇿", mask: "## ###-##-##", length: 9, example: "90 123-45-67" },
  { code: "GE", dial: "+995", name: "Грузия", flag: "🇬🇪", mask: "### ##-##-##", length: 9, example: "555 12-34-56" },
  { code: "AM", dial: "+374", name: "Армения", flag: "🇦🇲", mask: "## ######", length: 8, example: "91 123456" },
  { code: "AZ", dial: "+994", name: "Азербайджан", flag: "🇦🇿", mask: "## ### ## ##", length: 9, example: "50 123 45 67" },
  { code: "TJ", dial: "+992", name: "Таджикистан", flag: "🇹🇯", mask: "## ### ## ##", length: 9, example: "90 123 45 67" },
  { code: "KG", dial: "+996", name: "Кыргызстан", flag: "🇰🇬", mask: "### ##-##-##", length: 9, example: "555 12-34-56" },
  { code: "MD", dial: "+373", name: "Молдова", flag: "🇲🇩", mask: "### ## ###", length: 8, example: "691 23 456" },
  
  // Baltic
  { code: "LT", dial: "+370", name: "Литва", flag: "🇱🇹", mask: "### #####", length: 8, example: "612 34567" },
  { code: "LV", dial: "+371", name: "Латвия", flag: "🇱🇻", mask: "## ### ###", length: 8, example: "21 234 567" },
  { code: "EE", dial: "+372", name: "Эстония", flag: "🇪🇪", mask: "#### ####", length: 8, example: "5123 4567" },
  
  // Europe
  { code: "PL", dial: "+48", name: "Польша", flag: "🇵🇱", mask: "### ### ###", length: 9, example: "123 456 789" },
  { code: "DE", dial: "+49", name: "Германия", flag: "🇩🇪", mask: "### #######", length: 10, example: "170 1234567" },
  { code: "GB", dial: "+44", name: "Великобритания", flag: "🇬🇧", mask: "#### ######", length: 10, example: "7911 123456" },
  { code: "FR", dial: "+33", name: "Франция", flag: "🇫🇷", mask: "# ## ## ## ##", length: 9, example: "6 12 34 56 78" },
  { code: "IT", dial: "+39", name: "Италия", flag: "🇮🇹", mask: "### ### ####", length: 10, example: "312 345 6789" },
  { code: "ES", dial: "+34", name: "Испания", flag: "🇪🇸", mask: "### ### ###", length: 9, example: "612 345 678" },
  { code: "CZ", dial: "+420", name: "Чехия", flag: "🇨🇿", mask: "### ### ###", length: 9, example: "601 123 456" },
  { code: "AT", dial: "+43", name: "Австрия", flag: "🇦🇹", mask: "### #######", length: 10, example: "664 1234567" },
  { code: "CH", dial: "+41", name: "Швейцария", flag: "🇨🇭", mask: "## ### ## ##", length: 9, example: "79 123 45 67" },
  { code: "NL", dial: "+31", name: "Нидерланды", flag: "🇳🇱", mask: "# ########", length: 9, example: "6 12345678" },
  { code: "BE", dial: "+32", name: "Бельгия", flag: "🇧🇪", mask: "### ## ## ##", length: 9, example: "470 12 34 56" },
  { code: "SE", dial: "+46", name: "Швеция", flag: "🇸🇪", mask: "##-### ## ##", length: 9, example: "70-123 45 67" },
  { code: "NO", dial: "+47", name: "Норвегия", flag: "🇳🇴", mask: "### ## ###", length: 8, example: "912 34 567" },
  { code: "FI", dial: "+358", name: "Финляндия", flag: "🇫🇮", mask: "## ### ####", length: 9, example: "40 123 4567" },
  { code: "DK", dial: "+45", name: "Дания", flag: "🇩🇰", mask: "## ## ## ##", length: 8, example: "20 12 34 56" },
  { code: "PT", dial: "+351", name: "Португалия", flag: "🇵🇹", mask: "### ### ###", length: 9, example: "912 345 678" },
  { code: "GR", dial: "+30", name: "Греция", flag: "🇬🇷", mask: "### ### ####", length: 10, example: "697 123 4567" },
  
  // Middle East
  { code: "TR", dial: "+90", name: "Турция", flag: "🇹🇷", mask: "### ###-##-##", length: 10, example: "532 123-45-67" },
  { code: "AE", dial: "+971", name: "ОАЭ", flag: "🇦🇪", mask: "## ### ####", length: 9, example: "50 123 4567" },
  { code: "IL", dial: "+972", name: "Израиль", flag: "🇮🇱", mask: "##-###-####", length: 9, example: "50-123-4567" },
  { code: "SA", dial: "+966", name: "Саудовская Аравия", flag: "🇸🇦", mask: "## ### ####", length: 9, example: "50 123 4567" },
  
  // Americas
  { code: "US", dial: "+1", name: "США", flag: "🇺🇸", mask: "### ###-####", length: 10, example: "202 555-1234" },
  { code: "CA", dial: "+1", name: "Канада", flag: "🇨🇦", mask: "### ###-####", length: 10, example: "416 555-1234" },
  { code: "BR", dial: "+55", name: "Бразилия", flag: "🇧🇷", mask: "## #####-####", length: 11, example: "11 91234-5678" },
  { code: "MX", dial: "+52", name: "Мексика", flag: "🇲🇽", mask: "## #### ####", length: 10, example: "55 1234 5678" },
  
  // Asia
  { code: "CN", dial: "+86", name: "Китай", flag: "🇨🇳", mask: "### #### ####", length: 11, example: "138 1234 5678" },
  { code: "JP", dial: "+81", name: "Япония", flag: "🇯🇵", mask: "##-####-####", length: 10, example: "90-1234-5678" },
  { code: "KR", dial: "+82", name: "Южная Корея", flag: "🇰🇷", mask: "##-####-####", length: 10, example: "10-1234-5678" },
  { code: "IN", dial: "+91", name: "Индия", flag: "🇮🇳", mask: "##### #####", length: 10, example: "98765 43210" },
  { code: "TH", dial: "+66", name: "Таиланд", flag: "🇹🇭", mask: "## ### ####", length: 9, example: "81 234 5678" },
  
  // Oceania
  { code: "AU", dial: "+61", name: "Австралия", flag: "🇦🇺", mask: "### ### ###", length: 9, example: "412 345 678" },
  { code: "NZ", dial: "+64", name: "Новая Зеландия", flag: "🇳🇿", mask: "## ### ####", length: 9, example: "21 123 4567" },
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
      // Sort by dial length for accurate match
      const sorted = [...countries].sort((a, b) => 
        stripNonDigits(b.dial).length - stripNonDigits(a.dial).length
      )
      for (const country of sorted) {
        const dialDigits = stripNonDigits(country.dial)
        if (digits.startsWith(dialDigits)) {
          setSelectedCountry(country)
          setLocalDigits(digits.slice(dialDigits.length))
          break
        }
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

  const propagate = useCallback((country: Country, digits: string) => {
    onChange(country.dial + digits)
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripNonDigits(e.target.value)
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

  const selectCountry = (c: Country) => {
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

  // Group countries by region
  const groupedCountries = useMemo(() => ({
    "СНГ": countries.slice(0, 11),
    "Балтика": countries.slice(11, 14),
    "Европа": countries.slice(14, 31),
    "Ближний Восток": countries.slice(31, 35),
    "Америка": countries.slice(35, 39),
    "Азия": countries.slice(39, 44),
    "Океания": countries.slice(44),
  }), [])

  return (
    <div className={cn("relative", className)}>
      {/* Main container */}
      <div
        className={cn(
          "relative flex items-stretch rounded-xl overflow-hidden transition-all duration-300",
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
            "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-3 sm:py-3.5",
            "border-r border-border/50 flex-shrink-0",
            "hover:bg-secondary/50 active:bg-secondary/70",
            "transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          {/* Flag */}
          <motion.span 
            key={selectedCountry.code}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg sm:text-xl leading-none"
          >
            {selectedCountry.flag}
          </motion.span>
          
          {/* Dial code */}
          <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
            {selectedCountry.dial}
          </span>
          
          {/* Chevron */}
          <ChevronDown 
            className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
              isOpen && "rotate-180"
            )} 
          />
        </button>

        {/* Phone number input */}
        <div className="relative flex-1 flex items-center min-w-0">
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
              "w-full h-full py-3 sm:py-3.5 px-2.5 sm:px-3",
              "text-sm sm:text-base font-medium tabular-nums",
              "bg-transparent focus:outline-none",
              "text-foreground placeholder:text-muted-foreground/40",
              "transition-colors duration-200"
            )}
          />
          
          {/* Validation status indicator */}
          <div className="pr-2.5 sm:pr-3 flex items-center gap-1.5 flex-shrink-0">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500/10"
                >
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                </motion.div>
              ) : isPartiallyFilled ? (
                <motion.span
                  key="counter"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "text-[10px] sm:text-xs font-medium tabular-nums px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md",
                    "bg-secondary/50 text-muted-foreground whitespace-nowrap"
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
            <div className="max-h-[280px] sm:max-h-[320px] overflow-y-auto overscroll-contain">
              {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                <div key={region}>
                  {/* Region header */}
                  <div className="sticky top-0 px-3 py-1.5 sm:py-2 bg-secondary/80 backdrop-blur-sm border-b border-border/50">
                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                        "flex items-center gap-2.5 sm:gap-3 w-full px-3 py-2 sm:py-2.5",
                        "text-left transition-colors duration-150",
                        "hover:bg-accent/50 active:bg-accent/70",
                        "focus:outline-none focus-visible:bg-accent/50",
                        c.code === selectedCountry.code && c.dial === selectedCountry.dial && 
                          "bg-primary/5 border-l-2 border-primary"
                      )}
                    >
                      {/* Flag */}
                      <span className="text-base sm:text-lg leading-none flex-shrink-0">
                        {c.flag}
                      </span>
                      
                      {/* Country name */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm text-foreground truncate block">
                          {c.name}
                        </span>
                      </div>
                      
                      {/* Dial code */}
                      <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums flex-shrink-0">
                        {c.dial}
                      </span>
                      
                      {/* Selected indicator */}
                      {c.code === selectedCountry.code && c.dial === selectedCountry.dial && (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
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
            className="mt-2 text-xs sm:text-sm text-red-500 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
