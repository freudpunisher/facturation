import { NextResponse } from 'next/server'
import { db } from '@/db'
import { detailFacturations, facturations } from '@/db/schema'
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

      // 2. Calculate new totals
      const items = await tx.select()
        .from(detailFacturations)
        .where(eq(detailFacturations.invoiceId, body.invoiceId));

      const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * Number(item.unitPrice));
      }, 0);

      // Assuming 10% tax rate - modify this if you have different tax logic
      const taxRate = 0.18;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // 3. Update the invoice with new totals
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