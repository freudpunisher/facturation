ALTER TABLE "taxes" ADD COLUMN "invoice_registered_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "taxes" DROP COLUMN "tax_name";--> statement-breakpoint
ALTER TABLE "taxes" DROP COLUMN "tax_rate";--> statement-breakpoint
ALTER TABLE "taxes" DROP COLUMN "tax_type";--> statement-breakpoint
ALTER TABLE "taxes" DROP COLUMN "applicable";--> statement-breakpoint
ALTER TABLE "taxes" DROP COLUMN "sent_to_authority";--> statement-breakpoint
ALTER TABLE "taxes" DROP COLUMN "sent_at";--> statement-breakpoint
DROP TYPE "public"."tax_type";