# Настройка Ollama на VPS для Nexik

Полная инструкция по развёртыванию self-hosted AI для Nexik.

## Требования к VPS

### Минимальные (для модели 7B)
- **CPU:** 4+ ядер
- **RAM:** 16 GB
- **GPU:** NVIDIA с 16GB VRAM (RTX 4080, A4000, etc.)
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 22.04 LTS

### Рекомендуемые (для модели 32B+)
- **CPU:** 8+ ядер
- **RAM:** 32 GB
- **GPU:** NVIDIA с 24GB+ VRAM (RTX 4090, A5000, A100)
- **Storage:** 100 GB NVMe SSD

### Провайдеры GPU VPS
- [Vast.ai](https://vast.ai) — от $0.20/час за RTX 4090
- [RunPod](https://runpod.io) — от $0.40/час за A100
- [Lambda Labs](https://lambdalabs.com) — от $1.10/час за A100

---

## Установка

### 1. Подключаемся к VPS

```bash
ssh root@your-vps-ip
```

### 2. Устанавливаем NVIDIA драйверы (если GPU)

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем драйверы NVIDIA
apt install -y nvidia-driver-535 nvidia-utils-535

# Перезагружаем
reboot
```

После перезагрузки проверяем:
```bash
nvidia-smi
```

### 3. Устанавливаем Ollama

```bash
# Одной командой
curl -fsSL https://ollama.com/install.sh | sh

# Проверяем
ollama --version
```

### 4. Настраиваем Ollama как сервис

```bash
# Создаём systemd service
cat > /etc/systemd/system/ollama.service << 'EOF'
[Unit]
Description=Ollama AI Server
After=network.target

[Service]
Type=simple
User=root
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Включаем и запускаем
systemctl daemon-reload
systemctl enable ollama
systemctl start ollama

# Проверяем статус
systemctl status ollama
```

### 5. Скачиваем модель

```bash
# Рекомендуемая модель для русского языка
ollama pull qwen2.5:7b

# Или для лучшего качества (нужно 24GB VRAM)
ollama pull qwen2.5:32b

# Или Llama 3.1
ollama pull llama3.1:8b
```

### 6. Проверяем работу

```bash
# Тестовый запрос
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "Привет! Как дела?",
  "stream": false
}'
```

---

## Настройка безопасности

### Вариант 1: Nginx reverse proxy с SSL (рекомендуется)

```bash
# Устанавливаем Nginx и Certbot
apt install -y nginx certbot python3-certbot-nginx

# Создаём конфиг
cat > /etc/nginx/sites-available/ollama << 'EOF'
server {
    listen 80;
    server_name ollama.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:11434;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Для streaming
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        
        # Таймауты для длинных запросов
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Включаем сайт
ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Получаем SSL сертификат
certbot --nginx -d ollama.yourdomain.com
```

### Вариант 2: Firewall с whitelist IP

```bash
# Устанавливаем ufw
apt install -y ufw

# Базовые правила
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443

# Разрешаем Ollama только с IP вашего сервера
ufw allow from YOUR_NEXIK_SERVER_IP to any port 11434

# Включаем
ufw enable
```

### Вариант 3: API ключ через nginx

```bash
# Добавляем в nginx конфиг
location / {
    # Проверка API ключа
    if ($http_authorization != "Bearer YOUR_SECRET_API_KEY") {
        return 401;
    }
    
    proxy_pass http://127.0.0.1:11434;
    # ... остальные настройки
}
```

---

## Настройка Nexik

### 1. Обновляем .env

```bash
# В проекте Nexik
OLLAMA_BASE_URL=https://ollama.yourdomain.com
OLLAMA_MODEL=qwen2.5:7b
```

### 2. Проверяем подключение

Открываем в браузере:
```
https://your-nexik-site/api/ai/status
```

Должны увидеть:
```json
{
  "status": "ok",
  "engine": "ollama",
  "health": {
    "serverOnline": true,
    "modelAvailable": true
  }
}
```

---

## Оптимизация производительности

### Включаем GPU ускорение

```bash
# Проверяем что Ollama видит GPU
ollama ps

# Должно показать использование CUDA
```

### Настройка для высокой нагрузки

```bash
# В /etc/systemd/system/ollama.service добавляем
Environment="OLLAMA_NUM_PARALLEL=4"      # Параллельные запросы
Environment="OLLAMA_MAX_LOADED_MODELS=2" # Моделей в памяти
```

### Мониторинг

```bash
# GPU нагрузка
watch -n 1 nvidia-smi

# Логи Ollama
journalctl -u ollama -f

# Метрики (если нужно)
curl http://localhost:11434/api/ps
```

---

## Troubleshooting

### Ollama не стартует
```bash
# Проверяем логи
journalctl -u ollama -n 100

# Часто помогает
systemctl restart ollama
```

### Модель не загружается
```bash
# Удаляем и скачиваем заново
ollama rm qwen2.5:7b
ollama pull qwen2.5:7b
```

### Out of Memory
```bash
# Переключаемся на меньшую модель
ollama pull qwen2.5:3b

# Или используем квантование
ollama pull qwen2.5:7b-q4_0
```

### Медленные ответы
- Проверьте что GPU используется: `nvidia-smi`
- Уменьшите `num_predict` в запросах
- Используйте меньшую модель

---

## Полезные команды

```bash
# Список моделей
ollama list

# Информация о модели
ollama show qwen2.5:7b

# Удалить модель
ollama rm model-name

# Интерактивный чат для тестов
ollama run qwen2.5:7b

# Перезапуск сервиса
systemctl restart ollama
```
