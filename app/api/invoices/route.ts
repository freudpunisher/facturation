import { NextResponse } from 'next/server'
import { db } from '@/db'
import { facturations, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  try {
    // Modified query with join
    const query = db
      .select({
        id: facturations.id,
        invoiceNumber: facturations.invoiceNumber,
        totalAmount: facturations.totalAmount,
        taxAmount: facturations.taxAmount,
        status: facturations.status,
        sync: facturations.sync,
        createdAt: facturations.createdAt,
        client: {
          name: clients.name,
          email: clients.email,
          company: clients.company
        }
      })
      .from(facturations)
      .innerJoin(clients, eq(facturations.clientId, clients.id))

    if (clientId) {
      query.where(eq(facturations.clientId, Number(clientId)))
    }

    const invoices = await query
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// Modify the POST handler for /api/invoices
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received body:", body);
    
    // Ensure decimal fields are strings for Drizzle
    const formattedBody = {
      ...body,
      
      totalAmount: body.totalAmount.toString(), // Convert decimals to strings
      taxAmount: body.taxAmount.toString(),
    };
    console.log("Formatted body before insert:", formattedBody);

    const newInvoice = await db.insert(facturations).values(formattedBody).returning();

    return NextResponse.json(newInvoice[0]);
  } catch (error) {
    console.error("Error in invoice route:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

// Add PUT and DELETE handlers similarly

export async function PUT(request: Request) {
  const body = await request.json()
  try {
    const updatedFacturations = await db
      .update(facturations)
      .set(body)
      .where(eq(facturations.id, body.id))
      .returning()
    return NextResponse.json(updatedFacturations[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE client
export async function DELETE(request: Request) {
  const { id } = await request.json()
  try {
    await db.delete(facturations).where(eq(facturations.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}