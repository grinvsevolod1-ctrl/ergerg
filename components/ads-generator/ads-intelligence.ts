// ══════════════════════════════════════════════════════════════════════════════
// ADS INTELLIGENCE - реалистичные данные по нишам для демонстрации
// ══════════════════════════════════════════════════════════════════════════════

import {
  Car,
  Home,
  Utensils,
  Dumbbell,
  Briefcase,
  Stethoscope,
  GraduationCap,
  ShoppingBag,
  Plane,
  Wrench,
  Scissors,
  Camera,
  Building2,
  Truck,
  Heart,
  Baby,
  Dog,
  Flower2,
  Palette,
  Music,
  Gamepad2,
  Laptop,
  Phone,
  type LucideIcon
} from "lucide-react"

export interface AdsNiche {
  id: string
  name: string
  category: string
  icon: LucideIcon
  accentColor: string
  // Яндекс Директ данные
  yandex: {
    avgCpc: number // средняя цена клика в рублях
    ctr: number // CTR в %
    conversionRate: number // конверсия в %
    avgBudget: number // средний месячный бюджет
    impressions: number // показы в месяц
    clicks: number // клики в месяц
    leads: number // лиды в месяц
    cpl: number // цена лида
  }
  // Google Ads данные
  google: {
    avgCpc: number
    ctr: number
    conversionRate: number
    avgBudget: number
    impressions: number
    clicks: number
    leads: number
    cpl: number
  }
  // Общие метрики
  roi: number // ROI в %
  seasonality: number[] // 12 месяцев, коэффициент от 0.5 до 1.5
  competition: "low" | "medium" | "high" | "very_high"
  recommendations: string[]
  keywords: string[] // для матчинга
}

