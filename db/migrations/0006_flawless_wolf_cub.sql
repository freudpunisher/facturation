ALTER TABLE "clients" ADD COLUMN "vat_taxpayer" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "facturations" ADD COLUMN "invoice_type" varchar DEFAULT 'FN';--> statement-breakpoint
ALTER TABLE "facturations" ADD COLUMN "vat_taxpayer" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "facturations" ADD COLUMN "invoice_currency" varchar DEFAULT 'BIF';