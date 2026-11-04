-- AlterTable
ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "brand" TEXT;

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
