ALTER TABLE "clients" ADD COLUMN "nifClient" varchar(50);--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_nifClient_unique" UNIQUE("nifClient");