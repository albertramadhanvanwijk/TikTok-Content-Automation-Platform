# Local Development Setup Guide

**Updated:** September 25, 2026
**Status:** Complete Local Setup Instructions

---

## ✅ LOCAL SETUP CHECKLIST

### Prerequisites (Verify Installed)
- [ ] Node.js 18+ (`node --version`)
- [ ] npm 9+ (`npm --version`)
- [ ] PostgreSQL 15+ (`psql --version`)
- [ ] Redis 7+ (`redis-cli --version`)
- [ ] Git (`git --version`)

---

## 🔧 STEP-BY-STEP SETUP

### PART 1: Database Setup (PostgreSQL)

**1. Create Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tiktok_carousel_dev;

# Create user
CREATE USER tiktok_dev WITH PASSWORD 'password123';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tiktok_carousel_dev TO tiktok_dev;

# Exit
\q
```

**2. Verify Connection:**
```bash
psql -U tiktok_dev -d tiktok_carousel_dev -h localhost
# Should connect successfully
\q
```

---

### PART 2: Backend Setup

**1. Install Dependencies:**
```bash
# Navigate to root
cd TikTok-Content-Automation-Platform

# Install backend dependencies
npm install
```

**2. Create Environment File:**
```bash
# Copy template
cp .env.example .env

# Edit .env with your local settings
```

**3. Configure .env File:**
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tiktok_carousel_dev
DB_USER=tiktok_dev
DB_PASSWORD=password123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_for_local_development
JWT_EXPIRE=7d

# TikTok (Optional - leave empty for testing)
TIKTOK_CLIENT_KEY=your_tiktok_key_here
TIKTOK_CLIENT_SECRET=your_tiktok_secret_here

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_key_here

# Notion (Optional)
NOTION_API_KEY=your_notion_key_here

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_token_here

# AWS S3 (Optional - or use local storage)
AWS_S3_BUCKET=your_bucket_name
```

**4. Run Database Migrations:**
```bash
# This will create all tables
npm run migrate
# or manually import SQL files from src/database/migrations/
```

**5. Start Backend:**
```bash
npm run dev
# Terminal output should show:
# ✓ Server running on http://localhost:3000
# ✓ Database connected
# ✓ Redis connected
```

**Verify Backend:**
```bash
# In new terminal, test health endpoint
curl http://localhost:3000/health
# Should return: { "status": "ok", "timestamp": "..." }
```

---

### PART 3: Frontend Setup

**1. Navigate to Frontend:**
```bash
cd apps/frontend
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Create Environment File:**
```bash
# Copy template
cp .env.example .env.local
```

**4. Configure .env.local:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

**5. Start Frontend:**
```bash
npm run dev
# Terminal output should show:
# ▲ Next.js 15.0.0
# - Local: http://localhost:3001
```

---

## 🧪 TESTING THE SYSTEM

### Test 1: Health Check
```bash
# Backend health
curl http://localhost:3000/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "2026-09-25T10:51:57.892Z"
# }
```

### Test 2: User Registration
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!",
    "full_name": "Test User"
  }'

# Should return:
# {
#   "status": "success",
#   "data": {
#     "user": { "id": "...", "email": "test@example.com", ... }
#   }
# }
```

### Test 3: User Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Save the accessToken from response
TOKEN="eyJhbGc..."
```

### Test 4: Get Profile
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Should return user profile
```

### Test 5: Frontend Access
```bash
# Open browser
http://localhost:3001

# You should see:
# 1. Login page (if not authenticated)
# 2. Register link
# 3. Enter test@example.com / TestPassword123!
# 4. Should redirect to dashboard
```

### Test 6: Dashboard Navigation
- [ ] Can see Dashboard home with stats
- [ ] Sidebar is visible with navigation
- [ ] Dark mode toggle works
- [ ] Can navigate to Content page
- [ ] Can navigate to Schedule page
- [ ] Can navigate to Analytics page
- [ ] Can navigate to Settings page

---

## 📊 RUN TESTS LOCALLY

### Backend Tests
```bash
# All tests
npm test

# Watch mode (auto-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- authService.test.ts
```

### Frontend Tests
```bash
cd apps/frontend

# Watch mode
npm test

# CI mode (run once)
npm run test:ci

# Specific test
npm test -- authStore.test.ts
```

---

## 🐛 TROUBLESHOOTING

### Issue: "PostgreSQL connection refused"
```bash
# Check if PostgreSQL is running
# Windows: Services > PostgreSQL
# Mac: brew services list
# Linux: sudo service postgresql status

# Start PostgreSQL if needed
# Mac: brew services start postgresql
# Linux: sudo service postgresql start
```

### Issue: "Redis connection refused"
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if needed
# Mac: brew services start redis
# Linux: sudo service redis-server start
# Windows: redis-server.exe (from Redis folder)
```

### Issue: "Port 3000 already in use"
```bash
# Find process using port 3000
# Mac/Linux: lsof -i :3000
# Windows: netstat -ano | findstr :3000

# Kill process or use different port
# Edit .env PORT=3001
```

### Issue: "Frontend can't connect to API"
```bash
# Verify backend is running
curl http://localhost:3000/health

# Check NEXT_PUBLIC_API_BASE_URL in .env.local
# Should be: http://localhost:3000

# Clear browser cache and restart frontend
cd apps/frontend
npm run dev
```

### Issue: "Database tables don't exist"
```bash
# Run migrations manually
npm run migrate

