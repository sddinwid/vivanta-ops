-- CreateEnum
CREATE TYPE "DocumentIngestionStatus" AS ENUM (
  'UPLOADED',
  'PENDING',
  'PROCESSING',
  'READY',
  'FAILED',
  'REPROCESSING_REQUESTED'
);

-- CreateEnum
CREATE TYPE "DocumentLinkedEntityType" AS ENUM ('PROPERTY', 'OWNER', 'VENDOR');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "sourceType" TEXT,
    "sourceReference" TEXT,
    "documentType" TEXT,
    "ingestionStatus" "DocumentIngestionStatus" NOT NULL DEFAULT 'UPLOADED',
    "checksumSha256" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "documentId" TEXT NOT NULL,
    "linkedEntityType" "DocumentLinkedEntityType" NOT NULL,
    "linkedEntityId" TEXT NOT NULL,
    "linkRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("documentId","linkedEntityType","linkedEntityId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "attachmentContextType" TEXT NOT NULL,
    "attachmentContextId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

-- CreateIndex
CREATE INDEX "Document_uploadedByUserId_idx" ON "Document"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE INDEX "DocumentLink_linkedEntityType_linkedEntityId_idx" ON "DocumentLink"("linkedEntityType", "linkedEntityId");

-- CreateIndex
CREATE INDEX "Attachment_documentId_idx" ON "Attachment"("documentId");

-- CreateIndex
CREATE INDEX "Attachment_attachmentContextType_attachmentContextId_idx" ON "Attachment"("attachmentContextType", "attachmentContextId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

