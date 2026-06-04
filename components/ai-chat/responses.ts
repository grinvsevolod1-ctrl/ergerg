import type { ResponseData, KeywordRule } from "./types"

// --- Scripted Responses Database ---
export const responses: Record<string, ResponseData> = {
  // -- Welcome --
  default: {
    text: "Привет! Я Nexik — AI-ассистент NetNext.\n\nМогу помочь с информацией об услугах, портфолио, стоимости и сроках. О чём хотите узнать?",
    buttons: [
      { label: "Какие услуги?", action: "services" },
      { label: "Сколько стоит?", action: "estimate" },
      { label: "Покажите работы", action: "portfolio" },
    ],
  },

  // -- Services --
  services: {
    text: "Мы создаём цифровые продукты под ключ:\n\n**Веб-разработка** — лендинги, корпоративные сайты, интернет-магазины, SaaS-платформы\n**Мобильные приложения** — iOS и Android на React Native\n**UI/UX дизайн** — прототипирование, дизайн-системы, Figma\n**Backend-разработка** — API, базы данных, интеграции\n**DevOps** — настройка CI/CD, облачная инфраструктура\n\nЧто из этого вас интересует подробнее?",
    buttons: [
      { label: "Веб-разработка", action: "service_web" },
      { label: "Мобильные приложения", action: "service_mobile" },
      { label: "UI/UX дизайн", action: "service_design" },
      { label: "Узнать стоимость", action: "estimate" },
    ],
    navigate: "services",
  },
  service_web: {
    text: "**Веб-разработка** — наша основная специализация.\n\nМы работаем с:\n- **Next.js / React** — для быстрых и SEO-оптимизированных сайтов\n- **Vue / Nuxt** — когда проект требует лёгкости\n- **TypeScript** — везде, без исключений\n\nОт простого лендинга до сложной SaaS-платформы с личным кабинетом, платежами и аналитикой.\n\nВсегда отдаём чистый, задокументированный код.",
    buttons: [
      { label: "Сколько стоит сайт?", action: "price_website" },
      { label: "Какие сроки?", action: "time_web" },
      { label: "Примеры работ", action: "portfolio" },
    ],
  },
  service_mobile: {
    text: "**Мобильная разработка** на React Native и Flutter.\n\nОдна кодовая база — приложение для iOS и Android.\n\n- Нативная производительность\n- Push-уведомления, геолокация, камера\n- Интеграция с backend и API\n- Публикация в App Store и Google Play\n\nОт MVP до полноценного продукта.",
    buttons: [
      { label: "Стоимость приложения", action: "price_app" },
      { label: "Сроки разработки", action: "time_mobile" },
      { label: "Вернуться к услугам", action: "services" },
    ],
  },
  service_design: {
    text: "**UI/UX дизайн** — фундамент каждого проекта.\n\n- Исследование целевой аудитории\n- Wireframe и прототипирование\n- Дизайн-система и UI Kit\n- Интерактивные прототипы в Figma\n- Анимации и микроинтеракции\n\nДизайн не просто красивый — он конвертирует.",
    buttons: [
      { label: "Стоимость дизайна", action: "price_design" },
      { label: "Посмотреть работы", action: "portfolio" },
      { label: "Заказать дизайн", action: "contact" },
    ],
  },

  // -- Pricing --
  estimate: {
    text: "Стоимость зависит от сложности проекта:\n\n**Лендинг** — от 2 500 Br\n**Корпоративный сайт** — от 6 500 Br\n**Интернет-магазин** — от 13 000 Br\n**Мобильное приложение** — от 19 500 Br\n**SaaS-платформа** — индивидуально\n**UI/UX дизайн** — от 1 600 Br\n\nХотите точную оценку? Расскажите о проекте, и я помогу сориентироваться.",
    buttons: [
      { label: "Лендинг подробнее", action: "price_landing" },
      { label: "Сайт подробнее", action: "price_website" },
      { label: "Магазин подробнее", action: "price_shop" },
      { label: "Обсудить проект", action: "start_project" },
    ],
  },
  price_landing: {
    text: "**Лендинг — от 2 500 Br**\n\nЧто входит:\n- Дизайн в Figma (2 варианта)\n- Адаптивная вёрстка (мобильные, планшеты, ПК)\n- Анимации и интерактив\n- SEO-оптимизация\n- Форма обратной связи\n- Подключение аналитики\n\nСроки: 1-2 недели\n\nДополнительно: CMS-панель, многоязычность, A/B тестирование.",
    buttons: [
      { label: "Заказать лендинг", action: "start_project" },
      { label: "Другие цены", action: "estimate" },
    ],
  },
  price_website: {
    text: "**Корпоративный сайт — от 6 500 Br**\n\nЧто входит:\n- 5-15 страниц с уникальным дизайном\n- CMS для управления контентом\n- Блог и новостной раздел\n- Интеграция с CRM\n- SEO и Core Web Vitals оптимизация\n- SSL и безопасность\n\nСроки: 3-5 недель",
    buttons: [
      { label: "Заказать сайт", action: "start_project" },
      { label: "Другие цены", action: "estimate" },
    ],
  },
  price_shop: {
    text: "**Интернет-магазин — от 13 000 Br**\n\nЧто входит:\n- Каталог товаров с фильтрами\n- Корзина и оформление заказа\n- Платёжные системы (ЕРИП, Bepaid и др.)\n- Личный кабинет покупателя\n- Админ-панель управления\n- Интеграция с доставкой\n\nСроки: 6-10 недель",
    buttons: [
      { label: "Заказать магазин", action: "start_project" },
      { label: "Другие цены", action: "estimate" },
    ],
  },
  price_app: {
    text: "**Мобильное приложение — от 19 500 Br**\n\nЧто входит:\n- iOS + Android из одной кодовой базы\n- UI/UX дизайн\n- Backend и API\n- Push-уведомления\n- Публикация в сторах\n- 1 месяц поддержки\n\nСроки: от 2 месяцев",
    buttons: [
      { label: "Обсудить приложение", action: "start_project" },
      { label: "Другие цены", action: "estimate" },
    ],
  },
  price_design: {
    text: "**UI/UX дизайн — от 1 600 Br**\n\n- Прототип и wireframes — от 1 000 Br\n- Дизайн лендинга — от 1 600 Br\n- Дизайн сайта (5+ стр.) — от 4 000 Br\n- Дизайн-система / UI Kit — от 6 500 Br\n- Редизайн — от 2 600 Br\n\nВсё в Figma с готовыми компонентами для разработки.",
    buttons: [
      { label: "Заказать дизайн", action: "start_project" },
      { label: "Примеры работ", action: "portfolio" },
    ],
  },


  // -- Timing --
  time: {
    text: "Ориентировочные сроки:\n\n**Лендинг** — 1-2 недели\n**Корпоративный сайт** — 3-5 недель\n**Интернет-магазин** — 6-10 недель\n**Мобильное приложение** — от 2 месяцев\n**SaaS-платформа** — от 3 месяцев\n\nСроки зависят от сложности и ваших требований. Всегда фиксируем дедлайн в договоре.",
    buttons: [
      { label: "Узнать стоимость", action: "estimate" },
      { label: "Начать проект", action: "start_project" },
    ],
  },
  time_web: {
    text: "**Сроки веб-разработки:**\n\nЛендинг — 1-2 недели\nКорпоративный сайт — 3-5 недель\nИнтернет-магазин — 6-10 недель\nВеб-приложение — от 2 месяцев\n\nПосле оценки проекта фиксируем точный дедлайн в договоре. Работаем по Agile — каждую неделю вы видите прогресс.",
    buttons: [
      { label: "Узнать стоимость", action: "estimate" },
      { label: "Обсудить проект", action: "start_project" },
    ],
  },
  time_mobile: {
    text: "**Сроки мобильной разработки:**\n\nMVP-приложение — 2-3 месяца\nСреднее приложение — 3-5 месяцев\nСложное приложение — от 6 месяцев\n\nПервую версию для тестирования можно получить уже через 3-4 недели.",
    buttons: [
      { label: "Узнать стоимость", action: "price_app" },
      { label: "Начать проект", action: "start_project" },
    ],
  },

  // -- Portfolio --
  portfolio: {
    text: "У нас более 50 успешных проектов — от стартапов до enterprise.\n\nНаши работы включают:\n- E-commerce платформы\n- SaaS-приложения\n- Корпоративные сайты\n- Мобильные приложения\n- Дизайн-системы\n\nПрокрутите до секции портфолио, чтобы увидеть примеры.",
    buttons: [
      { label: "Узнать стоимость", action: "estimate" },
      { label: "Начать проект", action: "start_project" },
    ],
    navigate: "portfolio",
  },

  // -- Contact --
  contact: {
    text: "Связаться с нами:\n\n**Телефон:** +375 (29) 14-14-555\n**Email:** hello@netnext.site\n**Telegram:** @netnextadminbot\n**WhatsApp:** +375 (29) 14-14-555\n**Viber:** +375 (29) 14-14-555\n\nИли заполните форму заявки на сайте — ответим в течение 15 минут в рабочее время.",
    buttons: [
      { label: "Заполнить заявку", action: "start_project" },
      { label: "Вернуться в начало", action: "default" },
    ],
    navigate: "contact",
  },

  // -- Start project flow --
  start_project: {
    text: "Отлично! Чтобы мы могли подготовить оценку, расскажите в свободной форме:\n\n1. Что за проект? (сайт, приложение, магазин...)\n2. Какой функционал нужен?\n3. Есть ли примеры сайтов, которые нравятся?\n4. Желаемые сроки и бюджет?\n\nМожете написать прямо здесь — я передам вашу заявку команде.",
    buttons: [
      { label: "Позвать оператора", action: "request_operator" },
    ],
    navigate: "contact",
  },

  // -- Operator --
  request_operator: {
    text: "Подключаю живого оператора. Обычно отвечаем в течение нескольких минут.\n\nПока ждёте, можете описать свой вопрос — оператор увидит всю переписку.",
  },

  // -- Tech stack --
  tech: {
    text: "Наш стек технологий:\n\n**Frontend:** React, Next.js, Vue, Nuxt, TypeScript, Tailwind CSS\n**Backend:** Node.js, Python, Go, PostgreSQL, MongoDB, Redis\n**Mobile:** React Native, Flutter\n**Cloud:** AWS, Vercel, DigitalOcean, Hetzner\n**DevOps:** Docker, CI/CD, GitHub Actions\n**AI/ML:** OpenAI, LangChain, Python ML\n\nВсегда выбираем стек под задачу, а не наоборот.",
    buttons: [
      { label: "Какие услуги?", action: "services" },
      { label: "Начать проект", action: "start_project" },
    ],
  },

  // -- Process --
  process: {
    text: "Как мы работаем:\n\n**1. Брифинг** — выясняем цели и требования\n**2. Оценка** — готовим план и стоимость\n**3. Дизайн** — прототипы, UI/UX, утверждение\n**4. Разработка** — поэтапно, с еженедельными демо\n**5. Тестирование** — QA, нагрузочное, кроссбраузерное\n**6. Запуск** — деплой, мониторинг, обучение\n**7. Поддержка** — техподдержка и развитие\n\nНа каждом этапе вы в курсе прогресса.",
    buttons: [
      { label: "Узнать стоимость", action: "estimate" },
      { label: "Начать проект", action: "start_project" },
    ],
    navigate: "process",
  },

  // -- Team --
  team: {
    text: "Наша команда — 12 специалистов:\n\n- 4 fullstack-разработчика\n- 2 мобильных разработчика\n- 2 UI/UX дизайнера\n- 1 DevOps-инженер\n- 1 QA-инженер\n- 1 проект-менеджер\n- 1 бизнес-аналитик\n\n5+ лет опыта в коммерческой разработке. Работаем как единая команда.",
    buttons: [
      { label: "Как мы работаем?", action: "process" },
      { label: "Начать проект", action: "start_project" },
    ],
    navigate: "team",
  },

  // -- Guarantees --
  guarantee: {
    text: "Наши гарантии:\n\n- Фиксированная стоимость в договоре\n- Фиксированные сроки с ответственностью\n- Исходный код — ваша собственность\n- 3 месяца бесплатной поддержки после запуска\n- Бесплатное исправление багов\n- NDA по запросу\n\nРаботаем официально, по договору.",
    buttons: [
      { label: "Начать проект", action: "start_project" },
      { label: "Контакты", action: "contact" },
    ],
  },

  // -- Support --
  support: {
    text: "После запуска проекта мы не исчезаем:\n\n- 3 месяца бесплатной поддержки\n- SLA — время реакции от 1 часа\n- Мониторинг доступности 24/7\n- Регулярные бэкапы\n- Обновления безопасности\n\nТакже предлагаем пакеты техподдержки на постоянной основе.",
    buttons: [
      { label: "Гарантии", action: "guarantee" },
      { label: "Связаться", action: "contact" },
    ],
  },

  // -- SEO --
  seo: {
    text: "SEO-оптимизация входит в каждый проект:\n\n- Семантическая HTML-разметка\n- Core Web Vitals оптимизация\n- Мета-теги и Open Graph\n- Структурированные данные (Schema.org)\n- Sitemap и robots.txt\n- Оптимизация изображений\n- SSR/SSG для максимальной скорости\n\nНаши сайты получают 90+ баллов в Lighthouse.",
    buttons: [
      { label: "Технологии", action: "tech" },
      { label: "Заказать сайт", action: "start_project" },
    ],
  },

  // -- Fallback / small talk --
  greeting: {
    text: "Привет! Рад видеть вас. Чем могу помочь?",
    buttons: [
      { label: "Услуги", action: "services" },
      { label: "Цены", action: "estimate" },
      { label: "Портфолио", action: "portfolio" },
    ],
  },
  thanks: {
    text: "Пожалуйста! Если появятся ещё вопросы — я всегда здесь. Удачи с проектом!",
    buttons: [
      { label: "Ещё вопрос", action: "default" },
      { label: "Связаться с командой", action: "contact" },
    ],
  },
  bye: {
    text: "До свидания! Будем рады помочь, когда понадобимся. Хорошего дня!",
  },
  unknown: {
    text: "Хм, не совсем понял вопрос. Попробуйте переформулировать или выберите тему:\n\n- Услуги и возможности\n- Стоимость и сроки\n- Портфолио\n- Технологии\n\nИли я могу подключить живого оператора.",
    buttons: [
      { label: "Услуги", action: "services" },
      { label: "Цены", action: "estimate" },
      { label: "Позвать оператора", action: "request_operator" },
    ],
  },
}