export const ADS_NICHES: Record<string, AdsNiche> = {
  auto: {
    id: "auto",
    name: "Автосервис",
    category: "Авто",
    icon: Car,
    accentColor: "#3B82F6",
    yandex: {
      avgCpc: 45,
      ctr: 4.2,
      conversionRate: 3.8,
      avgBudget: 85000,
      impressions: 156000,
      clicks: 6552,
      leads: 249,
      cpl: 341
    },
    google: {
      avgCpc: 52,
      ctr: 3.8,
      conversionRate: 3.2,
      avgBudget: 65000,
      impressions: 98000,
      clicks: 3724,
      leads: 119,
      cpl: 546
    },
    roi: 340,
    seasonality: [0.8, 0.85, 1.0, 1.1, 1.15, 1.1, 1.05, 1.0, 1.1, 1.2, 1.1, 0.9],
    competition: "high",
    recommendations: [
      "Сфокусируйтесь на конкретных услугах: ТО, ремонт АКПП, диагностика",
      "Добавьте геотаргетинг в радиусе 10-15 км",
      "Используйте ретаргетинг для возврата клиентов"
    ],
    keywords: ["автосервис", "сто", "ремонт авто", "автомастер", "шиномонтаж", "техобслуживание", "автомобил"]
  },
  
  realestate: {
    id: "realestate",
    name: "Недвижимость",
    category: "Недвижимость",
    icon: Home,
    accentColor: "#10B981",
    yandex: {
      avgCpc: 125,
      ctr: 2.8,
      conversionRate: 1.2,
      avgBudget: 250000,
      impressions: 420000,
      clicks: 11760,
      leads: 141,
      cpl: 1773
    },
    google: {
      avgCpc: 145,
      ctr: 2.4,
      conversionRate: 0.9,
      avgBudget: 180000,
      impressions: 280000,
      clicks: 6720,
      leads: 60,
      cpl: 3000
    },
    roi: 580,
    seasonality: [0.7, 0.75, 0.9, 1.1, 1.2, 1.15, 1.1, 1.2, 1.3, 1.1, 0.9, 0.7],
    competition: "very_high",
    recommendations: [
      "Разделите кампании по типам: новостройки, вторичка, аренда",
      "Высокая конкуренция — работайте над качеством посадочных страниц",
      "Используйте look-alike аудитории для расширения охвата"
    ],
    keywords: ["недвижимость", "квартир", "дом", "жильё", "новостройк", "ипотек", "риэлтор", "агентство недвижимости"]
  },
  
  restaurant: {
    id: "restaurant",
    name: "Ресторан / Кафе",
    category: "HoReCa",
    icon: Utensils,
    accentColor: "#F59E0B",
    yandex: {
      avgCpc: 28,
      ctr: 5.1,
      conversionRate: 4.5,
      avgBudget: 45000,
      impressions: 89000,
      clicks: 4539,
      leads: 204,
      cpl: 220
    },
    google: {
      avgCpc: 32,
      ctr: 4.8,
      conversionRate: 4.0,
      avgBudget: 35000,
      impressions: 65000,
      clicks: 3120,
      leads: 125,
      cpl: 280
    },
    roi: 420,
    seasonality: [0.8, 0.9, 1.0, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1, 1.0, 1.1, 1.3],
    competition: "medium",
    recommendations: [
      "Настройте рекламу на время обеда и ужина",
      "Продвигайте акции и бизнес-ланчи",
      "Добавьте фото блюд в объявления"
    ],
    keywords: ["ресторан", "кафе", "еда", "доставк", "кухня", "банкет", "кейтеринг", "пицц", "суши", "бар"]
  },
  
  fitness: {
    id: "fitness",
    name: "Фитнес-клуб",
    category: "Спорт",
    icon: Dumbbell,
    accentColor: "#EF4444",
    yandex: {
      avgCpc: 38,
      ctr: 4.5,
      conversionRate: 2.8,
      avgBudget: 75000,
      impressions: 145000,
      clicks: 6525,
      leads: 183,
      cpl: 410
    },
    google: {
      avgCpc: 42,
      ctr: 4.0,
      conversionRate: 2.4,
      avgBudget: 55000,
      impressions: 95000,
      clicks: 3800,
      leads: 91,
      cpl: 604
    },
    roi: 290,
    seasonality: [1.4, 1.3, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 1.1, 1.0, 0.9, 0.8],
    competition: "high",
    recommendations: [
      "Январь-февраль — пик сезона, увеличьте бюджет на 30-40%",
      "Продвигайте пробные занятия и первый месяц со скидкой",
      "Таргетируйтесь на районы с высоким доходом"
    ],
    keywords: ["фитнес", "спортзал", "тренажер", "йога", "бассейн", "тренер", "похудение", "спорт"]
  },
  
  legal: {
    id: "legal",
    name: "Юридические услуги",
    category: "B2B Услуги",
    icon: Briefcase,
    accentColor: "#6366F1",
    yandex: {
      avgCpc: 95,
      ctr: 3.2,
      conversionRate: 2.1,
      avgBudget: 120000,
      impressions: 78000,
      clicks: 2496,
      leads: 52,
      cpl: 2308
    },
    google: {
      avgCpc: 110,
      ctr: 2.8,
      conversionRate: 1.8,
      avgBudget: 90000,
      impressions: 52000,
      clicks: 1456,
      leads: 26,
      cpl: 3462
    },
    roi: 680,
    seasonality: [1.0, 1.0, 1.1, 1.15, 1.1, 1.0, 0.9, 0.85, 1.0, 1.1, 1.1, 1.0],
    competition: "very_high",
    recommendations: [
      "Разделите кампании по специализациям: банкротство, ДТП, семейное право",
      "Высокий чек оправдывает дорогие клики",
      "Используйте колл-трекинг для отслеживания звонков"
    ],
    keywords: ["юрист", "адвокат", "юридическ", "право", "суд", "консультац", "банкротств", "наследств"]
  },
  
  medical: {
    id: "medical",
    name: "Медицинская клиника",
    category: "Медицина",
    icon: Stethoscope,
    accentColor: "#06B6D4",
    yandex: {
      avgCpc: 85,
      ctr: 3.5,
      conversionRate: 2.5,
      avgBudget: 180000,
      impressions: 210000,
      clicks: 7350,
      leads: 184,
      cpl: 978
    },
    google: {
      avgCpc: 98,
      ctr: 3.0,
      conversionRate: 2.0,
      avgBudget: 140000,
      impressions: 145000,
      clicks: 4350,
      leads: 87,
      cpl: 1609
    },
    roi: 450,
    seasonality: [1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.8, 1.0, 1.1, 1.15, 1.1],
    competition: "very_high",
    recommendations: [
      "Требуется модерация — соблюдайте правила рекламы медуслуг",
      "Продвигайте отдельные услуги, а не клинику целиком",
      "Собирайте отзывы и рейтинги для повышения доверия"
    ],
    keywords: ["клиник", "врач", "медицин", "стоматолог", "анализ", "узи", "лечени", "здоров"]
  },
  
  education: {
    id: "education",
    name: "Образовательные курсы",
    category: "Образование",
    icon: GraduationCap,
    accentColor: "#8B5CF6",
    yandex: {
      avgCpc: 55,
      ctr: 3.8,
      conversionRate: 2.2,
      avgBudget: 95000,
      impressions: 125000,
      clicks: 4750,
      leads: 105,
      cpl: 905
    },
    google: {
      avgCpc: 62,
      ctr: 3.4,
      conversionRate: 1.9,
      avgBudget: 75000,
      impressions: 88000,
      clicks: 2992,
      leads: 57,
      cpl: 1316
    },
    roi: 520,
    seasonality: [1.2, 1.1, 1.0, 0.9, 0.85, 0.7, 0.6, 0.8, 1.3, 1.2, 1.1, 0.9],
    competition: "high",
    recommendations: [
      "Август-сентябрь — пик спроса, готовьте кампании заранее",
      "Продвигайте бесплатные вебинары как лид-магниты",
      "Используйте видеорекламу для повышения вовлечённости"
    ],
    keywords: ["курс", "обучени", "школа", "репетитор", "подготовк", "экзамен", "онлайн-курс", "тренинг"]
  },
  
  ecommerce: {
    id: "ecommerce",
    name: "Интернет-магазин",
    category: "E-commerce",
    icon: ShoppingBag,
    accentColor: "#EC4899",
    yandex: {
      avgCpc: 18,
      ctr: 4.8,
      conversionRate: 1.8,
      avgBudget: 150000,
      impressions: 580000,
      clicks: 27840,
      leads: 501,
      cpl: 299
    },
    google: {
      avgCpc: 22,
      ctr: 4.2,
      conversionRate: 1.5,
      avgBudget: 120000,
      impressions: 420000,
      clicks: 17640,
      leads: 265,
      cpl: 453
    },
    roi: 380,
    seasonality: [0.7, 0.75, 0.85, 0.9, 0.95, 0.9, 0.85, 0.9, 1.0, 1.1, 1.4, 1.5],
    competition: "very_high",
    recommendations: [
      "Ноябрь-декабрь — максимальные продажи, увеличьте бюджет в 2 раза",
      "Настройте динамический ретаргетинг товаров",
      "Используйте Google Shopping и Яндекс.Маркет"
    ],
    keywords: ["магазин", "купить", "заказать", "товар", "интернет-магазин", "доставка", "каталог", "цена"]
  },
  
  travel: {
    id: "travel",
    name: "Туризм и путешествия",
    category: "Туризм",
    icon: Plane,
    accentColor: "#14B8A6",
    yandex: {
      avgCpc: 42,
      ctr: 4.0,
      conversionRate: 1.5,
      avgBudget: 110000,
      impressions: 195000,
      clicks: 7800,
      leads: 117,
      cpl: 940
    },
    google: {
      avgCpc: 48,
      ctr: 3.6,
      conversionRate: 1.2,
      avgBudget: 85000,
      impressions: 140000,
      clicks: 5040,
      leads: 60,
      cpl: 1417
    },
    roi: 310,
    seasonality: [1.3, 1.2, 1.0, 1.1, 1.2, 1.4, 1.5, 1.4, 1.0, 0.8, 0.7, 1.1],
    competition: "high",
    recommendations: [
      "Лето — высокий сезон, бронируйте бюджеты заранее",
      "Используйте конкретные направления в объявлениях",
      "Настройте рекламу на look-alike путешественников"
    ],
    keywords: ["тур", "путешеств", "отдых", "отель", "билет", "виза", "экскурс", "море", "поездк"]
  },
  
  repair: {
    id: "repair",
    name: "Ремонт и строительство",
    category: "Строительство",
    icon: Wrench,
    accentColor: "#F97316",
    yandex: {
      avgCpc: 65,
      ctr: 3.6,
      conversionRate: 2.8,
      avgBudget: 95000,
      impressions: 112000,
      clicks: 4032,
      leads: 113,
      cpl: 841
    },
    google: {
      avgCpc: 72,
      ctr: 3.2,
      conversionRate: 2.4,
      avgBudget: 70000,
      impressions: 78000,
      clicks: 2496,
      leads: 60,
      cpl: 1167
    },
    roi: 420,
    seasonality: [0.6, 0.65, 0.8, 1.0, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.75, 0.6],
    competition: "high",
    recommendations: [
      "Весна-лето — основной сезон ремонтов",
      "Показывайте ��ортфолио и примеры работ",
      "Разделите кампании: квартиры, офисы, коттеджи"
    ],
    keywords: ["ремонт", "строительств", "отделк", "дизайн интерьер", "мастер", "бригада", "под ключ"]
  },
  
  beauty: {
    id: "beauty",
    name: "Салон красоты",
    category: "Красота",
    icon: Scissors,
    accentColor: "#D946EF",
    yandex: {
      avgCpc: 32,
      ctr: 4.8,
      conversionRate: 3.5,
      avgBudget: 55000,
      impressions: 98000,
      clicks: 4704,
      leads: 165,
      cpl: 333
    },
    google: {
      avgCpc: 38,
      ctr: 4.2,
      conversionRate: 3.0,
      avgBudget: 42000,
      impressions: 72000,
      clicks: 3024,
      leads: 91,
      cpl: 462
    },
    roi: 350,
    seasonality: [0.9, 1.0, 1.1, 1.0, 1.1, 1.2, 1.0, 0.9, 1.0, 1.0, 1.1, 1.4],
    competition: "medium",
    recommendations: [
      "Декабрь — пик перед праздниками, запасайтесь бюджетом",
      "Продвигайте комплексные услуги и подарочные сертификаты",
      "Фото работ обязательны в объявлениях"
    ],
    keywords: ["салон красот", "парикмахер", "маникюр", "косметолог", "стрижк", "окрашивани", "spa", "массаж"]
  },
  
  photo: {
    id: "photo",
    name: "Фото и видео",
    category: "Творчество",
    icon: Camera,
    accentColor: "#0EA5E9",
    yandex: {
      avgCpc: 28,
      ctr: 3.5,
      conversionRate: 2.2,
      avgBudget: 35000,
      impressions: 65000,
      clicks: 2275,
      leads: 50,
      cpl: 700
    },
    google: {
      avgCpc: 32,
      ctr: 3.0,
      conversionRate: 1.8,
      avgBudget: 28000,
      impressions: 48000,
      clicks: 1440,
      leads: 26,
      cpl: 1077
    },
    roi: 280,
    seasonality: [0.7, 0.8, 0.9, 1.0, 1.3, 1.4, 1.3, 1.2, 1.3, 1.1, 0.9, 1.2],
    competition: "medium",
    recommendations: [
      "Май-октябрь — свадебный сезон, основной доход",
      "Портфолио решает — показывайте лучшие работы",
      "Таргетируйтесь на помолвленных и молодожёнов"
    ],
    keywords: ["фотограф", "видеограф", "съёмк", "свадьб", "фотосесси", "видео", "клип"]
  },
  
  it: {
    id: "it",
    name: "IT-услуги",
    category: "IT",
    icon: Laptop,
    accentColor: "#22C55E",
    yandex: {
      avgCpc: 78,
      ctr: 2.8,
      conversionRate: 1.8,
      avgBudget: 130000,
      impressions: 95000,
      clicks: 2660,
      leads: 48,
      cpl: 2708
    },
    google: {
      avgCpc: 92,
      ctr: 2.4,
      conversionRate: 1.5,
      avgBudget: 110000,
      impressions: 72000,
      clicks: 1728,
      leads: 26,
      cpl: 4231
    },
    roi: 720,
    seasonality: [1.0, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 0.85, 1.1, 1.15, 1.1, 0.95],
    competition: "very_high",
    recommendations: [
      "Высокий чек компенсирует дорогие лиды",
      "Разделите B2B и B2C аудитории",
      "Продвигайте кейсы и конкретные решения"
    ],
    keywords: ["разработк", "сайт", "приложени", "программ", "it", "веб", "crm", "автоматизац", "интеграц"]
  },
  
  logistics: {
    id: "logistics",
    name: "Логистика и доставка",
    category: "Логистика",
    icon: Truck,
    accentColor: "#84CC16",
    yandex: {
      avgCpc: 52,
      ctr: 3.2,
      conversionRate: 2.5,
      avgBudget: 85000,
      impressions: 88000,
      clicks: 2816,
      leads: 70,
      cpl: 1214
    },
    google: {
      avgCpc: 58,
      ctr: 2.8,
      conversionRate: 2.1,
      avgBudget: 65000,
      impressions: 62000,
      clicks: 1736,
      leads: 36,
      cpl: 1806
    },
    roi: 380,
    seasonality: [0.9, 0.95, 1.0, 1.0, 1.05, 1.0, 0.95, 1.0, 1.1, 1.15, 1.25, 1.3],
    competition: "high",
    recommendations: [
      "Конец года — пик грузоперевозок",
      "Показывайте конкретные маршруты и цены",
      "Используйте B2B таргетинг на компании"
    ],
    keywords: ["доставк", "грузоперевоз", "логистик", "транспорт", "перевозк", "груз", "склад", "курьер"]
  },
  
  wedding: {
    id: "wedding",
    name: "Свадебные услуги",
    category: "События",
    icon: Heart,
    accentColor: "#FB7185",
    yandex: {
      avgCpc: 35,
      ctr: 4.2,
      conversionRate: 2.0,
      avgBudget: 48000,
      impressions: 72000,
      clicks: 3024,
      leads: 60,
      cpl: 800
    },
    google: {
      avgCpc: 42,
      ctr: 3.8,
      conversionRate: 1.7,
      avgBudget: 38000,
      impressions: 55000,
      clicks: 2090,
      leads: 36,
      cpl: 1056
    },
    roi: 450,
    seasonality: [0.5, 0.6, 0.8, 1.0, 1.3, 1.5, 1.4, 1.3, 1.4, 1.0, 0.7, 0.5],
    competition: "medium",
    recommendations: [
      "Май-октябрь — свадебный сезон, 80% бюджета",
      "Начинайте рекламу за 6-12 месяцев до сезона",
      "Таргетинг на помолвленных в соцсетях"
    ],
    keywords: ["свадьб", "невест", "жених", "банкет", "торжеств", "оформлени", "ведущий", "тамада"]
  },
  
  kids: {
    id: "kids",
    name: "Детские товары/услуги",
    category: "Дети",
    icon: Baby,
    accentColor: "#A855F7",
    yandex: {
      avgCpc: 25,
      ctr: 5.2,
      conversionRate: 3.2,
      avgBudget: 65000,
      impressions: 142000,
      clicks: 7384,
      leads: 236,
      cpl: 275
    },
    google: {
      avgCpc: 28,
      ctr: 4.8,
      conversionRate: 2.8,
      avgBudget: 52000,
      impressions: 105000,
      clicks: 5040,
      leads: 141,
      cpl: 369
    },
    roi: 320,
    seasonality: [0.9, 0.95, 1.0, 1.0, 1.1, 1.0, 0.9, 1.3, 1.2, 1.0, 1.0, 1.2],
    competition: "medium",
    recommendations: [
      "Август — подготовка к школе, пик продаж",
      "Таргетируйтесь на родителей по интересам",
      "Используйте эмоциональные креативы"
    ],
    keywords: ["детск", "ребёнок", "ребенок", "малыш", "игрушк", "развитие", "школ", "садик"]
  },
  
  pets: {
    id: "pets",
    name: "Зоотовары и услуги",
    category: "Питомцы",
    icon: Dog,
    accentColor: "#F472B6",
    yandex: {
      avgCpc: 22,
      ctr: 5.5,
      conversionRate: 3.8,
      avgBudget: 42000,
      impressions: 95000,
      clicks: 5225,
      leads: 199,
      cpl: 211
    },
    google: {
      avgCpc: 26,
      ctr: 5.0,
      conversionRate: 3.4,
      avgBudget: 35000,
      impressions: 72000,
      clicks: 3600,
      leads: 122,
      cpl: 287
    },
    roi: 290,
    seasonality: [1.0, 1.0, 1.0, 1.05, 1.1, 1.15, 1.1, 1.05, 1.0, 1.0, 1.0, 1.1],
    competition: "medium",
    recommendations: [
      "Владельцы питомцев — лояльная аудитория",
      "Настройте регулярные напоминания о товарах",
      "Используйте фото с животными в креативах"
    ],
    keywords: ["зоо", "питомец", "собак", "кошк", "корм", "ветеринар", "груминг", "животн"]
  },
  
  flowers: {
    id: "flowers",
    name: "Цветы и подарки",
    category: "Подарки",
    icon: Flower2,
    accentColor: "#F43F5E",
    yandex: {
      avgCpc: 35,
      ctr: 4.5,
      conversionRate: 4.2,
      avgBudget: 55000,
      impressions: 78000,
      clicks: 3510,
      leads: 147,
      cpl: 374
    },
    google: {
      avgCpc: 42,
      ctr: 4.0,
      conversionRate: 3.8,
      avgBudget: 42000,
      impressions: 55000,
      clicks: 2200,
      leads: 84,
      cpl: 500
    },
    roi: 380,
    seasonality: [0.8, 2.5, 2.0, 0.9, 0.95, 1.0, 0.85, 0.9, 1.3, 0.9, 1.0, 1.5],
    competition: "high",
    recommendations: [
      "14 февраля и 8 марта — 40% годового оборота",
      "Запускайте рекламу за 2 недели до праздников",
      "Настройте срочную доставку в объявлениях"
    ],
    keywords: ["цвет", "букет", "роз", "доставка цветов", "подарок", "флорист"]
  },
  
  design: {
    id: "design",
    name: "Дизайн-студия",
    category: "Творчество",
    icon: Palette,
    accentColor: "#E879F9",
    yandex: {
      avgCpc: 45,
      ctr: 3.0,
      conversionRate: 1.8,
      avgBudget: 65000,
      impressions: 82000,
      clicks: 2460,
      leads: 44,
      cpl: 1477
    },
    google: {
      avgCpc: 52,
      ctr: 2.6,
      conversionRate: 1.5,
      avgBudget: 50000,
      impressions: 58000,
      clicks: 1508,
      leads: 23,
      cpl: 2174
    },
    roi: 480,
    seasonality: [1.0, 1.0, 1.05, 1.1, 1.05, 0.95, 0.85, 0.9, 1.1, 1.1, 1.05, 0.95],
    competition: "high",
    recommendations: [
      "Портфолио — главный инструмент продаж",
      "Продвигайте конкретные услуги: логотип, брендинг, интерьер",
      "Используйте ретаргетинг на посетителей портфолио"
    ],
    keywords: ["дизайн", "логотип", "брендинг", "фирменный стиль", "графика", "интерьер"]
  },
  
  music: {
    id: "music",
    name: "Музыка и звук",
    category: "Творчество",
    icon: Music,
    accentColor: "#7C3AED",
    yandex: {
      avgCpc: 28,
      ctr: 3.2,
      conversionRate: 1.5,
      avgBudget: 32000,
      impressions: 58000,
      clicks: 1856,
      leads: 28,
      cpl: 1143
    },
    google: {
      avgCpc: 32,
      ctr: 2.8,
      conversionRate: 1.2,
      avgBudget: 25000,
      impressions: 42000,
      clicks: 1176,
      leads: 14,
      cpl: 1786
    },
    roi: 320,
    seasonality: [0.9, 0.95, 1.0, 1.0, 1.2, 1.3, 1.2, 1.1, 1.3, 1.0, 0.9, 1.2],
    competition: "low",
    recommendations: [
      "Узкая ниша — меньше конкуренция",
      "Таргетируйтесь на музыкантов и продюсеров",
      "Используйте аудиопримеры в рекламе"
    ],
    keywords: ["музык", "звук", "студия записи", "сведение", "мастеринг", "аранжировк"]
  },
  
  gaming: {
    id: "gaming",
    name: "Игры и развлечения",
    category: "Развлечения",
    icon: Gamepad2,
    accentColor: "#6366F1",
    yandex: {
      avgCpc: 18,
      ctr: 5.8,
      conversionRate: 2.5,
      avgBudget: 48000,
      impressions: 185000,
      clicks: 10730,
      leads: 268,
      cpl: 179
    },
    google: {
      avgCpc: 22,
      ctr: 5.2,
      conversionRate: 2.2,
      avgBudget: 38000,
      impressions: 135000,
      clicks: 7020,
      leads: 154,
      cpl: 247
    },
    roi: 280,
    seasonality: [1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.9, 0.95, 1.0, 1.05, 1.2, 1.4],
    competition: "medium",
    recommendations: [
      "Молодая аудитория — используйте YouTube и TikTok",
      "Новый год — пик продаж игр и консолей",
      "Используйте геймерский сленг в объявлениях"
    ],
    keywords: ["игр", "геймер", "компьютерный клуб", "консол", "киберспорт", "VR", "квест"]
  },
  
  mobile: {
    id: "mobile",
    name: "Ремонт техники",
    category: "Услуги",
    icon: Phone,
    accentColor: "#0D9488",
    yandex: {
      avgCpc: 38,
      ctr: 4.8,
      conversionRate: 4.5,
      avgBudget: 52000,
      impressions: 85000,
      clicks: 4080,
      leads: 184,
      cpl: 283
    },
    google: {
      avgCpc: 45,
      ctr: 4.2,
      conversionRate: 4.0,
      avgBudget: 42000,
      impressions: 62000,
      clicks: 2604,
      leads: 104,
      cpl: 404
    },
    roi: 320,
    seasonality: [1.0, 1.0, 1.0, 1.0, 1.0, 0.95, 0.9, 0.95, 1.1, 1.15, 1.1, 1.1],
    competition: "high",
    recommendations: [
      "Срочный ремонт — ключевое преимущество",
      "Настройте рекламу на геолокацию",
      "Показывайте гарантию и сроки ремонта"
    ],
    keywords: ["ремонт телефон", "ремонт iphone", "ремонт ноутбук", "сервис", "замена экран"]
  },
  
  energy: {
    id: "energy",
    name: "Энергетика и электрика",
    category: "B2B",
    icon: Laptop,
    accentColor: "#FBBF24",
    yandex: {
      avgCpc: 72,
      ctr: 2.8,
      conversionRate: 2.2,
      avgBudget: 95000,
      impressions: 75000,
      clicks: 2100,
      leads: 46,
      cpl: 2065
    },
    google: {
      avgCpc: 85,
      ctr: 2.4,
      conversionRate: 1.8,
      avgBudget: 75000,
      impressions: 52000,
      clicks: 1248,
      leads: 22,
      cpl: 3409
    },
    roi: 520,
    seasonality: [0.9, 0.95, 1.0, 1.05, 1.1, 1.05, 1.0, 1.0, 1.1, 1.15, 1.0, 0.85],
    competition: "medium",
    recommendations: [
      "B2B ниша — длинный цикл сделки",
      "Продвигайте кейсы с экономией для клиентов",
      "Используйте LinkedIn для дополнительного охвата"
    ],
    keywords: ["электрик", "электромонтаж", "энерг", "освещени", "проводк", "щит"]
  },
  
  realty_construction: {
    id: "realty_construction",
    name: "Строительство домов",
    category: "Строительство",
    icon: Building2,
    accentColor: "#78716C",
    yandex: {
      avgCpc: 145,
      ctr: 2.5,
      conversionRate: 0.8,
      avgBudget: 320000,
      impressions: 185000,
      clicks: 4625,
      leads: 37,
      cpl: 8649
    },
    google: {
      avgCpc: 165,
      ctr: 2.2,
      conversionRate: 0.6,
      avgBudget: 250000,
      impressions: 125000,
      clicks: 2750,
      leads: 17,
      cpl: 14706
    },
    roi: 850,
    seasonality: [0.5, 0.6, 0.8, 1.0, 1.2, 1.3, 1.3, 1.2, 1.0, 0.9, 0.7, 0.5],
    competition: "very_high",
    recommendations: [
      "Высокий чек — каждый лид на вес золота",
      "Детальный ретаргетинг на 90+ дней",
      "Показывайте готовые проекты и этапы строительства"
    ],
    keywords: ["строительство дом", "коттедж", "загородный дом", "под ключ", "фундамент", "каркасный"]
  }
}

