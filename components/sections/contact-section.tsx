"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mail, Phone, CheckCircle, ArrowRight, MessageSquare, Briefcase, Rocket, Clock, 
  SendHorizonal, AlertCircle, Palette, FileImage, Zap, Search, Plug, CreditCard,
  Sparkles, X
} from "lucide-react"
import { CreativeIcon, LaunchIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PhoneInput } from "@/components/phone-input"
import { TelegramIcon, WhatsAppIcon, ViberIcon } from "@/components/icons"
import { reachGoal, YM_GOALS, contactMethodGoal } from "@/lib/analytics"

/* ── Business description templates ── */
const businessTemplates: Record<string, (business: string) => string> = {
  // Auto & Transport
  "автосервис": (b) => `Разработка сайта для "${b}".\n\nНеобходимый функционал:\n- Каталог услуг с актуальными ценами\n- Онлайн-запись на обслуживание\n- Галерея работ (до/после)\n- Калькулятор стоимости ремонта\n- Отзывы клиентов с фото\n- Контакты и интерактивная карта\n\nВажно: адаптивность для мобильных, быстрая загрузка, возможная интеграция с CRM.`,
  "шиномонтаж": (b) => `Сайт для "${b}".\n\nЧто нужно:\n- Прайс на шиномонтаж и хранение\n- Онлайн-запись на шиномонтаж\n- Акции на сезонную замену\n- Каталог шин и дисков (если продаёте)\n- Отзывы клиентов\n- Контакты с картой\n\nВажно: мобильная версия для быстрого доступа в пути.`,
  "автомойка": (b) => `Сайт для "${b}".\n\nТребуется:\n- Виды мойки с ценами\n- Онлайн-запись по времени\n- Абонементы и программа лояльности\n- Фото результатов работы\n- Контакты и часы работы`,
  "такси": (b) => `Сервис заказа такси "${b}".\n\nФункционал:\n- Калькулятор стоимости поездки\n- Онлайн-заказ машины\n- Отслеживание автомобиля\n- Личный кабинет клиента\n- История поездок\n- Мобильное приложение`,
  "автошкола": (b) => `Сайт автошколы "${b}".\n\nНужно:\n- Программы обучения и цены\n- Онлайн-запись на курсы\n- Расписание занятий\n- Информация об инструкторах\n- Онлайн-тесты ПДД\n- Отзывы учеников`,
  
  // Food & Restaurants
  "ресторан": (b) => `Сайт ресторана "${b}".\n\nНеобходимо:\n- Красивое меню с фото блюд\n- Онлайн-бронирование столов\n- Заказ доставки/самовывоза\n- Акции и специальные предложения\n- Галерея интерьера\n- Отзывы посетителей\n\nАкцент на аппетитных фото и атмосфере заведения.`,
  "кафе": (b) => `Сайт для "${b}".\n\nФункционал:\n- Меню с ценами и фото\n- Онлайн-заказ еды\n- Информация о заведении\n- Фотогалерея интерьера\n- Контакты и часы работы\n- Отзывы гостей`,
  "кофейня": (b) => `Сайт кофейни "${b}".\n\nЧто нужно:\n- Меню напитков и десертов\n- Карта лояльности\n- Атмосферные фото интерьера\n- История о кофе и обжарке\n- Контакты всех точек\n- Возможно: продажа зерна онлайн`,
  "пекарня": (b) => `Сайт пекарни "${b}".\n\nТребуется:\n- Каталог выпечки с ценами\n- Заказ на определённое время\n- Корпоративные заказы\n- Фото продукции\n- Информация о составе\n- Доставка и самовывоз`,
  "доставка еды": (b) => `Сервис доставки "${b}".\n\nФункционал:\n- Каталог блюд с фильтрами\n- Корзина и оформление заказа\n- Онлайн-оплата\n- Отслеживание курьера\n- Личный кабинет\n- Мобильное приложение`,
  "кейтеринг": (b) => `Сайт кейтеринга "${b}".\n\nНужно:\n- Варианты меню для мероприятий\n- Калькулятор стоимости\n- Портфолио мероприятий\n- Форма заявки на расчёт\n- Отзывы клиентов`,
  
  // Beauty & Health
  "салон красоты": (b) => `Сайт салона "${b}".\n\nФункционал:\n- Онлайн-запись к мастерам\n- Портфолио работ (волосы, ногти, макияж)\n- Прайс-лист всех услуг\n- Профили мастеров\n- Акции и абонементы\n- Отзывы с фото\n\nДизайн: стильный, с акцентом на визуал.`,
  "парикмахерская": (b) => `Сайт "${b}".\n\nЧто нужно:\n- Услуги и цены\n- Онлайн-запись\n- Фото работ мастеров\n- Профили стилистов\n- Контакты и карта`,
  "барбершоп": (b) => `Сайт барбершопа "${b}".\n\nТребуется:\n- Услуги и прайс\n- Онлайн-бронирование\n- Портфолио стрижек\n- Команда барберов\n- Мужской стильный дизайн\n- Продажа косметики`,
  "маникюр": (b) => `Сайт студии "${b}".\n\nФункционал:\n- Виды маникюра/педикюра\n- Онлайн-запись\n- Портфолио дизайнов ногтей\n- Прайс-лист\n- Мастера и их работы`,
  "косметолог": (b) => `Сайт косметолога "${b}".\n\nНужно:\n- Каталог процедур\n- Онлайн-консультация\n- Фото до/после\n- Сертификаты и лицензии\n- Отзывы клиентов\n- Информация о препаратах`,
  "спа": (b) => `Сайт SPA-салона "${b}".\n\nФункционал:\n- Каталог процедур\n- Онлайн-бронирование\n- Подарочные сертификаты\n- Виртуальный тур\n- Релаксирующий дизайн`,
  "массаж": (b) => `Сайт массажного салона "${b}".\n\nТребуется:\n- Виды массажа и цены\n- Онлайн-запись\n- Описание техник\n- Профили массажистов\n- Сертификаты`,
  
  // Medical
  "стоматология": (b) => `Сайт стоматологии "${b}".\n\nТребования:\n- Все виды услуг с ценами\n- Онлайн-запись к врачу\n- Профили стоматологов\n- Фото работ (до/после)\n- 3D-тур по клинике\n- Рассрочка и кредит\n\nВажно: вызывать доверие, показать экспертность.`,
  "клиника": (b) => `Сайт клиники "${b}".\n\nФункционал:\n- Расписание приёма врачей\n- Онлайн-запись на приём\n- Информация о специалистах\n- Описание услуг и цены\n- Подготовка к процедурам\n- Результаты анализов онлайн\n\nВажно: доверие, экспертность.`,
  "аптека": (b) => `Интернет-аптека "${b}".\n\nНужно:\n- Каталог лекарств с поиском\n- Проверка наличия\n- Бронирование товаров\n- Доставка/самовывоз\n- Акции и программа лояльности`,
  "ветеринар": (b) => `Сайт ветклиники "${b}".\n\nФункционал:\n- Услуги и цены\n- Онлайн-запись\n- Вызов врача на дом\n- Профили ветеринаров\n- Советы по уходу за питомцами`,
  "психолог": (b) => `Сайт психолога "${b}".\n\nТребуется:\n- Направления работы\n- Онлайн-запись на консультацию\n- Формат работы (онлайн/офлайн)\n- Образование и сертификаты\n- Отзывы клиентов`,
  
  // Fitness & Sports
  "фитнес": (b) => `Сайт фитнес-клуба "${b}".\n\nНужно:\n- Расписание тренировок\n- Онлайн-запись на занятия\n- Абонементы и цены\n- Профили тренеров\n- Галерея зала\n- Личный кабинет клиента\n\nВозможно: мобильное приложение.`,
  "тренажёрный зал": (b) => `Сайт "${b}".\n\nФункционал:\n- Абонементы и цены\n- Виртуальный тур по залу\n- Персональные тренировки\n- Расписание групповых\n- Акции для новичков`,
  "йога": (b) => `Сайт студии йоги "${b}".\n\nНужно:\n- Расписание занятий\n- Виды йоги и уровни\n- Онлайн-запись\n- Профили инструкторов\n- Онлайн-занятия`,
  "бассейн": (b) => `Сайт бассейна "${b}".\n\nТребуется:\n- Расписание сеансов\n- Абонементы и разовые\n- Секции и обучение\n- Правила посещения\n- Онлайн-бронирование`,
  "танцы": (b) => `Сайт танцевальной студии "${b}".\n\nФункционал:\n- Направления танцев\n- Расписание групп\n- Онлайн-запись\n- Видео выступлений\n- Преподаватели`,
  
  // Education
  "школа": (b) => `Сайт школы "${b}".\n\nТребуется:\n- Информация об обучении\n- Расписание занятий\n- Новости и мероприятия\n- Контакты учителей\n- Личный кабинет родителя`,
  "курсы": (b) => `Образовательный портал "${b}".\n\nФункционал:\n- Каталог курсов/программ\n- Онлайн-запись и оплата\n- Личный кабинет ученика\n- Расписание занятий\n- Материалы и домашние задания\n- Сертификаты`,
  "репетитор": (b) => `Сайт репетитора "${b}".\n\nНужно:\n- Предметы и цены\n- Онлайн-запись на урок\n- Отзывы учеников\n- Образование и опыт\n- Онлайн-занятия`,
  "детский центр": (b) => `Сайт детского центра "${b}".\n\nФункционал:\n- Программы для разных возрастов\n- Расписание занятий\n- Онлайн-запись\n- Педагоги\n- Фотогалерея\n- Отзывы родителей`,
  // E-commerce
  "интернет-магазин": (b) => `Интернет-магазин "${b}".\n\nНеобходимо:\n- Каталог с фильтрами и поиском\n- Корзина и оформление заказа\n- Онлайн-оплата (карты, СБП)\n- Личный кабинет покупателя\n- Отслеживание доставки\n- Отзывы и рейтинги товаров\n\nИнтеграции: 1С, CRM, службы доставки.`,
  "магазин одежды": (b) => `Интернет-магазин одежды "${b}".\n\nФункционал:\n- Каталог с размерами и фильтрами\n- Таблица размеров\n- Wishlist и сравнение\n- Примерочная (AR)\n- Быстрый заказ`,
  "магазин электроники": (b) => `Магазин электроники "${b}".\n\nНужно:\n- Каталог с характеристиками\n- Сравнение товаров\n- Кредит/рассрочка\n- Гарантия и сервис\n- Интеграция с 1С`,
  
  // Real Estate
  "недвижимость": (b) => `Сайт агентства "${b}".\n\nФункционал:\n- Каталог объектов с фильтрами\n- Интерактивная ��арта\n- 3D-туры и планировки\n- Калькулятор ипотеки\n- Заявка на просмотр\n- CRM для риелторов`,
  "застройщик": (b) => `Сайт застройщика "${b}".\n\nТребуется:\n- Каталог ЖК и квартир\n- Планировки и цены\n- Ход строительства\n- Калькулятор ипотеки\n- 3D-визуализация\n- Бронирование онлайн`,
  "аренда": (b) => `Сервис аренды "${b}".\n\nФункционал:\n- Каталог объектов\n- Фильтры и карта\n- Онлайн-бронирование\n- Отзывы арендаторов\n- Личный кабинет`,
  
  // Services
  "юрист": (b) => `Сайт юриста "${b}".\n\nТребования:\n- Описание услуг по категориям\n- Профили юристов с опытом\n- Онлайн-консультация\n- Калькулятор стоимости\n- Кейсы и результаты\n- Блог с правовыми статьями\n\nДизайн: солидный, вызывающий доверие.`,
  "бухгалтер": (b) => `Сайт бухгалтерских услуг "${b}".\n\nНужно:\n- Услуги и тарифы\n- Калькулятор налогов\n- Онлайн-консультация\n- Кейсы клиентов\n- Документы онлайн`,
  "нотариус": (b) => `Сайт нотариуса "${b}".\n\nФункционал:\n- Список услуг\n- Документы и требования\n- Онлайн-запись\n- Стоимость услуг\n- Контакты и часы работы`,
  "страхование": (b) => `Сайт страхования "${b}".\n\nТребуется:\n- Виды страхования\n- Онлайн-калькулятор\n- Оформление полиса онлайн\n- Личный кабинет\n- Подача заявления о страховом случае`,
  
  // IT & Tech
  "it-компания": (b) => `Сайт IT-компании "${b}".\n\nФункционал:\n- Портфолио проектов\n- Описание технологий и стека\n- Команда и экспертиза\n- Блог с техническими статьями\n- Форма заявки на проект\n- Интеграция с GitHub\n\nДизайн: современный, технологичный.`,
  "стартап": (b) => `Лендинг для стартапа "${b}".\n\nНужно:\n- Описание продукта\n- Преимущества и фичи\n- Демо/видео\n- Цены и тарифы\n- Форма регистрации\n- Инвесторам`,
  "saas": (b) => `Сайт SaaS-продукта "${b}".\n\nТребуется:\n- Описание возможностей\n- Тарифы и цены\n- Демо и free trial\n- Интеграции\n- База знаний\n- Личный кабинет`,
  
  // Construction
  "строительство": (b) => `Сайт строительной компании "${b}".\n\nНеобходимо:\n- Каталог услуг и работ\n- Портфолио объектов с фото\n- Калькулятор стоимости\n- Этапы сотрудничества\n- Сертификаты и лицензии\n- Отзывы заказчиков`,
  "ремонт квартир": (b) => `Сайт "${b}".\n\nФункционал:\n- Виды ремонта\n- Портфолио до/после\n- Калькулятор стоимости\n- Этапы работы\n- Гарантии\n- Отзывы`,
  "дизайн интерьера": (b) => `Сайт дизайн-студии "${b}".\n\nНужно:\n- Портфолио проектов\n- Услуги и цены\n- Процесс работы\n- 3D-визуализации\n- Профили дизайнеров`,
  "мебель": (b) => `Сайт мебельной компании "${b}".\n\nТребуется:\n- Каталог мебели\n- 3D-конфигуратор\n- Заказ по размерам\n- Портфолио работ\n- Доставка и сборка`,
  "окна": (b) => `Сайт оконной компании "${b}".\n\nФункционал:\n- Виды окон\n- Калькулятор стоимости\n- Онлайн-заявка на замер\n- Портфолио объектов\n- Акции`,
  
  // Travel & Tourism  
  "турагентство": (b) => `Сайт турагентства "${b}".\n\nФункционал:\n- Каталог туров с фильтрами\n- Онлайн-бронирование\n- Горящие предложения\n- Визовая поддержка\n- Отзывы туристов\n- Блог о путешествиях`,
  "отель": (b) => `Сайт отеля "${b}".\n\nНужно:\n- Номерной фонд\n- Онлайн-бронирование\n- Виртуальный тур\n- Услуги и рестораны\n- Спецпредложения\n- Отзывы гостей`,
  "хостел": (b) => `Сайт хостела "${b}".\n\nТребуется:\n- Типы размещения\n- Онлайн-бронирование\n- Фото и виртуальный тур\n- Отзывы\n- Достопримечательности рядом`,
  
  // Events & Entertainment
  "фотограф": (b) => `Портфолио фотографа "${b}".\n\nНужно:\n- Галерея работ по категориям\n- Услуги и цены\n- Онлайн-бронирование\n- Информация о фотографе\n- Отзывы клиентов`,
  "видеограф": (b) => `Сайт видеографа "${b}".\n\nФункционал:\n- Портфолио видеоработ\n- Услуги и пакеты\n- Showreel\n- Процесс работы\n- Контакты`,
  "организация праздников": (b) => `Сайт event-агентства "${b}".\n\nТребуется:\n- Виды мероприятий\n- Портфолио\n- Калькулятор бюджета\n- Команда\n- Отзывы клиентов`,
  "ведущий": (b) => `Сайт ведущего "${b}".\n\nНужно:\n- Видео с мероприятий\n- Услуги и цены\n- Программы\n- Отзывы\n- Бронирование даты`,
  
  // Default for any business
  "default": (b) => `Разработка современного сайта для "${b}".\n\nЧто нужно:\n- Продающий дизайн\n- Адаптивная вёрстка\n- Формы обратной связи\n- SEO-оптимизация\n- Быстрая загрузка\n- Интеграция с CRM/аналитикой\n\nОткрыт к обсуждению деталей и дополнительного функционала.`
}

