// app/actions/invoice-actions.ts
"use server";

import { db } from '@/db';
import { taxes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';



export async function updateInvoiceStatus(
  invoiceIdentifier: string, 
  status: 'active' | 'canceled', 
  cancellationReason?: string
) {
  try {
    // First, find the tax record by invoice identifier
    const existingTax = await db.query.taxes.findFirst({
      where: (taxes, { eq }) => eq(taxes.invoice_registered_date, invoiceIdentifier)
    });

    if (!existingTax) {
      return { 
        success: false, 
        message: 'Invoice not found' 
      };
    }

    // Update the tax record
    const updatedTax = await db
      .update(taxes)
      .set({
        status,
        cancellationReason: status === 'canceled' ? cancellationReason : null,
        updatedAt: new Date()
      })
      .where(eq(taxes.id, existingTax.id))
      .returning();

    return { 
      success: true, 
      message: 'Invoice status updated successfully',
      data: updatedTax[0]
    };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}