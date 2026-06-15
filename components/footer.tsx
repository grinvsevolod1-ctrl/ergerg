"use client"

import Link from "next/link"
import { Mail, MapPin, ExternalLink, Phone } from "lucide-react"
import { TelegramIcon, WhatsAppIcon, ViberIcon, InstagramIcon, LinkedInIcon } from "@/components/icons"

const footerLinks = {
  company: [
    { label: "О нас", href: "#team" },
    { label: "Услуги", href: "#services" },
    { label: "Проекты", href: "#portfolio" },
    { label: "Команда", href: "#team" },
  ],
  legal: [
    { label: "Политика конфиденциальности", href: "/privacy" },
    { label: "Условия использования", href: "/terms" },
  ],
  social: [
    { label: "Telegram", href: "https://t.me/netnext_team", icon: TelegramIcon, color: "#0088cc" },
    { label: "WhatsApp", href: "https://wa.me/375291414555", icon: WhatsAppIcon, color: "#25D366" },
    { label: "Viber", href: "viber://chat?number=%2B375291414555", icon: ViberIcon, color: "#7360F2" },
    { label: "Instagram", href: "https://instagram.com/netnext.site", icon: InstagramIcon, color: "#E4405F" },
    { label: "LinkedIn", href: "https://linkedin.com/company/netnext", icon: LinkedInIcon, color: "#0A66C2" },
  ],
}

const contactInfo = [
  { icon: Phone, value: "+375 (29) 14-14-555", href: "tel:+375291414555" },
  { icon: Mail, value: "hello@netnext.site", href: "mailto:hello@netnext.site" },
  { icon: MapPin, value: "Минск, ул. Фабрициуса 9", href: "https://maps.google.com/?q=220007+Минск+ул.+Фабрициуса+9" },
]

// Logo Component - matches sidebar logo
function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Mark */}
      <div className="relative w-10 h-10 flex-shrink-0">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-20 blur-md" />
        
        {/* Main logo container */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-primary/30 flex items-center justify-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
          
          {/* Letter N with gradient */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative z-10">
            <defs>
              <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <path
              d="M6 18V6h2l8 9V6h2v12h-2l-8-9v9H6z"
              fill="url(#footerLogoGradient)"
            />
          </svg>
          
          {/* Corner accent */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-tl-lg opacity-60" />
        </div>
      </div>
      
      {/* Logo Text */}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground tracking-tight">
          NetNext
        </span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
          Studio
        </span>
      </div>
    </div>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card/50 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20">
        {/* Main Footer */}
        <div className="py-14 md:py-16 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-5 text-[15px] text-muted-foreground leading-relaxed max-w-xs">
              Создаём современные цифровые продукты, которые помогают бизнесу расти и развиваться.
            </p>
            
            {/* Contact Info */}
            <div className="mt-7 space-y-3.5">
              {contactInfo.map((item) => (
                <a
                  key={item.value}
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.value}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-5 tracking-tight">Компания</h4>
            <ul className="space-y-3.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[15px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-5 tracking-tight">Документы</h4>
            <ul className="space-y-3.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-5 tracking-tight">Социальные сети</h4>
            <ul className="space-y-3.5">
              {footerLinks.social.map((link) => {
                const SocialIcon = (link as { icon?: React.FC<{ className?: string }> }).icon
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-[15px] text-muted-foreground hover:text-primary transition-colors group"
                    >
                      {SocialIcon && <SocialIcon className="w-4 h-4" />}
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Legal Info */}
        <div className="py-6 pb-24 md:pb-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} ООО "НетНекст". Все права защищены.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-2.5 md:gap-4">
            <p className="text-xs text-muted-foreground/60">
              УНП 193962237 | г. Минск, ул. Фабрициуса 9, пом. 1
            </p>
            <span className="hidden md:inline text-xs text-muted-foreground/30">|</span>
            <a href="tel:+375291414555" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              +375 (29) 14-14-555
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
