# avari.dev — Main Ecosystem Landing & Portfolio

> Главный портал экосистемы проектов **OstKost** // Fullstack Engineer & Automation Architect.
> Домен: [https://avari.dev](https://avari.dev)

---

## 🚀 О проекте

Репозиторий содержит исходный код витрины экосистемы прикладных сервисов и инструментов:
- **P3.express с MCP** (`p3express.avari.dev`) — минималистичное управление проектами по методологии P3.express с поддержкой Model Context Protocol.
- **Jobs Tracker** (`jobs.avari.dev`) — трекер откликов на вакансии, аналитика воронки и Telegram-уведомления.
- **МыслиВслуХ** (`quiz.ost.wang`) — интерактивный сервис облака слов и голосования в реальном времени.
- **Avari Domains** (`domains.avari.dev`) — управление доменами и DNS через API регистраторов.
- **Avari Links** (`links.avari.dev`) — URL-шортенер и аналитика переходов.
- **AI Assistant** — агентная система интеграции персональных воркфлоу.
- **Dofamine App** (`dofamine.avari.dev`) — витрина и маркетплейс.
- **M1 NAS** (`m1nas.avari.dev`) — панель локального хранилища и медиасерверов.
- **n8n Automation Hub** (`n8n.avari.dev`) — визуальная автоматизация фоновых сценариев.

---

## 📁 Структура проекта

```
avari-dev-main/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions: валидация разметки и SSH-деплой на M0
├── assets/
│   ├── brand/                 # SVG и растровые логотипы, OG-изображения
│   └── icons/                 # Полный набор фавиконов и иконок PWA
├── screenshots/               # WebP-скриншоты проектов (assistant, dofamine, jobs, etc.)
├── deploy/
│   ├── deploy.sh              # Скрипт атомарного развертывания на сервере M0
│   ├── ssh-command.sh         # Ограничивающий SSH-перехватчик (restricted command)
│   └── setup-server.sh        # Однократная инициализация окружения на сервере M0
├── scripts/
│   └── validate.mjs           # Тест-раннер проверки ссылок, ассетов и манифестов
├── index.html                 # Главный лендинг (HTML5 / CSS3 / Vanilla JS)
├── favicon.ico                # Корневой фавикон
├── robots.txt                 # Инструкции поисковых роботов
├── sitemap.xml                # Карта сайта
├── site.webmanifest           # PWA-манифест
├── package.json               # Тестовые скрипты и метаданные
└── LICENSE                    # MIT License
```

---

## 🛠️ Локальная разработка и тестирование

### 1. Запуск валидации
Тест проверяет существование всех скриншотов, иконок, корректность структуры `index.html`, `site.webmanifest` и `sitemap.xml`:
```bash
npm test
```

### 2. Запуск локального веб-сервера
```bash
npm run dev
# Сервер будет доступен по адресу http://localhost:3000
```
или стандартным Python-модулем:
```bash
python3 -m http.server 3000
```

---

## 🔄 CI/CD Архитектура

Деплой реализован по принципу **Zero-Downtime Atomic Deployment**:
1. При каждом пуше в ветку `main` GitHub Actions запускает шаг валидации `npm test` и `bash -n deploy/*.sh`.
2. После успешных тестов поток `git archive --format=tar.gz HEAD` передается по зашифрованному SSH-соединению на мастер-узел **M0** (`176.53.174.118`).
3. SSH-ключ ограничен командой `/usr/local/sbin/avari-site-ssh-command` (`restrict,command=...`), что исключает доступ к шеллу сервера.
4. Скрипт `/usr/local/sbin/avari-site-deploy`:
   - Распаковывает архив в изолированную директорию `/var/www/avari.dev/releases/<SHA>`.
   - Проверяет целостность критических файлов.
   - Атомарно переключает симлинк `/var/www/avari.dev/current`.
   - Проверяет доступность сервиса через `http://127.0.0.1:8080`.
   - Оставляет 5 последних релизов, очищая устаревшие.
5. GitHub Actions верифицирует ответ `https://avari.dev` (HTTP 200 OK).

---

## 📄 Лицензия

MIT License (c) 2026 Konstantin (OstKost).
