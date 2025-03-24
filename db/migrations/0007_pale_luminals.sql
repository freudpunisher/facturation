ALTER TABLE "facturations" RENAME COLUMN "vat_taxpayer" TO "payment_type";--> statement-breakpoint
ALTER TABLE "facturations" ADD COLUMN "tp_fiscal_center" varchar DEFAULT 'DMC';