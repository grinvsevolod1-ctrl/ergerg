import { generatedSiteSchema, type UserInput } from "@/components/site-generator/generator-types"
import { getOllamaClient } from "@/lib/ai/providers"

export async function POST(req: Request) {
  try {
    const input: UserInput & { regenerate?: boolean } = await req.json()

    const prompt = buildPrompt(input)
    const systemPrompt = `Ты — эксперт по созданию контента для сайтов. Генерируй профессиональный, продающий контент на русском языке. 
Контент должен быть:
- Конкретным и релевантным бизнесу клиента
- Без клише и воды
- Убедительным и призывающим к действию
- Грамматически правильным

Для услуг используй только эти иконки: briefcase, code, palette, rocket, shield, chart
Для цветовой схемы используй то, что указал пользователь, или подбери подходящую под нишу.

ВАЖНО: Ответ должен быть ТОЛЬКО валидным JSON объектом без markdown-разметки.`

    const client = getOllamaClient()
    
    const response = await client.chat(
      [{ role: "user", content: prompt }],
      {
        system: systemPrompt,
        temperature: input.regenerate ? 0.9 : 0.7,
        maxTokens: 2000,
      }
    )

    // Парсим JSON из ответа
    let output
    try {
      // Извлекаем JSON из ответа (может быть обёрнут в markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        output = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch {
      console.error("[generate-site] Failed to parse JSON:", response)
      throw new Error("Failed to parse AI response")
    }

    // Валидируем через схему
    const validated = generatedSiteSchema.safeParse(output)
    if (!validated.success) {
      console.error("[generate-site] Validation failed:", validated.error)
      throw new Error("Generated content failed validation")
    }

    return Response.json({ site: validated.data })
  } catch (error) {
    console.error("[generate-site] Error:", error)
    
    // Return fallback content on error
    return Response.json({ 
      site: getFallbackSite(),
      error: "Using fallback content" 
    })
  }
}

function buildPrompt(input: UserInput): string {
  const parts: string[] = []

  parts.push(`Создай контент для сайта со следующими параметрами:`)

  if (input.businessDescription) {
    parts.push(`\nБизнес: ${input.businessDescription}`)
  }

  if (input.style) {
    const styleDescriptions = {
      minimal: "минималистичный, чистый, современный",
      corporate: "корпоративный, профессиональный, надежный",
      vibrant: "яркий, динамичный, энергичный",
      premium: "премиальный, элегантный, роскошный"
    }
    parts.push(`\nСтиль: ${styleDescriptions[input.style]}`)
  }

  if (input.colorScheme) {
    parts.push(`\nЦветовая схема: ${input.colorScheme}`)
  }

  parts.push(`

Требования к контенту:
1. Hero секция: цепляющий заголовок (макс 8 слов), подзаголовок (1-2 предложения), текст CTA кнопки
2. 4 услуги с короткими описаниями (1 предложение каждое)
3. 4 ключевых преимущества с описаниями (1 предложение каждое)
4. Убедительный отзыв клиента (2-3 предложения)
5. Финальный призыв к действию

Сделай контент конкретным для указанного бизнеса, избегай общих фраз.`)

  return parts.join("")
}

function getFallbackSite() {
  return {
    businessName: "Ваш Бизнес",
    tagline: "Профессиональные решения для вашего успеха",
    description: "Мы помогаем бизнесу расти и развиваться, предоставляя качественные услуги и индивидуальный подход.",
    colorScheme: "cyan" as const,
    style: "minimal" as const,
    hero: {
      headline: "Развивайте бизнес вместе с нами",
      subheadline: "Профессиональные услуги, которые помогут вашему делу выйти на новый уровень.",
      ctaText: "Начать сотрудничество"
    },
    services: [
      { title: "Консультации", description: "Экспертная помощь в решении бизнес-задач", icon: "briefcase" as const },
      { title: "Разработка", description: "Создание цифровых продуктов под ключ", icon: "code" as const },
      { title: "Дизайн", description: "Современный визуальный стиль для вашего бренда", icon: "palette" as const },
      { title: "Поддержка", description: "Надежное сопровождение на всех этапах", icon: "shield" as const }
    ],
    features: [
      { title: "10+ лет опыта", description: "Проверенная экспертиза в индустрии" },
      { title: "500+ проектов", description: "Успешно реализованных кейсов" },
      { title: "24/7 поддержка", description: "Всегда на связи с клиентами" },
      { title: "Гарантия качества", description: "Отвечаем за результат работы" }
    ],
    testimonial: {
      quote: "Работа с этой командой превзошла все ожидания. Профессионализм, внимание к деталям и отличный результат.",
      author: "Александр Иванов",
      role: "Генеральный директор"
    },
    cta: {
      headline: "Готовы начать проект?",
      description: "Свяжитесь с нами сегодня, чтобы обсудить вашу идею и получить бесплатную консультацию.",
      buttonText: "Связаться с нами"
    }
  }
}
