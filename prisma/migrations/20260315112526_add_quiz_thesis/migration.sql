-- CreateTable
CREATE TABLE "quiz_theses" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "shortTitle" VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_theses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_thesis_attributes" (
    "id" TEXT NOT NULL,
    "thesisId" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "isInverse" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_thesis_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_thesis_attributes_thesisId_attribute_key" ON "quiz_thesis_attributes"("thesisId", "attribute");

-- CreateIndex
CREATE INDEX "quiz_thesis_attributes_thesisId_idx" ON "quiz_thesis_attributes"("thesisId");

-- AddForeignKey
ALTER TABLE "quiz_thesis_attributes" ADD CONSTRAINT "quiz_thesis_attributes_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "quiz_theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
