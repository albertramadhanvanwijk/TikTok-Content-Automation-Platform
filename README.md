# TikTok Content Automation Platform

Platform otomatis untuk membuat, mendesain, dan upload carousel TikTok untuk PropFirm.

## Project Structure

```
src/
├── config/              # Configuration files
│   └── database.ts     # Database configuration
├── database/
│   ├── __tests__/      # Database tests
│   └── connection.ts   # Database connection pool
├── services/
│   ├── __tests__/      # Service tests
│   └── authService.ts  # Authentication service
├── utils/
│   └── logger.ts       # Winston logger
├── __tests__/          # Integration tests
└── index.ts            # Application entry point
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)

### Installation

1. Clone repository:
```bash
git clone https://github.com/albertramadhanvanwijk/TikTok-Content-Automation-Platform.git
cd TikTok-Content-Automation-Platform
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi lokal Anda:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tiktok_carousel_dev
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### Running the Application

Development:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Production:
```bash
npm start
```

### Testing

Run all tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage:
```bash
npm run test:coverage
```

## Phase 1: Foundation & Infrastructure

### Completed ✅
- [x] Express.js server bootstrap dengan middleware
- [x] TypeScript configuration
- [x] Database configuration & connection pool
- [x] JWT authentication service
- [x] Password hashing & validation
- [x] Logger setup (Winston)
- [x] Environment configuration
- [x] Test setup (Jest + SuperTest)

### Tests Implemented
- **AuthService Tests**: Password hashing, token generation, validation
- **Database Tests**: Connection pool, configuration
- **App Tests**: Health check, middleware, error handling

### Next Steps
- Phase 2: Core Features (Content Management, Dashboard API)
- Phase 3: TikTok Integration
- Phase 4: AI & Design Automation
- Phase 5: Analytics & Reporting

## API Documentation

### Health Check
```
GET /health
Response: { status: "ok", timestamp: "2026-09-25T..." }
```

## Development Workflow

1. Create feature branch
2. Write tests first (TDD)
3. Implement code
4. Run tests - must pass ✅
5. Commit with message: `feat: description`
6. Push to GitHub

## Git Commit Convention

```
feat: Add new feature
fix: Fix a bug
test: Add/update tests
docs: Update documentation
refactor: Refactor code
chore: Update dependencies
```

## License

MIT - Albert Ramadhan Vanwijk

## Contact

- GitHub: [@albertramadhanvanwijk](https://github.com/albertramadhanvanwijk)
