"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-4">Помощь</h1>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Как установить виджет?</h2>
            <p className="text-muted-foreground">
              Скопируйте код из онбординга и вставьте его перед закрывающим тегом {'</body>'} на вашем сайте.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Не работает виджет?</h2>
            <p className="text-muted-foreground">
              Убедитесь, что вы добавили код на все страницы сайта. Проверьте консоль браузера на наличие ошибок.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Как изменить настройки?</h2>
            <p className="text-muted-foreground">
              Войдите в дашборд и перейдите в раздел "Настройки". Там вы можете изменить внешний вид и поведение чата.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Нужна помощь?</h2>
            <p className="text-muted-foreground">
              Свяжитесь с нами по email: <a href="mailto:support@nexik.org" className="text-primary">support@nexik.org</a>
            </p>
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <Link href="/nexik/dashboard">
            <Button>В дашборд</Button>
          </Link>
          <Link href="/nexik">
            <Button variant="outline">На главную Nexik</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
