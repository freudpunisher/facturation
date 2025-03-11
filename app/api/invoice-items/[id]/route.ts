import { NextResponse } from 'next/server'
import { db } from '@/db'
import { facturations, detailFacturations } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET facture details by facture ID
export async function GET(
  request: Request,
  { params }: { params: { factureId: string } }
) {
  const factureId = parseInt(params.factureId)
  
  if (isNaN(factureId)) {
    return NextResponse.json(
      { error: 'Invalid facture ID' },
      { status: 400 }
    )
  }
  
  try {
    // Fetch facture by factureId
    const facture = await db
      .select()
      .from(facturations)
      .where(eq(facturations.id, factureId))
      .limit(1)

    if (facture.length === 0) {
      return NextResponse.json(
        { error: 'Facture not found' },
        { status: 404 }
      )
    }

    // Fetch the corresponding facture details
    const factureDetails = await db
      .select()
      .from(detailFacturations)
      .where(eq(detailFacturations.invoiceId, factureId))

    return NextResponse.json({
      facture: facture[0],  // Returning facture data
      details: factureDetails,  // Returning facture details
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch facture details' },
      { status: 500 }
    )
  }
}
