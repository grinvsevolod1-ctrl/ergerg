// ══════════════════════════════════════════════════════════════════════════════
// BUSINESS INTELLIGENCE ENGINE
// Распознает 100+ типов бизнеса с fuzzy matching и синонимами
// ══════════════════════════════════════════════════════════════════════════════

import { 
  Scale, Dumbbell, Scissors, Code, Car, Stethoscope, UtensilsCrossed, 
  GraduationCap, Building2, Coffee, Wand2, TrendingUp, Heart, Star,
  ChefHat, Terminal, FileCode, Briefcase, Activity, Timer, Trophy,
  CreditCard, PieChart, Shield, Flame, Utensils, Wine, Server, 
  Database, BookOpen, Lightbulb, HardHat, Ruler, Hammer, ShoppingBag,
  Camera, Music, Palette, Plane, Hotel, Dog, Baby, Flower, Gem,
  Wrench, Truck, Warehouse, Factory, Cpu, Globe, Smartphone,
  MessageSquare, Radio, Tv, Gamepad2, Bike, Sailboat, Mountain,
  Tent, TreePine, Leaf, Apple, Beef, Fish, Croissant, IceCream,
  Beer, Milk, Shirt, Watch, Glasses, Footprints, Sofa, Lamp, Key,
  Lock, Banknote, Coins, Receipt, Calculator, FileText, Printer,
  Microscope, FlaskConical, Atom, Rocket, Satellite, Wifi, Cloud,
  HardDrive, Monitor, Headphones, Mic, Video, Film, Clapperboard, Gift,
  type LucideIcon
} from "lucide-react"

// ══════════════════════════════════════════════════════════════════════════════
// UI STYLES - Visual representations for each business category
// ══════════════════════════════════════════════════════════════════════════════

export type UIStyle = 
  | "code" | "trading" | "sport" | "menu" | "terminal" | "document" 
  | "elegant" | "clinical" | "learning" | "blueprint" | "industrial" | "cozy"
  | "ecommerce" | "creative" | "travel" | "social" | "gaming" | "nature"
  | "luxury" | "minimal" | "corporate" | "playful"

// ══════════════════════════════════════════════════════════════════════════════
// BUSINESS CATEGORIES - 50+ categories with unique visual identities
// ══════════════════════════════════════════════════════════════════════════════

export interface BusinessTheme {
  icon: LucideIcon
  name: string
  accentColor: string
  secondaryIcons: LucideIcon[]
  uiStyle: UIStyle
  category: string
}

