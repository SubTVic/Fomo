-- CreateTable
CREATE TABLE "group_contacts" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "isResponsible" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_contacts_groupId_idx" ON "group_contacts"("groupId");

-- CreateIndex
CREATE INDEX "group_contacts_email_idx" ON "group_contacts"("email");

-- AddForeignKey
ALTER TABLE "group_contacts" ADD CONSTRAINT "group_contacts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
