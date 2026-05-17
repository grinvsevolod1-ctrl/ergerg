"use client"

import type { ColorScheme } from "../generator-types"

interface PreviewFooterProps {
  businessName: string
  colorScheme: ColorScheme
}

export function PreviewFooter({ businessName, colorScheme }: PreviewFooterProps) {
  const year = new Date().getFullYear()
  
  return (
    <footer 
      className="px-6 py-12 border-t border-white/10"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
                style={{ background: "var(--preview-primary)" }}
              >
                {businessName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-white">{businessName}</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">
              Профессиональные решения для вашего бизнеса. Работаем с 2020 года.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Навигация</h4>
            <ul className="space-y-2">
              {["Главная", "Услуги", "О нас", "Контакты"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Контакты</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li>+7 (XXX) XXX-XX-XX</li>
              <li>info@example.com</li>
              <li>г. Москва</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {year} {businessName}. Все права защищены.
          </p>
          <p className="text-xs text-white/40">
            Создано с помощью{" "}
            <span style={{ color: "var(--preview-primary)" }}>NetNext AI</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
