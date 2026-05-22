module.exports = {
  apps: [
    {
      name: 'netnext',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/netnext-new',
      env: {
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
        DATABASE_URL: 'postgresql://netnext:P1fcAI+RagRQWmE1Oq6Xlg==@localhost:5432/netnext',
        SMTP_HOST: 'smtp.mail.ru',
        SMTP_PORT: '465',
        SMTP_USER: 'hello@netnext.site',
        SMTP_PASS: '8nJPG68mDgr73Kk1Ui1L',
        SMTP_FROM: 'hello@netnext.site',
        DKIM_SELECTOR: 'vps',
        DKIM_DOMAIN: 'netnext.site',
        DKIM_PRIVATE_KEY_PATH: '/etc/opendkim/keys/vps.private'
      }
    },
    {
      name: 'netnext-worker',
      script: 'pnpm',
      args: 'run worker',
      cwd: '/var/www/netnext-new',
      env: {
        NODE_ENV: 'production',
        REDIS_URL: 'redis://localhost:6379',
        DATABASE_URL: 'postgresql://netnext:P1fcAI+RagRQWmE1Oq6Xlg==@localhost:5432/netnext',
        SMTP_HOST: 'smtp.mail.ru',
        SMTP_PORT: '465',
        SMTP_USER: 'hello@netnext.site',
        SMTP_PASS: '8nJPG68mDgr73Kk1Ui1L',
        SMTP_FROM: 'hello@netnext.site',
        DKIM_SELECTOR: 'vps',
        DKIM_DOMAIN: 'netnext.site',
        DKIM_PRIVATE_KEY_PATH: '/etc/opendkim/keys/vps.private'
      }
    },
    {
      name: 'netnext-bot',
      script: 'venv/bin/python',
      args: 'bot.py',
      cwd: '/var/www/netnext-new/telegram-bot'
    }
  ]
}