// --- Keyword Rules ---
export const keywordRules: KeywordRule[] = [
  { keywords: ["услуг", "делаете", "можете", "умеете", "предлагаете"], response: "services" },
  { keywords: ["портфолио", "работ", "пример", "кейс", "показ"], response: "portfolio" },
  { keywords: ["контакт", "связ", "написать", "email", "почт"], response: "contact" },
  { keywords: ["цен", "стоим", "сколько", "бюджет", "прайс", "тариф"], response: "estimate" },
  { keywords: ["технолог", "стек", "фреймворк", "язык программ"], response: "tech" },
  { keywords: ["срок", "долго", "время", "быстро", "когда"], response: "time" },
  { keywords: ["процесс", "этап", "как работа", "как вы работ"], response: "process" },
  { keywords: ["команд", "специалист", "сотрудник", "кто вы"], response: "team" },
  { keywords: ["гарант", "договор", "безопасн", "надёжн"], response: "guarantee" },
  { keywords: ["поддерж", "после запуск", "сопровожд", "обслужив"], response: "support" },
  { keywords: ["seo", "оптимиз", "поисков", "google", "яндекс"], response: "seo" },
  { keywords: ["лендинг", "landing", "одностраничн"], response: "price_landing" },
  { keywords: ["магазин", "ecommerce", "e-commerce", "товар", "каталог"], response: "price_shop" },
  { keywords: ["приложен", "мобильн", "ios", "android", "app"], response: "service_mobile" },
  { keywords: ["дизайн", "figma", "ui", "ux", "макет", "прототип"], response: "service_design" },
  { keywords: ["веб-разраб", "сайт", "фронтенд", "frontend", "react", "next"], response: "service_web" },
  { keywords: ["оператор", "человек", "менеджер", "живой"], response: "request_operator" },
  { keywords: ["начать", "заказ", "хочу", "нужен проект", "давайте"], response: "start_project" },
  { keywords: ["привет", "здравствуй", "добрый", "хай", "hello", "hi"], response: "greeting" },
  { keywords: ["спасибо", "благодар", "thanks"], response: "thanks" },
  { keywords: ["пока", "до свидан", "прощ", "bye"], response: "bye" },
]

// --- Keyword matcher ---
export function matchResponse(input: string): string {
  const lower = input.toLowerCase().trim()
  for (const rule of keywordRules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.response
    }
  }
  return "unknown"
}
