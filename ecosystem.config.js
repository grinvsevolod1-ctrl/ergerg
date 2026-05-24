/**
 * PM2 Ecosystem Configuration
 * 
 * IMPORTANT: All secrets are loaded from environment variables.
 * Set them in /var/www/netnext-new/.env or via system environment.
 * 
 * Required environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - REDIS_URL: Redis connection string (default: redis://localhost:6379)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * - DKIM_SELECTOR, DKIM_DOMAIN, DKIM_PRIVATE_KEY_PATH (optional)
 */
module.exports = {
  apps: [
    {
      name: 'netnext',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/netnext-new',
      // Load from .env file - no hardcoded secrets
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        // Defaults only for non-sensitive values
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      }
    },
    {
      name: 'netnext-worker',
      script: 'pnpm',
      args: 'run worker',
      cwd: '/var/www/netnext-new',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      }
    },
    {
      name: 'netnext-bot',
      script: 'venv/bin/python',
      args: 'bot.py',
      cwd: '/var/www/netnext-new/telegram-bot',
      env_file: '.env',
    }
  ]
}
