CREATE TYPE "public"."invoice_status" AS ENUM('paid', 'pending', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('VAT', 'Sales Tax', 'Income Tax');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"company" varchar(255) NOT NULL,
	"status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "detail_facturations" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
--> statement-breakpoint
CREATE TABLE "facturations" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"client_id" integer NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facturations_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"tax_name" varchar(255) NOT NULL,
	"tax_rate" numeric(5, 2) NOT NULL,
	"tax_type" "tax_type" NOT NULL,
	"applicable" varchar(255) NOT NULL,
	"sent_to_authority" boolean DEFAULT false,
	"sent_at" timestamp,
	"authority_reference" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "detail_facturations" ADD CONSTRAINT "detail_facturations_invoice_id_facturations_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."facturations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facturations" ADD CONSTRAINT "facturations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_invoice_id_facturations_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."facturations"("id") ON DELETE no action ON UPDATE no action;