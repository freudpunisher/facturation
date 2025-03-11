import { NextResponse } from "next/server";
import { db } from "@/db";
import { taxes } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/taxes - Fetch all taxes
export async function GET() {
  try {
    const allTaxes = await db.select().from(taxes);
    return NextResponse.json(allTaxes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch taxes" },
      { status: 500 }
    );
  }
}

// POST /api/taxes - Create a new tax
export async function POST(request: Request) {
    try {
      const body = await request.json();
      const { invoiceId, invoice_registered_date, authorityReference } = body;
  
      // Validate required fields
      if (!invoiceId || !invoice_registered_date) {
        return NextResponse.json(
          { error: "Missing required fields: invoiceId and invoice_registered_date are required" },
          { status: 400 }
        );
      }
  
      // Parse and validate the date
      let parsedDate: Date;
      try {
        // Try parsing the date as an ISO string (e.g., "2023-10-01T00:00:00.000Z")
        parsedDate = new Date(invoice_registered_date);
  
        // Check if the date is valid
        if (isNaN(invoice_registered_date.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid date format for invoice_registered_date. Please provide a valid date." },
          { status: 400 }
        );
      }
  
      // Insert the new tax record
      const newTax = await db
        .insert(taxes)
        .values({
          invoiceId: parseInt(invoiceId),
          invoice_registered_date,
          authorityReference: authorityReference || null,
        })
        .returning();
  
      return NextResponse.json(newTax[0]);
    } catch (error) {
      console.error("Error creating tax:", error);
      return NextResponse.json(
        { error: "Failed to create tax" },
        { status: 500 }
      );
    }
  }
// PUT /api/taxes/:id - Update a tax
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { invoice_registered_date, authorityReference } = body;

    if (!invoice_registered_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedTax = await db
      .update(taxes)
      .set({
        invoice_registered_date: new Date(invoice_registered_date),
        authorityReference: authorityReference || null,
      })
      .where(eq(taxes.id, id))
      .returning();

    return NextResponse.json(updatedTax[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update tax" },
      { status: 500 }
    );
  }
}

// DELETE /api/taxes/:id - Delete a tax
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await db.delete(taxes).where(eq(taxes.id, id));
    return NextResponse.json({ message: "Tax deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete tax" },
      { status: 500 }
    );
  }
}