// Find best matching template
function getBusinessDescription(business: string): string {
  const normalized = business.toLowerCase().trim()
  
  // Direct match
  if (businessTemplates[normalized]) {
    return businessTemplates[normalized](business)
  }
  
  // Partial match
  for (const [key, template] of Object.entries(businessTemplates)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return template(business)
    }
  }
  
  // Keyword matching
  const keywords: Record<string, string[]> = {
    "автосервис": ["авто", "машин", "ремонт авто", "сто", "техобслуживание"],
    "шиномонтаж": ["шин", "колёс", "колес", "резин"],
    "ресторан": ["еда", "кухн", "блюд", "обед", "ужин"],
    "кафе": ["кофе", "выпечк", "десерт"],
    "салон красоты": ["красот", "стилист", "визаж", "брови", "ресниц"],
    "стоматология": ["стомат", "зуб", "дент"],
    "фитнес": ["фитнес", "трениров", "спорт", "зал"],
    "интернет-магазин": ["магазин", "товар", "продаж", "shop", "store"],
    "юрист": ["юрид", "адвокат", "право"],
    "строительство": ["строй", "ремонт", "отделк"],
    "it-компания": ["программ", "разработ", "софт", "digital"],
  }
  
  for (const [templateKey, words] of Object.entries(keywords)) {
    if (words.some(word => normalized.includes(word))) {
      return businessTemplates[templateKey](business)
    }
  }
  
  return businessTemplates["default"](business)
}