# Or import SQL files directly
psql -U tiktok_dev -d tiktok_carousel_dev -f src/database/migrations/001_create_users_table.sql
psql -U tiktok_dev -d tiktok_carousel_dev -f src/database/migrations/002_create_content_tables.sql
psql -U tiktok_dev -d tiktok_carousel_dev -f src/database/migrations/003_create_tiktok_tables.sql
psql -U tiktok_dev -d tiktok_carousel_dev -f src/database/migrations/004_create_analytics_tables.sql
```

### Issue: "npm install fails"
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 📋 TYPICAL LOCAL WORKFLOW

### Daily Development Start:
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd TikTok-Content-Automation-Platform
npm run dev
# Watch output for "Server running on http://localhost:3000"

# Terminal 3: Start Frontend
cd apps/frontend
npm run dev
# Watch output for "Local: http://localhost:3001"

# Terminal 4: Optional - Run tests in watch mode
npm run test:watch
```

### After Making Changes:
```bash
# Backend changes: Auto-reload with ts-node
# Frontend changes: Auto-reload with Next.js hot reload
# Database changes: Run npm run migrate and restart backend
# Test changes: Tests auto-run in watch mode
```

### Before Pushing Code:
```bash
# Run full test suite
npm test

# Run linter
npm run lint

# Run type checking
npm run type-check

# Build for production (verify no errors)
npm run build
cd apps/frontend && npm run build
```

---

## 🔌 CONNECTING OPTIONAL SERVICES

### Adding TikTok Integration
1. Create TikTok Developer account
2. Create app and get Client Key/Secret
3. Update .env with credentials
4. Backend will handle OAuth flow

### Adding OpenAI for AI Features
1. Get OpenAI API key
2. Update .env OPENAI_API_KEY
3. AI endpoints will be available

### Adding Notion Sync
1. Create Notion Integration
2. Get Notion API token
3. Update .env NOTION_API_KEY
4. Sync endpoints will work

### Adding Telegram Bot
1. Create Telegram bot with BotFather
2. Get bot token
3. Update .env TELEGRAM_BOT_TOKEN
4. Bot will send notifications

---

## 📊 MONITORING LOCAL DEVELOPMENT

### Check What's Running:
```bash
# Backend health
curl http://localhost:3000/health

# Frontend availability
curl http://localhost:3001

# Database connection
psql -U tiktok_dev -d tiktok_carousel_dev -c "SELECT 1"

# Redis connection
redis-cli ping
```

### Check Logs:
```bash
# Backend logs: Check terminal where npm run dev is running
# Frontend logs: Check terminal where npm run dev is running
# Database: psql commands in separate terminal
# Redis: redis-cli monitor (for Redis commands)
```

### Performance Tips:
```bash
# Use npm run dev (faster with ts-node)
# Run tests in watch mode for TDD
# Use Dark mode in frontend to reduce eye strain
# Keep DevTools open for debugging
# Use Redux DevTools for state inspection
```

---

## 🎯 VERIFICATION CHECKLIST

After setup, verify everything works:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3001
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard loads with stats
- [ ] Can navigate all pages
- [ ] Dark mode toggle works
- [ ] Sidebar collapse/expand works
- [ ] All tests pass locally
- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] API responses are fast (< 200ms)
- [ ] Can create new carousel
- [ ] Can view schedule calendar
- [ ] Analytics page loads data
- [ ] Settings page works

---

## 💡 TIPS & TRICKS

### Faster Development:
```bash
# Use VS Code extensions:
# - Prettier (auto-format)
# - ESLint (show linting errors)
# - Thunder Client (test APIs)
# - REST Client (test endpoints)

# VS Code REST Client example (.http file):
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

### Database Debugging:
```bash
# Connect to database
psql -U tiktok_dev -d tiktok_carousel_dev

# List tables
\dt

# View users
SELECT * FROM users;

# View carousels
SELECT * FROM post_content;

# Count records
SELECT COUNT(*) FROM users;
```

### Frontend Debugging:
```bash
# Browser DevTools (F12)
# - Network tab: Monitor API calls
# - Console: Check for errors
# - Application: Check cookies/localStorage
# - Redux DevTools: Inspect store state

# Next.js Debug Mode:
NODE_OPTIONS='--inspect-brk' npm run dev
```

---

## 📞 COMMON QUESTIONS

**Q: How do I change the port?**
A: Edit .env PORT=3001 for backend, frontend auto-detects and uses 3001

**Q: Can I use different database?**
A: Yes, update DB_* variables in .env. Supports any PostgreSQL-compatible DB

**Q: How do I reset the database?**
A: Drop and recreate database, then run migrations again

**Q: Can I use environment variables?**
A: Yes, .env file is loaded automatically by dotenv

**Q: How do I debug API calls?**
A: Use Thunder Client, Postman, or REST Client VS Code extension

**Q: Is there a seed script?**
A: Not yet, but you can create test data via API endpoints

---

## ✅ YOU'RE ALL SET!

Your local development environment is ready. You can now:
- ✅ Develop new features
- ✅ Fix bugs
- ✅ Run tests
- ✅ Test API endpoints
- ✅ Debug issues
- ✅ Commit changes

**Happy coding! 🚀**

---

**Questions?** Check logs, verify all services running, and review troubleshooting section above.

**Need help?** Create issue on GitHub or check implementation documentation.
