-- AlterTable
ALTER TABLE "Product" ADD COLUMN "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "procurementCostPaise" INTEGER,
ADD COLUMN "gstRatePercent" INTEGER,
ADD COLUMN "hsnCode" TEXT,
ADD COLUMN "weightGrams" INTEGER,
ADD COLUMN "lengthMm" INTEGER,
ADD COLUMN "widthMm" INTEGER,
ADD COLUMN "heightMm" INTEGER;

-- Hand-written, as in the first migration: Prisma cannot express CHECK constraints.
-- A backorderable product may have more units reserved than it has on hand.
ALTER TABLE "Product" DROP CONSTRAINT "Product_reservedQuantity_within_stock";
ALTER TABLE "Product" ADD CONSTRAINT "Product_reservedQuantity_within_stock" CHECK (
  "reservedQuantity" >= 0 AND ("allowBackorder" OR "reservedQuantity" <= "stockQuantity")
);
-- Combo stock comes from its contents, so a combo itself never takes backorders.
ALTER TABLE "Product" ADD CONSTRAINT "Product_combo_backorder_check" CHECK ("kind" <> 'COMBO' OR NOT "allowBackorder");
ALTER TABLE "Product" ADD CONSTRAINT "Product_procurementCost_non_negative" CHECK ("procurementCostPaise" IS NULL OR "procurementCostPaise" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_gstRate_valid" CHECK ("gstRatePercent" IS NULL OR "gstRatePercent" IN (0, 5, 12, 18, 28));
ALTER TABLE "Product" ADD CONSTRAINT "Product_hsnCode_valid" CHECK ("hsnCode" IS NULL OR "hsnCode" ~ '^[0-9]{4,8}$');
ALTER TABLE "Product" ADD CONSTRAINT "Product_dimensions_positive" CHECK (
  ("weightGrams" IS NULL OR "weightGrams" > 0) AND
  ("lengthMm" IS NULL OR "lengthMm" > 0) AND
  ("widthMm" IS NULL OR "widthMm" > 0) AND
  ("heightMm" IS NULL OR "heightMm" > 0)
);
