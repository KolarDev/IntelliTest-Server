-- DropForeignKey
ALTER TABLE "public"."students" DROP CONSTRAINT "students_createdBy_fkey";

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