/* ── Quick action chips ── */
const quickActions = [
  { id: "design", label: "Нужен дизайн", icon: Palette, text: "\n\nДополнительно: нужен уникальный дизайн с нуля.", color: "#ec4899" },
  { id: "figma", label: "Есть макеты", icon: FileImage, text: "\n\nДополнительно: есть готовые макеты в Figma.", color: "#3b82f6" },
  { id: "urgent", label: "Срочно", icon: Zap, text: "\n\nДополнительно: проект срочный, нужно быстро!", color: "#f59e0b" },
  { id: "seo", label: "SEO важно", icon: Search, text: "\n\nДополнительно: важна SEO-оптимизация с первого дня.", color: "#10b981" },
  { id: "crm", label: "CRM интеграция", icon: Plug, text: "\n\nДополнительно: нужна интеграция с CRM (Bitrix/AmoCRM).", color: "#8b5cf6" },
  { id: "payment", label: "Онлайн-оплата", icon: CreditCard, text: "\n\nДополнительно: подключение онлайн-оплаты обязательно.", color: "#06b6d4" },
]

/* ── Contact data ── */
const contactCards = [
  { icon: Phone, label: "Телефон", value: "+375 (29) 14-14-555", href: "tel:+375291414555", color: "#22c55e" },
  { icon: Mail, label: "Email", value: "hello@netnext.site", href: "mailto:hello@netnext.site", color: "#14b8a6" },
]

