import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients, detailFacturations, facturations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('invoiceId')

  try {
    const query = invoiceId 
      ? db.select().from(detailFacturations).where(eq(detailFacturations.invoiceId, Number(invoiceId)))
      : db.select().from(detailFacturations)

    const invoices = await query
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Create the new invoice item
      const [newItem] = await tx.insert(detailFacturations)
        .values(body)
        .returning();
      
      // 2. Get all items for this invoice
      const items = await tx.select()
        .from(detailFacturations)
        .where(eq(detailFacturations.invoiceId, body.invoiceId));
      
      // 3. Calculate subtotal
      const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * Number(item.unitPrice));
      }, 0);
      
      // 4. Get the invoice to find the client
      const [invoice] = await tx.select()
        .from(facturations)
        .where(eq(facturations.id, body.invoiceId));
      
      // 5. Get the client data to check VAT status
      const [client] = await tx.select()
        .from(clients)
        .where(eq(clients.id, invoice.clientId));
      
      // 6. Set tax rate based on client VAT status
      let taxRate = 0.18; // Default 18% tax
      
      if (client.vat_taxpayer === 0) {
        taxRate = 0; // No tax for VAT taxpayers
      }
      
      const taxAmount = taxRate;
      const totalAmount = subtotal;
      
      // 7. Update the invoice with new totals
      await tx.update(facturations)
        .set({
          totalAmount: totalAmount.toString(),
          taxAmount: taxAmount.toString()
        })
        .where(eq(facturations.id, body.invoiceId));
      
      return newItem;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating invoice item:", error);
    return NextResponse.json(
      { error: 'Failed to create invoice item' },
      { status: 500 }
    );
  }
}

// Add PUT and DELETE handlers similarly

export async function PUT(request: Request) {
  const body = await request.json()
  try {
    const updatedFacturationsDetails = await db
      .update(detailFacturations)
      .set(body)
      .where(eq(detailFacturations.id, body.id))
      .returning()
    return NextResponse.json(updatedFacturationsDetails[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE client
export async function DELETE(request: Request) {
  const { id } = await request.json();
  
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Get the item to be deleted
      const [item] = await tx.select()
        .from(detailFacturations)
        .where(eq(detailFacturations.id, id));

      if (!item) throw new Error('Item not found');

      // 2. Delete the item
      await tx.delete(detailFacturations)
        .where(eq(detailFacturations.id, id));

      // 3. Recalculate totals
      const items = await tx.select()
        .from(detailFacturations)
        .where(eq(detailFacturations.invoiceId, item.invoiceId));

      const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * Number(item.unitPrice));
      }, 0);

      const taxRate = 0.10;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // 4. Update invoice
      await tx.update(facturations)
        .set({
          totalAmount: totalAmount.toString(),
          taxAmount: taxAmount.toString()
        })
        .where(eq(facturations.id, item.invoiceId));

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting invoice item:", error);
    return NextResponse.json(
      { error: 'Failed to delete invoice item' },
      { status: 500 }
    );
  }
}