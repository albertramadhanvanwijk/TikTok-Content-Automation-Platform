# Quick Start Guide - Local Development

**Last Updated:** September 25, 2026

---

## 🚀 Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 15+ (for database)
- Redis 7+ (optional, for caching)

---

## 📋 Setup Instructions

### 1. Backend Setup

```bash
# Navigate to project root
cd TikTok-Content-Automation-Platform

# Install dependencies
npm install --legacy-peer-deps

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your local config
# Important: Make sure DB_HOST, DB_USER, DB_PASSWORD are correct
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb tiktok_carousel_dev

# Run migrations (if available)
npm run migrate

# Or manually run SQL:
psql -U postgres -d tiktok_carousel_dev -f src/database/migrations/*.sql
```

### 3. Start Backend

```bash
# Development mode (with ts-node)
npm run dev

# Or build and run
npm run build
npm start
```

Expected output:
```
Server running on port 3000
```

### 4. Frontend Setup (in another terminal)

```bash
# Navigate to frontend
cd apps/frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env.local
cp .env.example .env.local

# Start dev server
npm run dev
```

Expected output:
```
> ready - started server on 0.0.0.0:3001
```

### 5. Access the Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **API Health Check:** http://localhost:3000/health

---

## 🧪 Testing the Application

### Backend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test
npm test -- src/__tests__/authService.test.ts
```

### API Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Get profile (with JWT token)
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create carousel
curl -X POST http://localhost:3000/content/carousels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Carousel",
    "description": "Testing carousel creation",
    "style": "professional"
  }'

# Get carousels
curl -X GET http://localhost:3000/content/carousels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Manual Testing

1. **Registration**
   - Navigate to http://localhost:3001/register
   - Fill in email, username, password
   - Click register
   - Should redirect to login

2. **Login**
   - Enter credentials from registration
   - Click login
   - Should redirect to dashboard

3. **Create Carousel**
   - Click "New Carousel" button
   - Fill in title and description
   - Add slides
   - Click save

4. **View Analytics**
   - Navigate to Analytics section
   - View dashboard metrics
   - Check carousel performance

---

## 🔧 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tiktok_carousel_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRE=7d

# External APIs (optional for testing)
NOTION_API_KEY=
OPENAI_API_KEY=
TIKTOK_API_KEY=
TELEGRAM_BOT_TOKEN=

# Logging
LOG_LEVEL=debug
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## 📊 Available Commands

### Backend

```bash
npm run dev              # Start dev server
npm run build           # Build TypeScript
npm start               # Run production build
npm test                # Run tests
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode
npm run lint            # Lint code
npm run format          # Format code
```

### Frontend

```bash
cd apps/frontend

npm run dev             # Start dev server
npm run build           # Build for production
npm start               # Start production server
npm test                # Run tests
npm run lint            # Lint code
npm run type-check      # TypeScript check
```

---

## 🐛 Troubleshooting

### "Cannot find module 'typescript'"
```bash
npm install --save-dev typescript ts-node @types/node
```

### "Database connection refused"
```bash
# Check PostgreSQL is running
psql -U postgres -d postgres -c "SELECT 1"

# Create database if not exists
createdb tiktok_carousel_dev
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### "Redis connection refused"
```bash
# Redis is optional, but if needed, start it:
redis-server

# Or disable Redis in code if not needed
```

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
```

---

## 📚 Project Structure

```
TikTok-Content-Automation-Platform/
├── src/                    # Backend
│   ├── index.ts           # Entry point
│   ├── routes/            # API routes
│   ├── controllers/        # Route handlers
│   ├── services/          # Business logic
│   ├── models/            # TypeScript types
│   ├── database/          # DB connection
│   ├── scheduler/         # Cron jobs
│   └── __tests__/         # Test files
├── apps/
│   └── frontend/          # Next.js frontend
│       ├── src/app/       # Pages
│       ├── src/components/# Components
│       ├── src/store/     # Zustand stores
│       └── package.json
├── .env.example           # Env template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── jest.config.js         # Test config
```

---

## 🔐 Security Notes

- Never commit `.env` files
- Change JWT_SECRET in production
- Use strong database passwords
- Enable HTTPS in production
- Rotate API keys regularly
- Keep dependencies updated

---

## 📞 Support

For issues:
1. Check troubleshooting section
2. Review error logs
3. Check console output
4. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Terminal output

---

## ✅ Next Steps

After successful setup:

1. Run backend tests: `npm test`
2. Register a test user
3. Create a test carousel
4. Test all CRUD operations
5. Check analytics dashboard
6. Test TikTok integration (with real API key)
7. Test AI features (with OpenAI key)

---

**Status:** ✅ Ready for Development & Testing
