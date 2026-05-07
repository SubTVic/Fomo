-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "duplicateOfGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_duplicateOfGroupId_fkey" FOREIGN KEY ("duplicateOfGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
