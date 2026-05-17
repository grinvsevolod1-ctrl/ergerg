# Email рассылки — скрипты и ключи

## Файлы:
- send_signed.py        - отправка одного письма с DKIM
- send_bulk_signed.py   - массовая рассылка с задержками
- mark_formelle_email.html - шаблон письма
- keys/                 - DKIM ключи (vps.private + vps.txt)
- emails.txt            - список получателей (пример)
- msmtprc               - конфиг SMTP (Mail.ru)

## Как запустить:
1. Установить Python: apt install python3
2. Установить dkimpy: pip3 install dkimpy
3. Запустить массовую рассылку:
   python3 send_bulk_signed.py
