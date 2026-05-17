"use client"

import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

function DataDeletionForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    try {
      const response = await fetch("/api/leads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus("success")
        setMessage(data.message)
        setEmail("")
      } else {
        setStatus("error")
        setMessage(data.error || "Произошла ошибка")
      }
    } catch {
      setStatus("error")
      setMessage("Ошибка соединения. Попробуйте позже.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-400">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Введите email для удаления данных"
        className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        required
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Отправка...
          </>
        ) : (
          "Удалить мои данные"
        )}
      </button>
      {status === "error" && (
        <div className="sm:col-span-2 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}
    </form>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
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
          Политика конфиденциальности
        </h1>

        <div className="prose prose-invert prose-sm md:prose-base max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-6">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">1. Общие положения</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
              ООО "НетНекст" (далее — Компания) информации о физических лицах (далее — Пользователи), 
              которая может быть получена при использовании сайта netnext.site.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Использование сайта означает безоговорочное согласие Пользователя с настоящей 
              Политикой и указанными в ней условиями обработки его персональных данных.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">2. Собираемые данные</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Мы можем собирать следующую информацию:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Имя и контактная информация, включая адрес электронной почты</li>
              <li>Номер телефона</li>
              <li>Информация о компании и должности</li>
              <li>Демографическая информация</li>
              <li>Техническая информация (IP-адрес, тип браузера, операционная система)</li>
              <li>Информация о посещении сайта и поведении на нем</li>
            </ul>
          </section>

          <section className="mb-8 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <h2 className="text-xl font-semibold mb-4 text-foreground">2.1 Данные генератора сайтов</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              При использовании функции &quot;AI Генератор сайтов&quot; мы собираем:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Название вашей компании или бренда</li>
              <li>Контактный телефон</li>
              <li>Адрес электронной почты</li>
              <li>Описание деятельности (если указано)</li>
              <li>Выбранная ниша/сфера деятельности</li>
              <li>Информация о просмотренных вариантах</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Эти данные используются для:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Демонстрации возможностей разработки сайтов</li>
              <li>Персонализации генерируемого превью</li>
              <li>Связи с вами по вашему запросу</li>
              <li>Подготовки коммерческого предложения</li>
              <li>Улучшения качества сервиса</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Использование данных</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Собранная информация используется для:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Обработки заявок и обратной связи</li>
              <li>Улучшения качества обслуживания</li>
              <li>Персонализации пользовательского опыта</li>
              <li>Отправки информационных и рекламных материалов (с согласия пользователя)</li>
              <li>Анализа и улучшения работы сайта</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">4. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Сайт использует файлы cookies для улучшения пользовательского опыта. 
              Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Вы можете настроить свой браузер на отклонение всех или некоторых файлов cookies 
              или на уведомление о их отправке. Однако некоторые функции сайта могут работать некорректно.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">5. Защита данных</h2>
            <p className="text-muted-foreground leading-relaxed">
              Мы принимаем все необходимые организационные и технические меры для защиты 
              персональных данных от неправомерного или случайного доступа, уничтожения, 
              изменения, блокирования, копирования, распространения, а также от иных 
              неправомерных действий третьих лиц.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">6. Права пользователей</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Вы имеете право:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Запросить информацию о хранимых данных</li>
              <li>Потребовать исправления неточных данных</li>
              <li>Потребовать удаления ваших данных</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
          </section>

          <section className="mb-8 p-6 rounded-xl bg-destructive/5 border border-destructive/20">
            <h2 className="text-xl font-semibold mb-4 text-foreground">6.1 Удаление данных</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Вы можете запросить полное удаление ваших персональных данных из нашей базы. 
              Для этого отправьте запрос на email{" "}
              <a href="mailto:hello@netnext.site" className="text-primary hover:underline">
                hello@netnext.site
              </a>{" "}
              с темой &quot;Удаление данных&quot; или воспользуйтесь формой ниже.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ваш запрос будет обработан в течение 30 дней согласно законодательству 
              о защите персональных данных.
            </p>
            <DataDeletionForm />
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">7. Контакты</h2>
            <p className="text-muted-foreground leading-relaxed">
              По вопросам, связанным с обработкой персональных данных, вы можете обратиться:
            </p>
            <ul className="list-none mt-4 text-muted-foreground space-y-2">
              <li>Email: <a href="mailto:hello@netnext.site" className="text-primary hover:underline">hello@netnext.site</a></li>
              <li>Email: <a href="mailto:team@netnext.site" className="text-primary hover:underline">team@netnext.site</a></li>
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
