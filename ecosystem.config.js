module.exports = {
  apps: [{
    name: 'email-worker',
    script: 'scripts/email-worker.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      REDIS_URL: 'redis://localhost:6379',
    }
  }]
}