export const BUSINESS_THEMES: Record<string, BusinessTheme> = {
  // ──────────────────────────────────────────────────────────────────────────
  // ЮРИДИЧЕСКИЕ И ФИНАНСОВЫЕ УСЛУГИ
  // ──────────────────────────────────────────────────────────────────────────
  legal: {
    icon: Scale,
    name: "Юридические услуги",
    accentColor: "rgb(251, 191, 36)",
    secondaryIcons: [Briefcase, Shield, FileCode],
    uiStyle: "document",
    category: "Право и финансы"
  },
  finance: {
    icon: TrendingUp,
    name: "Финансовые услуги",
    accentColor: "rgb(52, 211, 153)",
    secondaryIcons: [CreditCard, PieChart, TrendingUp],
    uiStyle: "trading",
    category: "Право и финансы"
  },
  accounting: {
    icon: Calculator,
    name: "Бухгалтерия",
    accentColor: "rgb(96, 165, 250)",
    secondaryIcons: [Receipt, FileText, Coins],
    uiStyle: "document",
    category: "Право и финансы"
  },
  insurance: {
    icon: Shield,
    name: "Страхование",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [FileText, Heart, Shield],
    uiStyle: "document",
    category: "Право и финансы"
  },
  realestate: {
    icon: Key,
    name: "Недвижимость",
    accentColor: "rgb(168, 162, 158)",
    secondaryIcons: [Building2, Key, Banknote],
    uiStyle: "corporate",
    category: "Право и финансы"
  },
  consulting: {
    icon: Briefcase,
    name: "Бизнес консалтинг",
    accentColor: "rgb(99, 102, 241)",
    secondaryIcons: [TrendingUp, Lightbulb, PieChart],
    uiStyle: "corporate",
    category: "Право и финансы"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IT И ТЕХНОЛОГИИ
  // ──────────────────────────────────────────────────────────────────────────
  it: {
    icon: Code,
    name: "IT компания",
    accentColor: "rgb(139, 92, 246)",
    secondaryIcons: [Terminal, Server, Database],
    uiStyle: "terminal",
    category: "IT и технологии"
  },
  startup: {
    icon: Rocket,
    name: "Стартап",
    accentColor: "rgb(236, 72, 153)",
    secondaryIcons: [Lightbulb, TrendingUp, Rocket],
    uiStyle: "code",
    category: "IT и технологии"
  },
  saas: {
    icon: Cloud,
    name: "SaaS сервис",
    accentColor: "rgb(59, 130, 246)",
    secondaryIcons: [Cloud, Server, Cpu],
    uiStyle: "terminal",
    category: "IT и технологии"
  },
  mobile: {
    icon: Smartphone,
    name: "Мобильная разработка",
    accentColor: "rgb(16, 185, 129)",
    secondaryIcons: [Smartphone, Code, Cpu],
    uiStyle: "code",
    category: "IT и технологии"
  },
  hosting: {
    icon: Server,
    name: "Хостинг",
    accentColor: "rgb(20, 184, 166)",
    secondaryIcons: [Server, HardDrive, Cloud],
    uiStyle: "terminal",
    category: "IT и технологии"
  },
  security: {
    icon: Lock,
    name: "Кибербезопасность",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Lock, Shield, Server],
    uiStyle: "terminal",
    category: "IT и технологии"
  },
  ai: {
    icon: Cpu,
    name: "Искусственный интеллект",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Cpu, Database, Atom],
    uiStyle: "code",
    category: "IT и технологии"
  },
  gamedev: {
    icon: Gamepad2,
    name: "Разработка игр",
    accentColor: "rgb(249, 115, 22)",
    secondaryIcons: [Gamepad2, Code, Clapperboard],
    uiStyle: "gaming",
    category: "IT и технологии"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // МЕДИЦИНА И ЗДОРОВЬЕ
  // ──────────────────────────────────────────────────────────────────────────
  medical: {
    icon: Stethoscope,
    name: "Медицинский центр",
    accentColor: "rgb(45, 212, 191)",
    secondaryIcons: [Heart, Activity, Shield],
    uiStyle: "clinical",
    category: "Здоровье"
  },
  dental: {
    icon: Stethoscope,
    name: "Стоматология",
    accentColor: "rgb(56, 189, 248)",
    secondaryIcons: [Star, Shield, Heart],
    uiStyle: "clinical",
    category: "Здоровье"
  },
  pharmacy: {
    icon: FlaskConical,
    name: "Аптека",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Heart, Shield, FlaskConical],
    uiStyle: "clinical",
    category: "Здоровье"
  },
  psychology: {
    icon: Heart,
    name: "Психология",
    accentColor: "rgb(192, 132, 252)",
    secondaryIcons: [Heart, MessageSquare, Lightbulb],
    uiStyle: "elegant",
    category: "Здоровье"
  },
  veterinary: {
    icon: Dog,
    name: "Ветеринария",
    accentColor: "rgb(251, 146, 60)",
    secondaryIcons: [Dog, Heart, Stethoscope],
    uiStyle: "clinical",
    category: "Здоровье"
  },
  optics: {
    icon: Glasses,
    name: "Оптика",
    accentColor: "rgb(147, 197, 253)",
    secondaryIcons: [Glasses, Star, Heart],
    uiStyle: "elegant",
    category: "Здоровье"
  },
  laboratory: {
    icon: Microscope,
    name: "Лаборатория",
    accentColor: "rgb(74, 222, 128)",
    secondaryIcons: [Microscope, FlaskConical, FileText],
    uiStyle: "clinical",
    category: "Здоровье"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // КРАСОТА И ЗДОРОВЬЕ
  // ──────────────────────────────────────────────────────────────────────────
  beauty: {
    icon: Scissors,
    name: "Салон красоты",
    accentColor: "rgb(244, 114, 182)",
    secondaryIcons: [Heart, Star, Flower],
    uiStyle: "elegant",
    category: "Красота"
  },
  spa: {
    icon: Flower,
    name: "СПА центр",
    accentColor: "rgb(167, 139, 250)",
    secondaryIcons: [Flower, Heart, Star],
    uiStyle: "elegant",
    category: "Красота"
  },
  barbershop: {
    icon: Scissors,
    name: "Барбершоп",
    accentColor: "rgb(161, 161, 170)",
    secondaryIcons: [Scissors, Star, Trophy],
    uiStyle: "industrial",
    category: "Красота"
  },
  nails: {
    icon: Gem,
    name: "Маникюр и педикюр",
    accentColor: "rgb(251, 113, 133)",
    secondaryIcons: [Gem, Star, Heart],
    uiStyle: "elegant",
    category: "Красота"
  },
  cosmetics: {
    icon: Flower,
    name: "Косметология",
    accentColor: "rgb(249, 168, 212)",
    secondaryIcons: [Flower, Heart, Star],
    uiStyle: "elegant",
    category: "Красота"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // СПОРТ И ФИТНЕС
  // ──────────────────────────────────────────────────────────────────────────
  fitness: {
    icon: Dumbbell,
    name: "Фитнес клуб",
    accentColor: "rgb(249, 115, 22)",
    secondaryIcons: [Activity, Flame, Trophy],
    uiStyle: "sport",
    category: "Спорт"
  },
  yoga: {
    icon: Activity,
    name: "Йога студия",
    accentColor: "rgb(192, 132, 252)",
    secondaryIcons: [Activity, Heart, Leaf],
    uiStyle: "elegant",
    category: "Спорт"
  },
  martial: {
    icon: Trophy,
    name: "Единоборства",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Trophy, Flame, Shield],
    uiStyle: "sport",
    category: "Спорт"
  },
  pool: {
    icon: Activity,
    name: "Бассейн",
    accentColor: "rgb(56, 189, 248)",
    secondaryIcons: [Activity, Heart, Trophy],
    uiStyle: "sport",
    category: "Спорт"
  },
  dance: {
    icon: Music,
    name: "Танцевальная студия",
    accentColor: "rgb(236, 72, 153)",
    secondaryIcons: [Music, Heart, Star],
    uiStyle: "creative",
    category: "Спорт"
  },
  cycling: {
    icon: Bike,
    name: "Велоспорт",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Bike, Trophy, Activity],
    uiStyle: "sport",
    category: "Спорт"
  },
  outdoor: {
    icon: Mountain,
    name: "Активный отдых",
    accentColor: "rgb(132, 204, 22)",
    secondaryIcons: [Mountain, Tent, TreePine],
    uiStyle: "nature",
    category: "Спорт"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ПИТАНИЕ И НАПИТКИ
  // ──────────────────────────────────────────────────────────────────────────
  restaurant: {
    icon: UtensilsCrossed,
    name: "Ресторан",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [ChefHat, Wine, Utensils],
    uiStyle: "menu",
    category: "Питание"
  },
  cafe: {
    icon: Coffee,
    name: "Кофейня",
    accentColor: "rgb(217, 119, 6)",
    secondaryIcons: [Coffee, Heart, Star],
    uiStyle: "cozy",
    category: "Питание"
  },
  bar: {
    icon: Beer,
    name: "Бар",
    accentColor: "rgb(251, 191, 36)",
    secondaryIcons: [Beer, Wine, Music],
    uiStyle: "menu",
    category: "Питание"
  },
  bakery: {
    icon: Croissant,
    name: "Пекарня",
    accentColor: "rgb(234, 179, 8)",
    secondaryIcons: [Croissant, Coffee, Heart],
    uiStyle: "cozy",
    category: "Питание"
  },
  fastfood: {
    icon: Utensils,
    name: "Фаст-фуд",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Utensils, Timer, Flame],
    uiStyle: "playful",
    category: "Питание"
  },
  sushi: {
    icon: Fish,
    name: "Суши и японская кухня",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Fish, Star, Heart],
    uiStyle: "minimal",
    category: "Питание"
  },
  pizza: {
    icon: Utensils,
    name: "Пиццерия",
    accentColor: "rgb(249, 115, 22)",
    secondaryIcons: [Utensils, Flame, Timer],
    uiStyle: "playful",
    category: "Питание"
  },
  icecream: {
    icon: IceCream,
    name: "Мороженое",
    accentColor: "rgb(251, 113, 133)",
    secondaryIcons: [IceCream, Heart, Star],
    uiStyle: "playful",
    category: "Питание"
  },
  catering: {
    icon: ChefHat,
    name: "Кейтеринг",
    accentColor: "rgb(234, 179, 8)",
    secondaryIcons: [ChefHat, Utensils, Trophy],
    uiStyle: "menu",
    category: "Питание"
  },
  fooddelivery: {
    icon: Truck,
    name: "Доставка еды",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Truck, Timer, Utensils],
    uiStyle: "minimal",
    category: "Питание"
  },
  grocerystore: {
    icon: Apple,
    name: "Продуктовый магазин",
    accentColor: "rgb(74, 222, 128)",
    secondaryIcons: [Apple, Leaf, ShoppingBag],
    uiStyle: "ecommerce",
    category: "Питание"
  },
  meatshop: {
    icon: Beef,
    name: "Мясной магазин",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Beef, Star, ShoppingBag],
    uiStyle: "ecommerce",
    category: "Питание"
  },
  dairy: {
    icon: Milk,
    name: "Молочная продукция",
    accentColor: "rgb(147, 197, 253)",
    secondaryIcons: [Milk, Heart, Leaf],
    uiStyle: "ecommerce",
    category: "Питание"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ОБРАЗОВАНИЕ
  // ──────────────────────────────────────────────────────────────────────────
  education: {
    icon: GraduationCap,
    name: "Образовательный центр",
    accentColor: "rgb(59, 130, 246)",
    secondaryIcons: [BookOpen, Lightbulb, Trophy],
    uiStyle: "learning",
    category: "Образование"
  },
  language: {
    icon: Globe,
    name: "Языковая школа",
    accentColor: "rgb(16, 185, 129)",
    secondaryIcons: [Globe, MessageSquare, BookOpen],
    uiStyle: "learning",
    category: "Образование"
  },
  driving: {
    icon: Car,
    name: "Автошкола",
    accentColor: "rgb(251, 146, 60)",
    secondaryIcons: [Car, FileText, Shield],
    uiStyle: "learning",
    category: "Образование"
  },
  music_school: {
    icon: Music,
    name: "Музыкальная школа",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Music, Headphones, Star],
    uiStyle: "creative",
    category: "Образование"
  },
  art_school: {
    icon: Palette,
    name: "Художественная школа",
    accentColor: "rgb(244, 114, 182)",
    secondaryIcons: [Palette, Lightbulb, Star],
    uiStyle: "creative",
    category: "Образование"
  },
  kids: {
    icon: Baby,
    name: "Детский центр",
    accentColor: "rgb(251, 191, 36)",
    secondaryIcons: [Baby, Star, Heart],
    uiStyle: "playful",
    category: "Образование"
  },
  tutoring: {
    icon: BookOpen,
    name: "Репетиторство",
    accentColor: "rgb(96, 165, 250)",
    secondaryIcons: [BookOpen, Lightbulb, Star],
    uiStyle: "learning",
    category: "Образование"
  },
  online_courses: {
    icon: Monitor,
    name: "Онлайн курсы",
    accentColor: "rgb(139, 92, 246)",
    secondaryIcons: [Monitor, Video, BookOpen],
    uiStyle: "learning",
    category: "Образование"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // СТРОИТЕЛЬСТВО И РЕМОНТ
  // ──────────────────────────────────────────────────────────────────────────
  construction: {
    icon: Building2,
    name: "Строительная компания",
    accentColor: "rgb(234, 179, 8)",
    secondaryIcons: [HardHat, Ruler, Hammer],
    uiStyle: "blueprint",
    category: "Строительство"
  },
  renovation: {
    icon: Hammer,
    name: "Ремонт квартир",
    accentColor: "rgb(251, 146, 60)",
    secondaryIcons: [Hammer, Ruler, HardHat],
    uiStyle: "blueprint",
    category: "Строительство"
  },
  interior: {
    icon: Sofa,
    name: "Дизайн интерьера",
    accentColor: "rgb(167, 139, 250)",
    secondaryIcons: [Sofa, Lamp, Palette],
    uiStyle: "creative",
    category: "Строительство"
  },
  architecture: {
    icon: Ruler,
    name: "Архитектура",
    accentColor: "rgb(161, 161, 170)",
    secondaryIcons: [Ruler, Building2, Lightbulb],
    uiStyle: "blueprint",
    category: "Строительство"
  },
  plumbing: {
    icon: Wrench,
    name: "Сантехника",
    accentColor: "rgb(56, 189, 248)",
    secondaryIcons: [Wrench, Timer, Shield],
    uiStyle: "industrial",
    category: "Строительство"
  },
  electrical: {
    icon: Lightbulb,
    name: "Электрика",
    accentColor: "rgb(250, 204, 21)",
    secondaryIcons: [Lightbulb, Wrench, Shield],
    uiStyle: "industrial",
    category: "Строительство"
  },
  roofing: {
    icon: HardHat,
    name: "Кровельные работы",
    accentColor: "rgb(120, 113, 108)",
    secondaryIcons: [HardHat, Hammer, Shield],
    uiStyle: "industrial",
    category: "Строительство"
  },
  windows: {
    icon: Building2,
    name: "Окна и двери",
    accentColor: "rgb(147, 197, 253)",
    secondaryIcons: [Building2, Ruler, Shield],
    uiStyle: "industrial",
    category: "Строительство"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // АВТО
  // ──────────────────────────────────────────────────────────────────────────
  auto: {
    icon: Car,
    name: "Автосервис",
    accentColor: "rgb(161, 161, 170)",
    secondaryIcons: [Timer, Wrench, Shield],
    uiStyle: "industrial",
    category: "Авто"
  },
  carwash: {
    icon: Car,
    name: "Автомойка",
    accentColor: "rgb(56, 189, 248)",
    secondaryIcons: [Car, Star, Timer],
    uiStyle: "industrial",
    category: "Авто"
  },
  tires: {
    icon: Car,
    name: "Шиномонтаж",
    accentColor: "rgb(75, 85, 99)",
    secondaryIcons: [Car, Wrench, Timer],
    uiStyle: "industrial",
    category: "Авто"
  },
  detailing: {
    icon: Star,
    name: "Детейлинг",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Star, Car, Gem],
    uiStyle: "luxury",
    category: "Авто"
  },
  cardealer: {
    icon: Car,
    name: "Автосалон",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Car, CreditCard, Trophy],
    uiStyle: "luxury",
    category: "Авто"
  },
  parking: {
    icon: Car,
    name: "Паркинг",
    accentColor: "rgb(96, 165, 250)",
    secondaryIcons: [Car, Timer, Shield],
    uiStyle: "minimal",
    category: "Авто"
  },
  rental: {
    icon: Car,
    name: "Аренда авто",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Car, Key, Timer],
    uiStyle: "minimal",
    category: "Авто"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ТОРГОВЛЯ
  // ──────────────────────────────────────────────────────────────────────────
  ecommerce: {
    icon: ShoppingBag,
    name: "Интернет-магазин",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [ShoppingBag, CreditCard, Truck],
    uiStyle: "ecommerce",
    category: "Торговля"
  },
  fashion: {
    icon: Shirt,
    name: "Магазин одежды",
    accentColor: "rgb(244, 114, 182)",
    secondaryIcons: [Shirt, ShoppingBag, Heart],
    uiStyle: "ecommerce",
    category: "Торговля"
  },
  shoes: {
    icon: Footprints,
    name: "Обувной магазин",
    accentColor: "rgb(168, 162, 158)",
    secondaryIcons: [Footprints, ShoppingBag, Star],
    uiStyle: "ecommerce",
    category: "Торговля"
  },
  jewelry: {
    icon: Gem,
    name: "Ювелирный магазин",
    accentColor: "rgb(250, 204, 21)",
    secondaryIcons: [Gem, Star, Heart],
    uiStyle: "luxury",
    category: "Торговля"
  },
  watches: {
    icon: Watch,
    name: "Часы и аксессуары",
    accentColor: "rgb(161, 161, 170)",
    secondaryIcons: [Watch, Gem, Star],
    uiStyle: "luxury",
    category: "Торговля"
  },
  electronics: {
    icon: Smartphone,
    name: "Электроника",
    accentColor: "rgb(59, 130, 246)",
    secondaryIcons: [Smartphone, Monitor, Headphones],
    uiStyle: "minimal",
    category: "Торговля"
  },
  furniture: {
    icon: Sofa,
    name: "Мебельный магазин",
    accentColor: "rgb(217, 119, 6)",
    secondaryIcons: [Sofa, Lamp, Building2],
    uiStyle: "ecommerce",
    category: "Торговля"
  },
  flowers: {
    icon: Flower,
    name: "Цветочный магазин",
    accentColor: "rgb(244, 114, 182)",
    secondaryIcons: [Flower, Heart, Gift],
    uiStyle: "elegant",
    category: "Торговля"
  },
  pets: {
    icon: Dog,
    name: "Зоомагазин",
    accentColor: "rgb(251, 146, 60)",
    secondaryIcons: [Dog, Heart, ShoppingBag],
    uiStyle: "playful",
    category: "Торговля"
  },
  books: {
    icon: BookOpen,
    name: "Книжный магазин",
    accentColor: "rgb(120, 113, 108)",
    secondaryIcons: [BookOpen, Coffee, Heart],
    uiStyle: "cozy",
    category: "Торговля"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ТУРИЗМ И ГОСТЕПРИИМСТВО
  // ──────────────────────────────────────────────────────────────────────────
  travel: {
    icon: Plane,
    name: "Туристическое агентство",
    accentColor: "rgb(56, 189, 248)",
    secondaryIcons: [Plane, Globe, Camera],
    uiStyle: "travel",
    category: "Туризм"
  },
  hotel: {
    icon: Hotel,
    name: "Отель",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Hotel, Star, Key],
    uiStyle: "luxury",
    category: "Туризм"
  },
  hostel: {
    icon: Hotel,
    name: "Хостел",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Hotel, Globe, Heart],
    uiStyle: "playful",
    category: "Туризм"
  },
  apartment: {
    icon: Key,
    name: "Апартаменты",
    accentColor: "rgb(147, 197, 253)",
    secondaryIcons: [Key, Building2, Star],
    uiStyle: "minimal",
    category: "Туризм"
  },
  excursions: {
    icon: Camera,
    name: "Экскурсии",
    accentColor: "rgb(251, 146, 60)",
    secondaryIcons: [Camera, Globe, Mountain],
    uiStyle: "travel",
    category: "Туризм"
  },
  camping: {
    icon: Tent,
    name: "Кемпинг",
    accentColor: "rgb(132, 204, 22)",
    secondaryIcons: [Tent, Mountain, TreePine],
    uiStyle: "nature",
    category: "Туризм"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // РАЗВЛЕЧЕНИЯ И ТВОРЧЕСТВО
  // ──────────────────────────────────────────────────────────────────────────
  photo: {
    icon: Camera,
    name: "Фотостудия",
    accentColor: "rgb(168, 162, 158)",
    secondaryIcons: [Camera, Film, Star],
    uiStyle: "creative",
    category: "Развлечения"
  },
  video: {
    icon: Video,
    name: "Видеопродакшн",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Video, Clapperboard, Film],
    uiStyle: "creative",
    category: "Развлечения"
  },
  music_studio: {
    icon: Mic,
    name: "Музыкальная студия",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Mic, Headphones, Music],
    uiStyle: "creative",
    category: "Развлечения"
  },
  events: {
    icon: Star,
    name: "Организация мероприятий",
    accentColor: "rgb(251, 191, 36)",
    secondaryIcons: [Star, Music, Heart],
    uiStyle: "creative",
    category: "Развлечения"
  },
  nightclub: {
    icon: Music,
    name: "Ночной клуб",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Music, Star, Wine],
    uiStyle: "luxury",
    category: "Развлечения"
  },
  cinema: {
    icon: Film,
    name: "Кинотеатр",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Film, Clapperboard, Star],
    uiStyle: "creative",
    category: "Развлечения"
  },
  gaming_club: {
    icon: Gamepad2,
    name: "Игровой клуб",
    accentColor: "rgb(139, 92, 246)",
    secondaryIcons: [Gamepad2, Trophy, Star],
    uiStyle: "gaming",
    category: "Развлечения"
  },
  escape: {
    icon: Lock,
    name: "Квест комната",
    accentColor: "rgb(239, 68, 68)",
    secondaryIcons: [Lock, Key, Star],
    uiStyle: "gaming",
    category: "Развлечения"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ЛОГИСТИКА И ПРОИЗВОДСТВО
  // ──────────────────────────────────────────────────────────────────────────
  logistics: {
    icon: Truck,
    name: "Логистика",
    accentColor: "rgb(96, 165, 250)",
    secondaryIcons: [Truck, Warehouse, Globe],
    uiStyle: "industrial",
    category: "Логистика"
  },
  warehouse: {
    icon: Warehouse,
    name: "Склад",
    accentColor: "rgb(161, 161, 170)",
    secondaryIcons: [Warehouse, Truck, Shield],
    uiStyle: "industrial",
    category: "Логистика"
  },
  factory: {
    icon: Factory,
    name: "Производство",
    accentColor: "rgb(120, 113, 108)",
    secondaryIcons: [Factory, Wrench, Shield],
    uiStyle: "industrial",
    category: "Логистика"
  },
  courier: {
    icon: Truck,
    name: "Курьерская служба",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Truck, Timer, Shield],
    uiStyle: "minimal",
    category: "Логистика"
  },
  moving: {
    icon: Truck,
    name: "Грузоперевозки",
    accentColor: "rgb(251, 146, 60)",
    secondaryIcons: [Truck, Sofa, Shield],
    uiStyle: "industrial",
    category: "Логистика"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ПРОЧИЕ УСЛУГИ
  // ──────────────────────────────────────────────────────────────────────────
  cleaning: {
    icon: Flower,
    name: "Клининг",
    accentColor: "rgb(56, 189, 248)",
    secondaryIcons: [Flower, Star, Shield],
    uiStyle: "minimal",
    category: "Услуги"
  },
  laundry: {
    icon: Shirt,
    name: "Прачечная",
    accentColor: "rgb(147, 197, 253)",
    secondaryIcons: [Shirt, Timer, Star],
    uiStyle: "minimal",
    category: "Услуги"
  },
  printing: {
    icon: Printer,
    name: "Типография",
    accentColor: "rgb(75, 85, 99)",
    secondaryIcons: [Printer, FileText, Palette],
    uiStyle: "industrial",
    category: "Услуги"
  },
  locksmith: {
    icon: Key,
    name: "Замки и ключи",
    accentColor: "rgb(234, 179, 8)",
    secondaryIcons: [Key, Lock, Shield],
    uiStyle: "industrial",
    category: "Услуги"
  },
  tailor: {
    icon: Scissors,
    name: "Ателье",
    accentColor: "rgb(244, 114, 182)",
    secondaryIcons: [Scissors, Shirt, Ruler],
    uiStyle: "elegant",
    category: "Услуги"
  },
  repair: {
    icon: Wrench,
    name: "Ремонт техники",
    accentColor: "rgb(96, 165, 250)",
    secondaryIcons: [Wrench, Smartphone, Cpu],
    uiStyle: "industrial",
    category: "Услуги"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // МЕДИА И МАРКЕТИНГ
  // ──────────────────────────────────────────────────────────────────────────
  marketing: {
    icon: TrendingUp,
    name: "Маркетинговое агентство",
    accentColor: "rgb(249, 115, 22)",
    secondaryIcons: [TrendingUp, MessageSquare, Globe],
    uiStyle: "creative",
    category: "Медиа"
  },
  smm: {
    icon: MessageSquare,
    name: "SMM агентство",
    accentColor: "rgb(236, 72, 153)",
    secondaryIcons: [MessageSquare, Heart, TrendingUp],
    uiStyle: "social",
    category: "Медиа"
  },
  seo: {
    icon: Globe,
    name: "SEO продвижение",
    accentColor: "rgb(34, 197, 94)",
    secondaryIcons: [Globe, TrendingUp, Code],
    uiStyle: "terminal",
    category: "Медиа"
  },
  pr: {
    icon: Mic,
    name: "PR агентство",
    accentColor: "rgb(168, 85, 247)",
    secondaryIcons: [Mic, MessageSquare, Star],
    uiStyle: "corporate",
    category: "Медиа"
  },
  design: {
    icon: Palette,
    name: "Дизайн студия",
    accentColor: "rgb(236, 72, 153)",
    secondaryIcons: [Palette, Lightbulb, Monitor],
    uiStyle: "creative",
    category: "Медиа"
  },
  branding: {
    icon: Star,
    name: "Брендинг",
    accentColor: "rgb(251, 191, 36)",
    secondaryIcons: [Star, Palette, Lightbulb],
    uiStyle: "creative",
    category: "Медиа"
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DEFAULT
  // ──────────────────────────────────────────────────────────────────────────
  default: {
    icon: Wand2,
    name: "AI Генератор",
    accentColor: "rgb(74, 222, 255)",
    secondaryIcons: [Code, Rocket, Cpu],
    uiStyle: "code",
    category: "Другое"
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// KEYWORD MATCHING - 500+ keywords with fuzzy matching
// ══════════════════════════════════════════════════════════════════════════════

const BUSINESS_KEYWORDS: Record<string, string[]> = {
  // Юридические
  legal: ["юрист", "юридич", "адвокат", "право", "закон", "нотариус", "суд", "иск", "договор", "консульт юрид", "юр услуг", "правов", "лицензи"],
  
  // Финансовые
  finance: ["финанс", "банк", "инвест", "трейд", "крипт", "биржа", "акци", "облигаци", "форекс", "forex", "брокер", "фонд"],
  accounting: ["бухгалт", "учет", "налог", "декларац", "баланс", "аудит", "отчет", "1с"],
  insurance: ["страхов", "полис", "осаго", "каско", "страх жизн", "дмс", "омс"],
  realestate: ["недвижим", "риэлтор", "риелтор", "квартир продаж", "аренда квартир", "агент недвиж", "жилье"],
  consulting: ["консалтинг", "консультац", "бизнес консульт", "стратег", "оптимизац бизнес"],
  
  // IT
  it: ["it", "ит ", "айти", "программ", "разработ", "digital", "диджитал", "софт", "веб", "web", "tech", "код", "developer", "девелопер", "сайт создан", "приложен"],
  startup: ["стартап", "startup", "венчур", "инновац", "tech startup", "mvp"],
  saas: ["saas", "сервис подписк", "облачн", "cloud", "платформ"],
  mobile: ["мобильн", "ios", "android", "приложен", "app", "аппликейшн"],
  hosting: ["хостинг", "домен", "сервер арен", "vps", "vds", "дата центр"],
  security: ["безопасност", "кибер", "антивирус", "защит данн", "информ безоп", "взлом", "хакер"],
  ai: ["искусствен интеллект", "машинн обучен", "нейросет", "ai ", "ml ", "deep learning", "чат бот", "gpt"],
  gamedev: ["игр разработ", "gamedev", "геймдев", "unity", "unreal", "игровая студ"],
  
  // Медицина
  medical: ["медиц", "клиник", "врач", "доктор", "здоров", "лечен", "диагност", "больниц", "госпиталь", "поликлиник"],
  dental: ["стоматолог", "зуб", "дентал", "dental", "имплант", "брекет", "отбеливан", "протез зуб"],
  pharmacy: ["аптек", "лекарств", "фармац", "таблетк", "медикамент", "витамин"],
  psychology: ["психолог", "психотерап", "терапи", "консультац психо", "ментальн", "тревог", "депресс"],
  veterinary: ["ветеринар", "вет клиник", "животн", "питомец", "собак лечен", "кошк лечен"],
  optics: ["оптик", "очки", "линз", "зрен", "офтальмолог", "глаз"],
  laboratory: ["лаборатор", "анализ", "исследован", "диагностик"],
  
  // Красота
  beauty: ["салон красот", "красот", "парикмахер", "стилист", "визаж", "мейкап", "макияж", "прическ"],
  spa: ["спа", "spa", "релакс", "массаж", "wellness", "велнес"],
  barbershop: ["барбер", "barber", "мужск стрижк", "борода", "бритье"],
  nails: ["маникюр", "педикюр", "ногт", "nail", "гель лак", "наращиван ногт"],
  cosmetics: ["косметолог", "косметик", "уход за кож", "чистка лиц", "пилинг", "ботокс", "инъекц"],
  
  // Спорт
  fitness: ["фитнес", "тренажер", "качалк", "gym", "спортзал", "тренировк", "персональн тренер"],
  yoga: ["йога", "yoga", "медитац", "пилатес", "pilates", "растяжк", "стретчинг"],
  martial: ["единоборств", "бокс", "мма", "mma", "карате", "дзюдо", "тхэквондо", "самбо", "борьб"],
  pool: ["бассейн", "плаван", "аквааэробик", "водн"],
  dance: ["танц", "dance", "хореограф", "балет", "сальса", "хип хоп", "танцевальн"],
  cycling: ["велосипед", "cycling", "велоспорт", "bike"],
  outdoor: ["туризм актив", "поход", "альпинизм", "скалолаз", "рафтинг", "экстрим"],
  
  // Питание
  restaurant: ["ресторан", "кухн", "шеф", "банкет", "гастроном"],
  cafe: ["кофейн", "кофе", "coffee", "кафе", "капучино", "латте", "эспрессо"],
  bar: ["бар ", "паб", "pub", "пив", "коктейл", "алкоголь"],
  bakery: ["пекарн", "выпечк", "хлеб", "булочн", "кондитер", "торт"],
  fastfood: ["фаст фуд", "фастфуд", "fast food", "бургер", "burger", "сэндвич"],
  sushi: ["суши", "sushi", "роллы", "япон кухн", "сашими", "рамен"],
  pizza: ["пицц", "pizza", "пиццери", "итальян кухн"],
  icecream: ["морожен", "ice cream", "джелато", "gelato"],
  catering: ["кейтеринг", "catering", "банкет", "фуршет", "выездн ресторан"],
  fooddelivery: ["доставк еды", "delivery", "курьер еда", "еда на дом"],
  grocerystore: ["продукт магаз", "супермаркет", "grocery", "магазин продукт", "минимаркет"],
  meatshop: ["мясн", "мясо", "колбас", "деликатес"],
  dairy: ["молочн", "молоко", "сыр", "творог", "йогурт"],
  
  // Образование
  education: ["образован", "курс", "обучен", "школ", "универ", "колледж", "академи", "институт"],
  language: ["язык", "english", "английск", "немецк", "француз", "китайск", "лингв"],
  driving: ["автошкол", "водител", "прав категор", "вожден"],
  music_school: ["музыкальн школ", "музык обучен", "гитар", "фортепиано", "вокал", "пение"],
  art_school: ["художеств", "рисован", "живопис", "арт студ", "изо"],
  kids: ["детск", "ребенок", "дети", "малыш", "развит детей", "детский сад", "садик"],
  tutoring: ["репетитор", "подготовк к экзамен", "егэ", "огэ", "частн урок"],
  online_courses: ["онлайн курс", "дистанц обучен", "вебинар", "онлайн школ"],
  
  // Строительство
  construction: ["строител", "застройщик", "строит компан", "дом постро", "коттедж"],
  renovation: ["ремонт квартир", "отделк", "ремонт под ключ", "евроремонт", "капитальн ремонт"],
  interior: ["интерьер", "дизайн интерьер", "дизайн помещен", "декор"],
  architecture: ["архитект", "проектирован", "проект дом"],
  plumbing: ["сантехник", "водопровод", "канализац", "трубы", "унитаз", "смеситель"],
  electrical: ["электрик", "электромонтаж", "проводк", "розетк", "освещен"],
  roofing: ["кровл", "крыш", "черепиц", "водосток"],
  windows: ["окн", "двер", "стеклопакет", "пвх", "балкон остеклен"],
  
  // Авто
  auto: ["автосервис", "сто", "ремонт авто", "автомастерск", "диагностик авто", "техобслуживан"],
  carwash: ["автомойк", "мойк", "car wash"],
  tires: ["шиномонтаж", "шин", "колес", "балансировк", "резин"],
  detailing: ["детейлинг", "полировк", "защит покрыт", "керамик"],
  cardealer: ["автосалон", "авто продаж", "автодилер", "машин продаж"],
  parking: ["паркинг", "стоянк", "гараж", "парковк"],
  rental: ["арен авто", "прокат авто", "каршеринг", "rent car"],
  
  // Торговля
  ecommerce: ["интернет магазин", "онлайн магазин", "e-commerce", "ecommerce", "маркетплейс"],
  fashion: ["одежд", "fashion", "мода", "бутик", "магазин одежд", "брендов одежд"],
  shoes: ["обув", "кроссовк", "туфл", "сапог", "ботинк"],
  jewelry: ["ювелир", "украшен", "золот", "серебр", "бриллиант", "кольц"],
  watches: ["час", "watch", "аксессуар"],
  electronics: ["электроник", "техник", "гаджет", "смартфон", "ноутбук", "компьютер магаз"],
  furniture: ["мебел", "furniture", "диван", "кроват", "шкаф", "стол"],
  flowers: ["цвет", "flower", "букет", "флорист", "роз"],
  pets: ["зоомагазин", "зоотовар", "корм для животн", "товар для питомц"],
  books: ["книжн", "книг магаз", "литератур", "библиотек"],
  
  // Туризм
  travel: ["туризм", "тур агент", "путешеств", "travel", "турист", "туропорат"],
  hotel: ["отел", "hotel", "гостиниц", "номер брон"],
  hostel: ["хостел", "hostel"],
  apartment: ["апартамент", "квартир посут", "жиль арен"],
  excursions: ["экскурс", "гид", "тур по город"],
  camping: ["кемпинг", "палатк", "глэмпинг"],
  
  // Развлечения
  photo: ["фото", "photo", "фотограф", "съемк", "фотосесс", "фотостуд"],
  video: ["видео", "video", "видеограф", "видеосъемк", "продакшн", "клип"],
  music_studio: ["звукозапис", "студи записи", "музык студ"],
  events: ["мероприят", "event", "праздник", "организац событ", "свадьб организ", "корпоратив"],
  nightclub: ["ночн клуб", "клуб", "дискотек"],
  cinema: ["кинотеатр", "кино", "cinema"],
  gaming_club: ["игров клуб", "киберспорт", "компьютерн клуб", "playstation", "xbox"],
  escape: ["квест", "escape", "квест комнат"],
  
  // Логистика
  logistics: ["логистик", "транспорт компан", "перевозк"],
  warehouse: ["склад", "хранен"],
  factory: ["производств", "фабрик", "завод", "изготовлен"],
  courier: ["курьер", "экспресс доставк", "срочн доставк"],
  moving: ["грузоперевозк", "переезд", "грузчик"],
  
  // Услуги
  cleaning: ["клининг", "уборк", "химчистк"],
  laundry: ["прачечн", "стирк", "глажк"],
  printing: ["типограф", "полиграф", "печат", "визитк"],
  locksmith: ["замк", "ключ", "замочн", "слесарь"],
  tailor: ["ателье", "портн", "пошив", "перешив"],
  repair: ["ремонт техник", "ремонт телефон", "ремонт ноутбук", "сервис центр"],
  
  // Медиа
  marketing: ["маркетинг", "реклам", "продвижен"],
  smm: ["smm", "соц сет", "instagram", "инстаграм", "facebook", "вконтакте", "тикток", "tiktok", "таргет"],
  seo: ["seo", "сео", "поисков продвижен", "оптимизац сайт"],
  pr: ["pr ", "пиар", "связи с общественност", "репутац"],
  design: ["дизайн", "design", "графическ дизайн", "ui", "ux", "figma"],
  branding: ["брендинг", "бренд", "фирменн стил", "логотип", "айдентик"]
}

// ══════════════════════════════════════════════════════════════════════════════
// FUZZY MATCHING ENGINE
// ══════════════════════════════════════════════════════════════════════════════

// Levenshtein distance for typo tolerance
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

// Transliterate Russian to English and vice versa
const RU_TO_EN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
  'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
}

function transliterate(text: string): string {
  return text.split('').map(char => RU_TO_EN[char] || char).join('')
}

// Normalize text for matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\wа-яё\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface MatchResult {
  theme: string
  confidence: number
  matchedKeywords: string[]
}

// Main detection function with confidence score
export function detectBusinessTheme(input: string): MatchResult {
  const normalized = normalizeText(input)
  const transliterated = transliterate(normalized)
  const words = normalized.split(' ')
  
  let bestMatch: MatchResult = {
    theme: 'default',
    confidence: 0,
    matchedKeywords: []
  }
  
  for (const [theme, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    let themeConfidence = 0
    const matched: string[] = []
    
    for (const keyword of keywords) {
      // Direct match
      if (normalized.includes(keyword)) {
        themeConfidence += 100
        matched.push(keyword)
        continue
      }
      
      // Transliterated match
      if (transliterated.includes(keyword)) {
        themeConfidence += 80
        matched.push(keyword)
        continue
      }
      
      // Fuzzy match for typos
      for (const word of words) {
        if (word.length >= 3 && keyword.length >= 3) {
          const distance = levenshtein(word, keyword.split(' ')[0])
          if (distance <= 2 && word.length >= 4) {
            themeConfidence += Math.max(0, 50 - distance * 15)
            matched.push(keyword)
          }
        }
      }
    }
    
    // Normalize confidence to 0-100
    themeConfidence = Math.min(100, themeConfidence / (matched.length || 1))
    
    if (themeConfidence > bestMatch.confidence) {
      bestMatch = {
        theme,
        confidence: themeConfidence,
        matchedKeywords: matched
      }
    }
  }
  
  return bestMatch
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export interface Suggestion {
  text: string
  theme: string
  category: string
}

// Pre-computed suggestions for fast lookup
const SUGGESTIONS: Suggestion[] = [
  // Популярные бизнесы
  { text: "Кофейня", theme: "cafe", category: "Питание" },
  { text: "Кофейня в центре города", theme: "cafe", category: "Питание" },
  { text: "Кофейня с выпечкой", theme: "cafe", category: "Питание" },
  { text: "Ресторан", theme: "restaurant", category: "Питание" },
  { text: "Ресторан итальянской кухни", theme: "restaurant", category: "Питание" },
  { text: "Ресторан японской кухни", theme: "sushi", category: "Питание" },
  { text: "Суши бар", theme: "sushi", category: "Питание" },
  { text: "Пиццерия", theme: "pizza", category: "Питание" },
  { text: "Пекарня", theme: "bakery", category: "Питание" },
  { text: "Бар", theme: "bar", category: "Питание" },
  { text: "Фаст-фуд", theme: "fastfood", category: "Питание" },
  { text: "Доставка еды", theme: "fooddelivery", category: "Питание" },
  
  // IT
  { text: "IT-компания", theme: "it", category: "IT и технологии" },
  { text: "Веб-студия", theme: "it", category: "IT и технологии" },
  { text: "Разработка сайтов", theme: "it", category: "IT и технологии" },
  { text: "Разработка мобильных приложений", theme: "mobile", category: "IT и технологии" },
  { text: "Стартап", theme: "startup", category: "IT и технологии" },
  { text: "SaaS сервис", theme: "saas", category: "IT и технологии" },
  { text: "AI компания", theme: "ai", category: "IT и технологии" },
  { text: "Разработка игр", theme: "gamedev", category: "IT и технологии" },
  { text: "Кибербезопасность", theme: "security", category: "IT и технологии" },
  
  // Красота
  { text: "Салон красоты", theme: "beauty", category: "Красота" },
  { text: "Парикмахерская", theme: "beauty", category: "Красота" },
  { text: "Барбершоп", theme: "barbershop", category: "Красота" },
  { text: "СПА салон", theme: "spa", category: "Красота" },
  { text: "Маникюр и педикюр", theme: "nails", category: "Красота" },
  { text: "Косметология", theme: "cosmetics", category: "Красота" },
  { text: "Студия макияжа", theme: "beauty", category: "Красота" },
  
  // Спорт
  { text: "Фитнес-клуб", theme: "fitness", category: "Спорт" },
  { text: "Тренажерный зал", theme: "fitness", category: "Спорт" },
  { text: "Йога студия", theme: "yoga", category: "Спорт" },
  { text: "Школа единоборств", theme: "martial", category: "Спорт" },
  { text: "Бассейн", theme: "pool", category: "Спорт" },
  { text: "Танцевальная студия", theme: "dance", category: "Спорт" },
  { text: "Персональный тренер", theme: "fitness", category: "Спорт" },
  
  // Медицина
  { text: "Медицинский центр", theme: "medical", category: "Здоровье" },
  { text: "Стоматология", theme: "dental", category: "Здоровье" },
  { text: "Аптека", theme: "pharmacy", category: "Здоровье" },
  { text: "Психолог", theme: "psychology", category: "Здоровье" },
  { text: "Ветеринарная клиника", theme: "veterinary", category: "Здоровье" },
  { text: "Медицинская лаборатория", theme: "laboratory", category: "Здоровье" },
  { text: "Оптика", theme: "optics", category: "Здоровье" },
  
  // Образование
  { text: "Онлайн курсы", theme: "online_courses", category: "Образование" },
  { text: "Языковая школа", theme: "language", category: "Образование" },
  { text: "Репетитор", theme: "tutoring", category: "Образование" },
  { text: "Автошкола", theme: "driving", category: "Образование" },
  { text: "Детский центр", theme: "kids", category: "Образование" },
  { text: "Музыкальная школа", theme: "music_school", category: "Образование" },
  { text: "Художественная школа", theme: "art_school", category: "Образование" },
  
  // Право и финансы
  { text: "Юридические услуги", theme: "legal", category: "Право и финансы" },
  { text: "Адвокат", theme: "legal", category: "Право и финансы" },
  { text: "Нотариус", theme: "legal", category: "Право и финансы" },
  { text: "Бухгалтерские услуги", theme: "accounting", category: "Право и финансы" },
  { text: "Финансовый консалтинг", theme: "finance", category: "Право и финансы" },
  { text: "Страховая компания", theme: "insurance", category: "Право и финансы" },
  { text: "Агентство недвижимости", theme: "realestate", category: "Право и финансы" },
  
  // Строительство
  { text: "Строительная компания", theme: "construction", category: "Строительство" },
  { text: "Ремонт квартир", theme: "renovation", category: "Строительство" },
  { text: "Дизайн интерьера", theme: "interior", category: "Строительство" },
  { text: "Архитектурное бюро", theme: "architecture", category: "Строительство" },
  { text: "Сантехнические услуги", theme: "plumbing", category: "Строительство" },
  { text: "Электромонтаж", theme: "electrical", category: "Строительство" },
  
  // Авто
  { text: "Автосервис", theme: "auto", category: "Авто" },
  { text: "Автомойка", theme: "carwash", category: "Авто" },
  { text: "Шиномонтаж", theme: "tires", category: "Авто" },
  { text: "Детейлинг", theme: "detailing", category: "Авто" },
  { text: "Автосалон", theme: "cardealer", category: "Авто" },
  { text: "Аренда автомобилей", theme: "rental", category: "Авто" },
  
  // Торговля
  { text: "Интернет-магазин", theme: "ecommerce", category: "Торговля" },
  { text: "Магазин одежды", theme: "fashion", category: "Торговля" },
  { text: "Ювелирный магазин", theme: "jewelry", category: "Торговля" },
  { text: "Магазин электроники", theme: "electronics", category: "Торговля" },
  { text: "Мебельный магазин", theme: "furniture", category: "Торговля" },
  { text: "Цветочный магазин", theme: "flowers", category: "Торговля" },
  { text: "Зоомагазин", theme: "pets", category: "Торговля" },
  
  // Туризм
  { text: "Туристическое агентство", theme: "travel", category: "Туризм" },
  { text: "Отель", theme: "hotel", category: "Туризм" },
  { text: "Хостел", theme: "hostel", category: "Туризм" },
  { text: "Экскурсионное бюро", theme: "excursions", category: "Туризм" },
  
  // Развлечения
  { text: "Фотостудия", theme: "photo", category: "Развлечения" },
  { text: "Видеопродакшн", theme: "video", category: "Развлечения" },
  { text: "Организация мероприятий", theme: "events", category: "Развлечения" },
  { text: "Квест комната", theme: "escape", category: "Развлечения" },
  { text: "Игровой клуб", theme: "gaming_club", category: "Развлечения" },
  
  // Медиа
  { text: "Маркетинговое агентство", theme: "marketing", category: "Медиа" },
  { text: "SMM агентство", theme: "smm", category: "Медиа" },
  { text: "SEO продвижение", theme: "seo", category: "Медиа" },
  { text: "Дизайн студия", theme: "design", category: "Медиа" },
  { text: "Брендинговое агентство", theme: "branding", category: "Медиа" },
  
  // Услуги
  { text: "Клининговая компания", theme: "cleaning", category: "Услуги" },
  { text: "Типография", theme: "printing", category: "Услуги" },
  { text: "Ателье", theme: "tailor", category: "Услуги" },
  { text: "Ремонт техники", theme: "repair", category: "Услуги" },
  { text: "Грузоперевозки", theme: "moving", category: "Логистика" },
  { text: "Курьерская служба", theme: "courier", category: "Логистика" },
]

// Get autocomplete suggestions
export function getSuggestions(query: string, limit: number = 5): Suggestion[] {
  if (query.length < 2) return []
  
  const normalized = normalizeText(query)
  const results: Array<Suggestion & { score: number }> = []
  
  for (const suggestion of SUGGESTIONS) {
    const suggestionNorm = normalizeText(suggestion.text)
    let score = 0
    
    // Exact start match (highest priority)
    if (suggestionNorm.startsWith(normalized)) {
      score = 100 - (suggestionNorm.length - normalized.length)
    }
    // Contains match
    else if (suggestionNorm.includes(normalized)) {
      score = 50 - suggestionNorm.indexOf(normalized)
    }
    // Fuzzy match
    else {
      const distance = levenshtein(normalized, suggestionNorm.slice(0, normalized.length))
      if (distance <= 2) {
        score = 30 - distance * 10
      }
    }
    
    if (score > 0) {
      results.push({ ...suggestion, score })
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...rest }) => rest)
}

// Get random examples for typing animation
export function getRandomExamples(count: number = 10): Array<{ text: string; theme: string }> {
  const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(s => ({ text: s.text, theme: s.theme }))
}

// Get theme by key
export function getTheme(key: string): BusinessTheme {
  return BUSINESS_THEMES[key] || BUSINESS_THEMES.default
}

// Get all categories for filtering
export function getAllCategories(): string[] {
  const categories = new Set<string>()
  for (const theme of Object.values(BUSINESS_THEMES)) {
    categories.add(theme.category)
  }
  return Array.from(categories).sort()
}
