# Smart Medical Record Management (MedRecord)

A secure, intelligent, and user-friendly medical record management application. Built as a Mobile-First Progressive Web App (PWA) with a Node.js backend.

## 1. Project Architecture
The system consists of two main decoupled components:
- **Backend (Node.js/Express)**: Provides REST APIs, handles authentication, file processing, OCR, and interacts with the database.
- **Frontend (React/Vite)**: A mobile-first web app that communicates with the backend APIs. It uses Context for state management and Recharts for data visualization. 

## 2. Folder Structure
```
med_uma/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Default categories and health params
│   ├── src/
│   │   ├── config/                # Environment configuration
│   │   ├── controllers/           # API handlers
│   │   ├── middleware/            # Auth and Multer uploads
│   │   ├── routes/                # Express router definitions
│   │   ├── services/              # OCR, Categorizer, ParamExtractor
│   │   └── utils/                 # Error classes
│   ├── uploads/                   # Stored medical documents
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/                   # Axios client and API wrappers
    │   ├── components/            # Reusable UI components
    │   ├── context/               # AuthContext
    │   ├── pages/                 # All app screens (Home, Profile, etc.)
    │   ├── index.css              # Custom mobile-first design system
    │   └── App.jsx                # React Router setup
    └── package.json
```

## 3. Technologies Used
- **Frontend**: React, Vite, React Router, Axios, Recharts (for trend graphs), Lucide React (icons), Vanilla CSS.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: SQLite (via Prisma ORM) for rapid dev, schema fully compatible with PostgreSQL.
- **OCR**: Tesseract.js (running in Node.js, real OCR).
- **Authentication**: JWT + bcrypt.
- **File Storage**: Local filesystem with abstraction for easy Cloud Storage (Supabase/S3) migration.

## 4. Database Schema
- **User**: ID, email, passwordHash, name, profile details.
- **MedicalDocument**: ID, file metadata, status, relationships to User, Category, and Tags.
- **ExtractedText**: Contains raw OCR output and confidence score.
- **MedicalCategory**: Reference table for document categories.
- **DocumentTag**: Auto-generated tags for documents.
- **HealthParameter**: Definitions for trackable metrics (glucose, BP, etc).
- **HealthMeasurement**: Extracted parameter values linked to User and Document.

## 5. API Endpoint Documentation
**Auth**:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Authenticate and get token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Clear session

**Profile**:
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

**Documents**:
- `POST /api/documents/upload` - Upload a file (multipart/form-data)
- `GET /api/documents` - List documents (with pagination/filters)
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/process` - Trigger OCR
- `GET /api/documents/:id/text` - Get OCR text
- `PATCH /api/documents/:id/category` - Update category

**Search & Health**:
- `GET /api/search?q=...` - Full-text search
- `GET /api/health-parameters` - List tracked parameters
- `POST /api/health-parameters/:id/correct` - Manually correct measurement
- `GET /api/health-trends/:parameter` - Get trend data for charts

## 6. Environment Variables Required
Backend requires a `.env` file in `med_uma/backend/`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key-change-in-production-abc123xyz"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
MAX_FILE_SIZE_MB=10
UPLOAD_DIR="./uploads"
FRONTEND_URL="http://localhost:5173"
```

## 7. Setup Instructions
1. Install Node.js v18+.
2. Navigate to `backend/` and run `npm install`.
3. Navigate to `frontend/` and run `npm install`.
4. Copy `backend/.env.example` to `backend/.env`.

## 8. Database Migration Instructions
To initialize the SQLite database and seed defaults:
```bash
cd backend
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```
To switch to PostgreSQL, change `DATABASE_URL` in `.env` to a Postgres connection string and re-run the above commands.

## 9. Cloud Storage Configuration
Currently uses local storage in `backend/uploads/` (abstracted via `src/services/storage.ts`).
To use Supabase/AWS S3, update `storage.ts` to use the respective Node SDKs using the provided `getFileUrl`, `getFileBuffer`, and `deleteFile` interfaces.

## 10. OCR Configuration
Uses `tesseract.js` which downloads WebAssembly binaries at runtime. No external API keys are required. It fully runs within the Node environment.

## 11. Testing Instructions
- **Backend API**: Use `curl` or Postman with a Bearer Token to test endpoints.
- **Upload**: Test using images (`.jpg`, `.png`). PDFs are supported via internal image conversion.
- **Frontend**: Open `http://localhost:5173` in a browser. Open Developer Tools and toggle Device Toolbar (Mobile view) for the best experience.

## 12. List of Completed Features
- User registration and JWT login.
- Profile management.
- Medical document upload (PDF/Images) via File or Camera.
- **Real OCR Processing** using Tesseract.js.
- Text and Health Parameter Extraction using Regex & NLP matching.
- SQLite Database Storage via Prisma.
- Medical records display with status badges and categories.
- Real-time Full-Text Search.
- Automatic Categorization based on OCR text.
- Health Trends Visualization using Recharts.
- Complete Mobile-First UI design.
- Full API Authentication and Authorization (User isolation).

## 13. List of Incomplete Features
- Push Notifications for processing completion.
- Advanced AI integrations (e.g. LLM-based extraction instead of regex).

## 14. Known Limitations
- Tesseract.js PDF support requires the PDF to be well-formatted. Raw images yield much higher accuracy.
- Parameter extraction relies on regex; very messy or handwritten reports might miss data.

## 15. Instructions for Running the Mobile Application
Since this was built as a Mobile-First PWA (due to lack of Flutter on the system):
1. Open terminal and run:
   ```bash
   cd frontend
   npm run dev -- --host
   ```
2. Open `http://localhost:5173` in any mobile browser on the same network, or desktop browser in responsive mode.

## 16. Instructions for Running the Backend
```bash
cd backend
npm run dev
```
(Starts the API server on `http://localhost:3001`)

---

## Mandatory Feature Checklist

- [x] [WORKING] Login/signup
- [x] [WORKING] User profile
- [x] [WORKING] Medical document upload
- [x] [WORKING] OCR processing (Real Tesseract OCR)
- [x] [WORKING] Text extraction
- [x] [WORKING] Health parameter extraction (Extracts 9 parameters)
- [x] [WORKING] Database storage (Prisma/SQLite)
- [x] [WORKING] Medical records display
- [x] [WORKING] Search (Across OCR text, name, tags)
- [x] [WORKING] Categorization (Auto tags + Categories)
- [x] [WORKING] Health trends (Interactive Charts)
- [x] [WORKING] Cloud storage (Abstracted, local impl active)
- [x] [WORKING] Security (JWT Auth, user-isolated records)
- [x] [WORKING] Mobile UI (Responsive PWA, custom CSS)
# medical
