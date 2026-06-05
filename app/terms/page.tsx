import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Building2, MapPin, Mail, FileText, Phone, Calendar, Briefcase, Hash } from "lucide-react"

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования и информация о компании ООО НетНекст. УНП 193962237.",
  alternates: {
    canonical: "https://netnext.site/terms",
  },
  openGraph: {
    title: "Условия использования | NetNext",
    description: "Условия использования сайта и реквизиты компании ООО НетНекст.",
    url: "https://netnext.site/terms",
    type: "article",
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: "https://netnext.site" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Условия использования",
      item: "https://netnext.site/terms",
    },
  ],
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Header */}
      <header className="border-b border-border/50 bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">На главную</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
          Условия использования
        </h1>

        {/* Company Info Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">ООО &quot;НетНекст&quot;</h2>
              <p className="text-sm text-muted-foreground">Общество с ограниченной ответственностью &quot;НетНекст&quot;</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">УНП</p>
                <p className="text-sm text-muted-foreground font-mono">193962237</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Торговая марка</p>
                <p className="text-sm text-muted-foreground">РУСБЕЛ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Юридический адрес</p>
                <p className="text-sm text-muted-foreground leading-relaxed">220007, Республика Беларусь, г. Минск, Московский район, ул. Фабрициуса 9, пом. 1 (кабинет 31)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Основной вид деятельности</p>
                <p className="text-sm text-muted-foreground leading-relaxed">Деятельность в области компьютерного программирования (код: 62010)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Регистрация</p>
                <p className="text-sm text-muted-foreground leading-relaxed">МНС: 05.02.2026 (Инспекция МНС по Московскому району г. Минска)</p>
                <p className="text-sm text-muted-foreground leading-relaxed">ЕГР: 03.02.2026 (Минский городской исполнительный комитет)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Телефон</p>
                <a href="tel:+375291414555" className="text-sm text-primary hover:underline">
                  +375 (29) 14-14-555
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <a href="mailto:hello@netnext.site" className="text-sm text-primary hover:underline">
                  hello@netnext.site
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Для команды</p>
                <a href="mailto:team@netnext.site" className="text-sm text-primary hover:underline">
                  team@netnext.site
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-invert prose-sm md:prose-base max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">1. Общие положения</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Настоящие Условия использования (далее — Условия) регулируют отношения между 
              ООО "НетНекст" (далее — Компания) и пользователем сайта netnext.site (далее — Сайт).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Используя Сайт, вы подтверждаете, что ознакомились с настоящими Условиями 
              и принимаете их в полном объеме.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">2. Услуги компании</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Компания предоставляет следующие услуги:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Разработка веб-сайтов и веб-приложений</li>
              <li>Разработка мобильных приложений</li>
              <li>UI/UX дизайн</li>
              <li>Техническая поддержка и сопровождение проектов</li>
              <li>Интеграция с внешними сервисами и API</li>
              <li>Консультации в области веб-разработки</li>
            </ul>
          </section>

          <section className="mb-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <h2 className="text-xl font-semibold mb-4 text-foreground">2.1 AI Генератор сайтов</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Функция &quot;AI Генератор сайтов&quot; на нашем Сайте является демонстрационным инструментом, 
              предназначенным исключительно для показа возможностей веб-разработки.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Важно понимать:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Генерируемые превью сайтов являются демонстрацией наших возможностей</li>
              <li>Превью создаётся на основе анализа публичных данных и лучших практик в указанной нише</li>
              <li>Компания не является разработчиком и владельцем исходных материалов, используемых для демонстрации</li>
              <li>Превью предназначено только для ознакомления и не может быть использовано в коммерческих целях</li>
              <li>Срок действия ссылки на превью — 24 часа</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Используя данную функцию, вы соглашаетесь не использовать полученные материалы 
              для нарушения авторских прав третьих лиц.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Интеллектуальная собственность</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Все материалы, размещенные на Сайте (тексты, графика, логотипы, изображения, 
              программный код), являются интеллектуальной собственностью Компании или ее партнеров.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Использование материалов Сайта без письменного согласия Компании запрещено.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">4. Порядок оказания услуг</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Услуги оказываются на основании договора, заключаемого между Компанией и Заказчиком. 
              Договор определяет объем работ, сроки выполнения и стоимость услуг.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Предоплата составляет от 30% до 50% стоимости проекта</li>
              <li>Окончательный расчет производится после сдачи проекта</li>
              <li>Сроки выполнения согласовываются индивидуально</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">5. Гарантии</h2>
            <p className="text-muted-foreground leading-relaxed">
              Компания гарантирует качество предоставляемых услуг и техническую поддержку 
              в течение гарантийного периода, указанного в договоре. Гарантия распространяется 
              на исправление ошибок и недочетов, выявленных в работе разработанного продукта.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">6. Ограничение ответственности</h2>
            <p className="text-muted-foreground leading-relaxed">
              Компания не несет ответственности за убытки, возникшие в результате использования 
              или невозможности использования Сайта, а также за любой ущерб, причиненный 
              действиями третьих лиц.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">7. Изменение условий</h2>
            <p className="text-muted-foreground leading-relaxed">
              Компания оставляет за собой право изменять настоящие Условия в любое время 
              без предварительного уведомления. Актуальная версия Условий всегда доступна на Сайте.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">8. Контактная информация</h2>
            <p className="text-muted-foreground leading-relaxed">
              По всем вопросам, связанным с использованием Сайта и услугами Компании, 
              вы можете обратиться:
            </p>
            <ul className="list-none mt-4 text-muted-foreground space-y-2">
              <li>Email: <a href="mailto:hello@netnext.site" className="text-primary hover:underline">hello@netnext.site</a></li>
              <li>Email: <a href="mailto:team@netnext.site" className="text-primary hover:underline">team@netnext.site</a></li>
              <li>Адрес: 220007, г. Минск, ул. Фабрициуса 9, пом. 1 (кабинет 31)</li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ООО "НетНекст". Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  )
}
