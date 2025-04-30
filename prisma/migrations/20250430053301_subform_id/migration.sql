-- AlterTable
ALTER TABLE "FormElement" ADD COLUMN     "subformId" TEXT;

-- AddForeignKey
ALTER TABLE "FormElement" ADD CONSTRAINT "FormElement_subformId_fkey" FOREIGN KEY ("subformId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;