// Функция матчинга ниши по тексту
export function detectAdsNiche(input: string): { niche: AdsNiche | null; confidence: number } {
  const text = input.toLowerCase().trim()
  
  if (text.length < 2) {
    return { niche: null, confidence: 0 }
  }
  
  let bestMatch: AdsNiche | null = null
  let bestScore = 0
  
  for (const niche of Object.values(ADS_NICHES)) {
    let score = 0
    
    for (const keyword of niche.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword.length * 2
      }
    }
    
    // Точное совпадение с названием
    if (text.includes(niche.name.toLowerCase())) {
      score += 50
    }
    
    // Совпадение с категорией
    if (text.includes(niche.category.toLowerCase())) {
      score += 20
    }
    
    if (score > bestScore) {
      bestScore = score
      bestMatch = niche
    }
  }
  
  const confidence = Math.min(100, bestScore * 2)
  
  return {
    niche: confidence > 20 ? bestMatch : null,
    confidence
  }
}

// Получить примеры ниш для автокомплита
export function getAdsExamples(count: number = 8): AdsNiche[] {
  const all = Object.values(ADS_NICHES)
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Форматирование чисел
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function formatCurrency(num: number, currency: string = "Br"): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M " + currency
  }
  if (num >= 1000) {
    return Math.round(num / 1000) + "K " + currency
  }
  return num + " " + currency
}
