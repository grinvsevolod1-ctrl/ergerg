NetNext Project Backup
======================

Файлы:
- source.tar.gz   - исходный код проекта (без node_modules, .next, .env)
- database.sql    - дамп PostgreSQL базы данных

Восстановление:
1. Распаковать source.tar.gz в /var/www/netnext-new
2. Установить зависимости: pnpm install
3. Собрать проект: pnpm build
4. Восстановить БД: psql -U netnext -d netnext < database.sql
5. Запустить: pm2 start ecosystem.config.js

Переменные окружения (.env) нужно настроить заново.
