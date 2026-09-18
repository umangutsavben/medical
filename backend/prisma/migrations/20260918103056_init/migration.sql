-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "profilePhoto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MedicalDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
    "categoryId" TEXT,
    "processingError" TEXT,
    CONSTRAINT "MedicalDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicalDocument_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MedicalCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedText" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pageCount" INTEGER,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtractedText_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MedicalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicalCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "DocumentTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    CONSTRAINT "DocumentTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MedicalDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthParameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "description" TEXT,
    "normalMin" REAL,
    "normalMax" REAL
);

-- CreateTable
CREATE TABLE "HealthMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "documentId" TEXT,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "measuredAt" DATETIME NOT NULL,
    "confidence" REAL,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "originalText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HealthMeasurement_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "HealthParameter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthMeasurement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MedicalDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "MedicalDocument_userId_idx" ON "MedicalDocument"("userId");

-- CreateIndex
CREATE INDEX "MedicalDocument_processingStatus_idx" ON "MedicalDocument"("processingStatus");

-- CreateIndex
CREATE INDEX "MedicalDocument_categoryId_idx" ON "MedicalDocument"("categoryId");

-- CreateIndex
CREATE INDEX "MedicalDocument_uploadedAt_idx" ON "MedicalDocument"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractedText_documentId_key" ON "ExtractedText"("documentId");

-- CreateIndex
CREATE INDEX "ExtractedText_documentId_idx" ON "ExtractedText"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCategory_name_key" ON "MedicalCategory"("name");

-- CreateIndex
CREATE INDEX "DocumentTag_tag_idx" ON "DocumentTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTag_documentId_tag_key" ON "DocumentTag"("documentId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "HealthParameter_name_key" ON "HealthParameter"("name");

-- CreateIndex
CREATE INDEX "HealthMeasurement_userId_idx" ON "HealthMeasurement"("userId");

-- CreateIndex
CREATE INDEX "HealthMeasurement_parameterId_idx" ON "HealthMeasurement"("parameterId");

-- CreateIndex
CREATE INDEX "HealthMeasurement_measuredAt_idx" ON "HealthMeasurement"("measuredAt");

-- CreateIndex
CREATE INDEX "HealthMeasurement_userId_parameterId_idx" ON "HealthMeasurement"("userId", "parameterId");
