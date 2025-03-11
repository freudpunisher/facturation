import { NextResponse } from 'next/server'
import { db } from '@/db'
import { facturations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  if (isNaN(id)) {
    return NextResponse.json(
      { error: 'Invalid invoice ID' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json() // Parse the request body

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    const updatedFacturations = await db
      .update(facturations)
      .set(body) // Use the parsed request body as update data
      .where(eq(facturations.id, id))
      .returning()

    if (updatedFacturations.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found or no changes applied' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedFacturations[0])
  } catch (error) {
    console.error('Update Error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}