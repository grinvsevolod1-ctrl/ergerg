import type { GeneratedSite, ColorScheme } from "./generator-types"
import { colorSchemes } from "./generator-types"

const iconSvgs = {
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  palette: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
  rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  chart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
}

export function generateHTML(site: GeneratedSite): string {
  const colors = colorSchemes[site.colorScheme] || colorSchemes.cyan
  const primaryColor = colors.primary

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${site.businessName} - ${site.tagline}</title>
  <meta name="description" content="${site.description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --primary: ${primaryColor};
      --bg: #0a0a0f;
      --bg-light: rgba(255,255,255,0.02);
      --text: #ffffff;
      --text-muted: rgba(255,255,255,0.6);
      --border: rgba(255,255,255,0.1);
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }
    
    /* Header */
    header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 16px 0;
      background: rgba(10,10,15,0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    
    header .container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
    }
    
    nav a {
      color: var(--text-muted);
      text-decoration: none;
      margin-left: 32px;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    
    nav a:hover { color: var(--text); }
    
    /* Hero */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 120px 24px 80px;
      position: relative;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
      opacity: 0.15;
      filter: blur(80px);
    }
    
    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
    }
    
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9999px;
      background: var(--bg-light);
      border: 1px solid var(--border);
      font-size: 0.875rem;
      margin-bottom: 32px;
    }
    
    .hero-badge::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    h1 {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    
    .hero p {
      font-size: 1.25rem;
      color: var(--text-muted);
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }
    
    .btn-primary {
      background: var(--primary);
      color: #000;
    }
    
    .btn-primary:hover {
      transform: scale(1.05);
    }
    
    .btn-outline {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    
    .btn-outline:hover {
      background: var(--bg-light);
    }
    
    .hero-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    /* Section */
    section {
      padding: 100px 24px;
    }
    
    .section-header {
      text-align: center;
      margin-bottom: 64px;
    }
    
    .section-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 9999px;
      background: var(--bg-light);
      border: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--primary);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    h2 {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      margin-bottom: 16px;
    }
    
    .section-header p {
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }
    
    /* Services */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
    }
    
    .service-card {
      padding: 32px;
      border-radius: 16px;
      background: var(--bg-light);
      border: 1px solid var(--border);
      transition: all 0.3s;
    }
    
    .service-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255,255,255,0.2);
    }
    
    .service-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      color: var(--primary);
    }
    
    .service-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .service-card p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    /* Features */
    .features {
      background: var(--bg-light);
    }
    
    .features-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    }
    
    @media (max-width: 768px) {
      .features-content {
        grid-template-columns: 1fr;
      }
    }
    
    .feature-item {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .feature-check {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 4px;
    }
    
    .feature-check svg {
      width: 14px;
      height: 14px;
      color: #000;
    }
    
    .feature-item h3 {
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .feature-item p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    .features-visual {
      aspect-ratio: 1;
      border-radius: 24px;
      background: linear-gradient(135deg, var(--bg-light), transparent);
      border: 1px solid var(--border);
      position: relative;
      overflow: hidden;
    }
    
    .features-visual::before {
      content: '';
      position: absolute;
      top: 25%;
      left: 25%;
      width: 50%;
      height: 50%;
      background: var(--primary);
      opacity: 0.3;
      border-radius: 16px;
      transform: rotate(12deg);
    }
    
    /* Testimonial */
    .testimonial {
      text-align: center;
    }
    
    .testimonial-card {
      max-width: 700px;
      margin: 0 auto;
      padding: 48px;
      border-radius: 24px;
      background: var(--bg-light);
      border: 1px solid var(--border);
    }
    
    .quote-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 24px;
      color: var(--primary);
      opacity: 0.5;
    }
    
    blockquote {
      font-size: 1.25rem;
      line-height: 1.6;
      margin-bottom: 24px;
      font-style: italic;
    }
    
    .testimonial-author {
      font-weight: 600;
    }
    
    .testimonial-role {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    /* CTA */
    .cta {
      text-align: center;
      padding: 120px 24px;
      position: relative;
    }
    
    .cta::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 400px;
      background: radial-gradient(ellipse at bottom, var(--primary), transparent 70%);
      opacity: 0.1;
    }
    
    .cta-content {
      position: relative;
      z-index: 1;
    }
    
    .cta h2 {
      margin-bottom: 16px;
    }
    
    .cta p {
      color: var(--text-muted);
      margin-bottom: 32px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    
    /* Footer */
    footer {
      padding: 48px 24px;
      border-top: 1px solid var(--border);
      text-align: center;
    }
    
    footer p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    footer a {
      color: var(--primary);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo">${site.businessName}</div>
      <nav>
        <a href="#services">Услуги</a>
        <a href="#features">Преимущества</a>
        <a href="#contact">Контакты</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="hero-content">
      <div class="hero-badge">${site.businessName}</div>
      <h1>${site.hero.headline}</h1>
      <p>${site.hero.subheadline}</p>
      <div class="hero-buttons">
        <a href="#contact" class="btn btn-primary">${site.hero.ctaText} →</a>
        <a href="#services" class="btn btn-outline">Узнать больше</a>
      </div>
    </div>
  </section>

  <section id="services">
    <div class="container">
      <div class="section-header">
        <span class="section-badge">Наши услуги</span>
        <h2>Что мы предлагаем</h2>
        <p>Комплексные решения для вашего бизнеса</p>
      </div>
      <div class="services-grid">
        ${site.services.map(service => `
        <div class="service-card">
          <div class="service-icon">${iconSvgs[service.icon] || iconSvgs.briefcase}</div>
          <h3>${service.title}</h3>
          <p>${service.description}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section id="features" class="features">
    <div class="container">
      <div class="features-content">
        <div>
          <span class="section-badge">Преимущества</span>
          <h2>Почему выбирают нас</h2>
          <p style="color: var(--text-muted); margin-bottom: 32px;">
            Мы предлагаем комплексный подход к решению ваших задач,
            используя современные технологии и многолетний опыт.
          </p>
          ${site.features.map(feature => `
          <div class="feature-item">
            <div class="feature-check">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <h3>${feature.title}</h3>
              <p>${feature.description}</p>
            </div>
          </div>
          `).join('')}
        </div>
        <div class="features-visual"></div>
      </div>
    </div>
  </section>

  <section class="testimonial">
    <div class="container">
      <div class="section-header">
        <span class="section-badge">Отзывы</span>
        <h2>Что говорят клиенты</h2>
      </div>
      <div class="testimonial-card">
        <svg class="quote-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
        </svg>
        <blockquote>"${site.testimonial.quote}"</blockquote>
        <div class="testimonial-author">${site.testimonial.author}</div>
        <div class="testimonial-role">${site.testimonial.role}</div>
      </div>
    </div>
  </section>

  <section id="contact" class="cta">
    <div class="cta-content">
      <span class="section-badge">Начать</span>
      <h2>${site.cta.headline}</h2>
      <p>${site.cta.description}</p>
      <a href="mailto:info@example.com" class="btn btn-primary">${site.cta.buttonText} →</a>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>© ${new Date().getFullYear()} ${site.businessName}. Все права защищены.</p>
      <p style="margin-top: 8px;">Сгенерировано с помощью <a href="https://netnext.ru" target="_blank">NetNext AI</a></p>
    </div>
  </footer>
</body>
</html>`
}

export function downloadHTML(site: GeneratedSite) {
  const html = generateHTML(site)
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement("a")
  a.href = url
  a.download = `${site.businessName.toLowerCase().replace(/\s+/g, '-')}-website.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