const messengerLinks = [
  { icon: TelegramIcon, label: "Telegram", href: "https://t.me/netnextadminbot", color: "#0088cc" },
  { icon: WhatsAppIcon, label: "WhatsApp", href: "https://wa.me/375291414555", color: "#25D366" },
  { icon: ViberIcon, label: "Viber", href: "viber://chat?number=%2B375291414555", color: "#7360F2" },
]

const projectTypes = [
  { id: "website", label: "Сайт", icon: MessageSquare },
  { id: "app", label: "Приложение", icon: Rocket },
  { id: "design", label: "Дизайн", icon: CreativeIcon },
  { id: "other", label: "Другое", icon: Briefcase },
]

const budgetRanges = [
  { id: "small", label: "до 3 000 Br" },
  { id: "medium", label: "3 000 - 10 000 Br" },
  { id: "large", label: "10 000 - 30 000 Br" },
  { id: "enterprise", label: "30 000+ Br" },
]

type ContactMethod = "email" | "telegram" | "phone"

const contactMethods = [
  { id: "email" as ContactMethod, label: "Email", icon: Mail, color: "#14b8a6", hint: "На почту" },
  { id: "telegram" as ContactMethod, label: "Telegram", icon: TelegramIcon, color: "#0088cc", hint: "В мессенджер" },
  { id: "phone" as ContactMethod, label: "Телефон", icon: Phone, color: "#22c55e", hint: "Перезвоним" },
]

/* ── Validation helpers ── */
function validateEmail(email: string): string | null {
  if (!email) return "Введите email"
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!re.test(email)) return "Некорректный фор��ат email"
  const domainPart = email.split("@")[1]?.split(".").pop()
  if (!email.includes(".") || !domainPart || domainPart.length < 2) return "Проверьте домен email"
  return null
}

function validateTelegram(value: string): string | null {
  if (!value) return "Введите ник или номер телефона"
  if (value.startsWith("@")) {
    const username = value.slice(1)
    if (username.length < 5) return "Минимум 5 символов после @"
    if (username.length > 32) return "Максимум 32 символа"
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Только латиница, цифры и _"
    return null
  }
  const digits = value.replace(/\D/g, "")
  if (digits.length >= 7 && digits.length <= 15) return null
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)) return "Добавьте @ перед ником"
  return "Введите @username или номер телефона"
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "")
  if (digits.length < 7) return "Слишком короткий номер"
  if (digits.length > 15) return "Слишком длинный номер"
  return null
}

export function ContactSection() {
  const [step, setStep] = useState(1)
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email")
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    telegram: "",
    phone: "",
    projectType: "",
    budget: "",
    message: "",
  })
  const [fromStartWidget, setFromStartWidget] = useState(false)
  const [businessFromWidget, setBusinessFromWidget] = useState("")
  const [activeQuickActions, setActiveQuickActions] = useState<string[]>([])

  // Check for data from StartProjectSection
  useEffect(() => {
    try {
      const projectBusiness = sessionStorage.getItem("projectBusiness")
      const projectSource = sessionStorage.getItem("projectSource")
      
      if (projectBusiness && projectSource === "start-widget") {
        const description = getBusinessDescription(projectBusiness)
        setFormState(prev => ({
          ...prev,
          projectType: "website",
          message: description,
        }))
        setFromStartWidget(true)
        setBusinessFromWidget(projectBusiness)
        setStep(1) // Stay on step 1 to select budget
        
        // Clear sessionStorage after use
        sessionStorage.removeItem("projectBusiness")
        sessionStorage.removeItem("projectSource")
      }
      
      // Also check for old generator data
      const generatorData = sessionStorage.getItem("generatorUserData")
      if (generatorData) {
        const data = JSON.parse(generatorData)
        setFormState(prev => ({
          ...prev,
          name: data.companyName || prev.name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          projectType: "website",
          message: data.description 
            ? `${data.description}\n\nХочу сайт как превью для ниши "${data.niche}"`
            : `Хочу сайт как превью для ниши "${data.niche}"`,
        }))
        setFromStartWidget(true)
        setStep(2)
        sessionStorage.removeItem("generatorUserData")
      }
    } catch {
      // Ignore parsing errors
    }
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const validateField = (field: string, value: string) => {
    let err: string | null = null
    if (field === "email") err = validateEmail(value)
    if (field === "telegram") err = validateTelegram(value)
    if (field === "phone") err = validatePhone(value)
    if (field === "name" && !value.trim()) err = "Введите ваше имя"
    setErrors(prev => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
    return err
  }

  const handleBlur = (field: string) => {
    setFocusedField(null)
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formState[field as keyof typeof formState]
    validateField(field, value)
  }

  const getContactValue = () => {
    if (contactMethod === "email") return formState.email
    if (contactMethod === "telegram") return formState.telegram
    return formState.phone
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formState.name.trim()) newErrors.name = "Введите ваше имя"
    
    if (contactMethod === "email") {
      const e = validateEmail(formState.email)
      if (e) newErrors.email = e
    } else if (contactMethod === "telegram") {
      const e = validateTelegram(formState.telegram)
      if (e) newErrors.telegram = e
    } else {
      const e = validatePhone(formState.phone)
      if (e) newErrors.phone = e
    }

    if (!formState.message.trim()) newErrors.message = "Расскажите о проекте"
    setErrors(newErrors)
    setTouched({ name: true, email: true, telegram: true, phone: true, message: true })
    return Object.keys(newErrors).length === 0
  }

  const handleQuickAction = useCallback((action: typeof quickActions[0]) => {
    if (activeQuickActions.includes(action.id)) {
      // Remove action
      setActiveQuickActions(prev => prev.filter(id => id !== action.id))
      setFormState(prev => ({
        ...prev,
        message: prev.message.replace(action.text, "")
      }))
    } else {
      // Add action
      setActiveQuickActions(prev => [...prev, action.id])
      setFormState(prev => ({
        ...prev,
        message: prev.message + action.text
      }))
      // Animate textarea
      if (textareaRef.current) {
        textareaRef.current.classList.add("ring-2", "ring-primary/50")
        setTimeout(() => {
          textareaRef.current?.classList.remove("ring-2", "ring-primary/50")
        }, 500)
      }
    }
  }, [activeQuickActions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const contactValue = getContactValue()
      
      const leadPayload = {
        companyName: formState.name,
        phone: contactMethod === "phone" ? contactValue : "",
        email: contactMethod === "email" ? contactValue : "",
        telegram: contactMethod === "telegram" ? contactValue : "",
        contactMethod,
        projectType: formState.projectType,
        budget: formState.budget,
        description: formState.message,
        source: fromStartWidget ? "start_widget" : "contact_form",
        businessFromWidget: businessFromWidget || undefined,
        consentGiven: true,
      }

      await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      }).catch(() => {})

      const telegramPayload = {
        type: "contact_form",
        data: {
          name: formState.name,
          contactMethod,
          contactValue,
          projectType: formState.projectType,
          budget: formState.budget,
          message: formState.message,
          source: fromStartWidget ? "start_widget" : "direct",
        },
      }

      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramPayload),
      })

      if (contactMethod === "email" && formState.email) {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formState.email,
            name: formState.name,
            projectType: formState.projectType,
          }),
        }).catch(() => {})
      }
    } catch {
      // silent fail
    }

    // Conversion goals: form submitted + which contact method was used.
    reachGoal(YM_GOALS.trustForm, { source: fromStartWidget ? 'start_widget' : 'contact_form' })
    reachGoal(contactMethodGoal(contactMethod))

    setIsSubmitted(true)
    setIsLoading(false)
    setFormState({ name: "", email: "", telegram: "", phone: "", projectType: "", budget: "", message: "" })
    setErrors({})
    setTouched({})
    setStep(1)
    setFromStartWidget(false)
    setBusinessFromWidget("")
    setActiveQuickActions([])
    setTimeout(() => setIsSubmitted(false), 6000)
  }

  const canProceedToStep2 = formState.projectType && formState.budget
  const canSubmit = formState.name && getContactValue() && formState.message

  return (
    <section id="contact" className="min-h-screen py-16 sm:py-20 md:py-28 lg:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 md:w-80 h-64 md:h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 md:w-96 h-80 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <LaunchIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary text-xs font-medium tracking-wide">Начните проект</span>
          </div>
          <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-balance tracking-tight">
            Давайте создадим что-то{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              невероятное
            </span>
          </h2>
          <p className="text-muted-foreground text-[15px] md:text-lg leading-relaxed max-w-lg mx-auto">
            Расскажите о вашем проекте, и мы превратим вашу идею в реальность.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="space-y-3">
              {contactCards.map((item, index) => {
                const Icon = item.icon
                return (
                  <a 
                    key={item.label} 
                    href={item.href}
                    onClick={() => reachGoal(YM_GOALS.clickContactInfo, { channel: item.label })}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground block mb-0.5">{item.label}</span>
                      <p className="text-foreground font-medium text-sm md:text-base group-hover:text-primary transition-colors truncate">
                        {item.value}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all flex-shrink-0" />
                  </a>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {messengerLinks.map((m) => {
                const Icon = m.icon
                return (
                  <a 
                    key={m.label} 
                    href={m.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => reachGoal(YM_GOALS.clickMessenger, { messenger: m.label })}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 hover:border-opacity-50 transition-all duration-300 hover:shadow-lg group"
                    style={{ borderColor: `${m.color}30` }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${m.color}15`, color: m.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium" style={{ color: m.color }}>{m.label}</span>
                  </a>
                )
              })}
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Работаем 24/7</h4>
                  <p className="text-xs text-muted-foreground">Ответим в течение 2 часов</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                  <div key={day} className="flex-1 text-center py-1.5 rounded-lg bg-primary/10 text-xs text-primary font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <div className="relative w-1.5 h-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-50" />
                </div>
                <span className="text-[11px] text-green-500 font-medium">Всегда на связи</span>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/50 relative overflow-hidden">
              {/* From widget badge */}
              <AnimatePresence>
                {fromStartWidget && businessFromWidget && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary font-medium">
                        Проект: {businessFromWidget}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFromStartWidget(false)
                        setBusinessFromWidget("")
                        setFormState(prev => ({ ...prev, message: "" }))
                      }}
                      className="p-1 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-primary" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300",
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>1</div>
                <div className={cn("flex-1 h-1 rounded-full transition-all duration-500", step >= 2 ? "bg-primary" : "bg-secondary")} />
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300",
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>2</div>
              </div>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4 relative">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Заявка отправлена!</h3>
                  <p className="text-muted-foreground mb-2">
                    {contactMethod === "email" 
                      ? "Письмо-подтверждение отправлено на ваш email."
                      : contactMethod === "telegram"
                      ? "Мы свяжемся с вами в Telegram."
                      : "Мы перезвоним вам в ближайшее время."}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Среднее время ответа: 2 часа</span>
                  </div>
                </motion.div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit}>
                  {/* Step 1 */}
                  <div className={cn("space-y-6 transition-all duration-300", step === 1 ? "block" : "hidden")}>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Тип проекта</label>
                      <div className="grid grid-cols-2 gap-3">
                        {projectTypes.map((type) => {
                          const Icon = type.icon
                          const isSelected = formState.projectType === type.id
                          return (
                            <button 
                              key={type.id} 
                              type="button"
                              onClick={() => setFormState({ ...formState, projectType: type.id })}
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                isSelected 
                                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" 
                                  : "border-border hover:border-primary/50 bg-background/50"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>
                                {type.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Примерный бюджет</label>
                      <div className="grid grid-cols-2 gap-2">
                        {budgetRanges.map((range) => {
                          const isSelected = formState.budget === range.id
                          return (
                            <button 
                              key={range.id} 
                              type="button"
                              onClick={() => setFormState({ ...formState, budget: range.id })}
                              className={cn(
                                "py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                                isSelected 
                                  ? "border-primary bg-primary/10 text-primary" 
                                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {range.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={() => setStep(2)} 
                      disabled={!canProceedToStep2} 
                      className="w-full h-12 text-base"
                    >
                      Продолжить
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* Step 2 */}
                  <div className={cn("space-y-5 transition-all duration-300", step === 2 ? "block" : "hidden")}>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Назад
                    </button>

                    {/* Contact method selector */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Как с вами связаться?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {contactMethods.map((method) => {
                          const Icon = method.icon
                          const isSelected = contactMethod === method.id
                          return (
                            <button 
                              key={method.id} 
                              type="button"
                              onClick={() => setContactMethod(method.id)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                                isSelected
                                  ? "border-current shadow-lg"
                                  : "border-border hover:border-current/30"
                              )}
                              style={isSelected ? { borderColor: method.color, backgroundColor: `${method.color}10` } : undefined}
                            >
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${method.color}15`, color: method.color }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={cn("text-xs font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                                {method.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground hidden sm:block">{method.hint}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="relative">
                      <label className={cn(
                        "absolute left-3 transition-all duration-200 pointer-events-none z-10",
                        focusedField === "name" || formState.name 
                          ? "-top-2 text-xs bg-card px-1 text-primary" 
                          : "top-3 text-sm text-muted-foreground"
                      )}>Ваше имя</label>
                      <Input
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => handleBlur("name")}
                        className={cn(
                          "h-12 bg-background/50 border-2 transition-all duration-200",
                          touched.name && errors.name ? "border-red-500" : focusedField === "name" ? "border-primary" : "border-border"
                        )}
                      />
                      {touched.name && errors.name && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.name}
                        </p>
                      )}
                    </div>

                    {/* Dynamic contact field */}
                    {contactMethod === "email" && (
                      <div className="relative">
                        <label className={cn(
                          "absolute left-3 transition-all duration-200 pointer-events-none z-10",
                          focusedField === "email" || formState.email 
                            ? "-top-2 text-xs bg-card px-1 text-primary" 
                            : "top-3 text-sm text-muted-foreground"
                        )}>Email</label>
                        <Input
                          type="email"
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => handleBlur("email")}
                          className={cn(
                            "h-12 bg-background/50 border-2 transition-all duration-200",
                            touched.email && errors.email ? "border-red-500" : focusedField === "email" ? "border-primary" : "border-border"
                          )}
                        />
                        {formState.email && !errors.email && touched.email && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {touched.email && errors.email && (
                          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{errors.email}
                          </p>
                        )}
                      </div>
                    )}

                    {contactMethod === "telegram" && (
                      <div className="relative">
                        <label className={cn(
                          "absolute transition-all duration-200 pointer-events-none z-10",
                          focusedField === "telegram" || formState.telegram 
                            ? "left-3 -top-2 text-xs bg-card px-1" 
                            : "left-11 top-3 text-sm text-muted-foreground"
                        )} style={focusedField === "telegram" || formState.telegram ? { color: "#0088cc" } : undefined}>
                          {focusedField === "telegram" || formState.telegram ? "Telegram" : "@username или номер"}
                        </label>
                        <div className="relative">
                          <Input
                            value={formState.telegram}
                            onChange={(e) => setFormState({ ...formState, telegram: e.target.value })}
                            onFocus={() => setFocusedField("telegram")}
                            onBlur={() => handleBlur("telegram")}
                            className={cn(
                              "h-12 bg-background/50 border-2 transition-all duration-200 pl-11",
                              touched.telegram && errors.telegram ? "border-red-500" : focusedField === "telegram" ? "border-[#0088cc]" : "border-border"
                            )}
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <TelegramIcon className="w-5 h-5 text-[#0088cc]" />
                          </div>
                          {formState.telegram && !errors.telegram && touched.telegram && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {touched.telegram && errors.telegram && (
                          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{errors.telegram}
                          </p>
                        )}
                        {focusedField === "telegram" && !errors.telegram && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Введите @username или номер телефона
                          </p>
                        )}
                      </div>
                    )}

                    {contactMethod === "phone" && (
                      <div>
                        <PhoneInput
                          value={formState.phone}
                          onChange={(val) => setFormState({ ...formState, phone: val })}
                          error={touched.phone ? errors.phone : undefined}
                        />
                      </div>
                    )}

                    {/* Message with quick actions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-foreground">Расскажите о проекте</label>
                      </div>
                      
                      {/* Quick action chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {quickActions.map((action) => {
                          const Icon = action.icon
                          const isActive = activeQuickActions.includes(action.id)
                          return (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => handleQuickAction(action)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                                "border transition-all duration-200",
                                isActive
                                  ? "border-current shadow-sm"
                                  : "border-border hover:border-current/50 text-muted-foreground hover:text-foreground"
                              )}
                              style={isActive ? { borderColor: action.color, backgroundColor: `${action.color}10`, color: action.color } : undefined}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {action.label}
                              {isActive && <X className="w-3 h-3 ml-0.5" />}
                            </button>
                          )
                        })}
                      </div>
                      
                      <div className="relative">
                        <Textarea
                          ref={textareaRef}
                          value={formState.message}
                          onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                          onFocus={() => setFocusedField("message")}
                          onBlur={() => handleBlur("message")}
                          rows={5}
                          placeholder="Опишите ваш проект, цели и пожелания..."
                          className={cn(
                            "bg-background/50 border-2 resize-none transition-all duration-200",
                            touched.message && errors.message ? "border-red-500" : focusedField === "message" ? "border-primary" : "border-border"
                          )}
                        />
                        {touched.message && errors.message && (
                          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{errors.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base relative overflow-hidden group"
                      disabled={isLoading || !canSubmit}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Отправляем...
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 group-hover:-translate-y-10 transition-transform duration-300">
                            <SendHorizonal className="w-4 h-4" />
                            Отправить заявку
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center gap-2 translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                            <Rocket className="w-4 h-4" />
                            Поехали!
                          </span>
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Нажимая кнопку, вы соглашаетесь с{" "}
                      <a href="/privacy" className="text-primary hover:underline">политикой конфиденциальности</a>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
