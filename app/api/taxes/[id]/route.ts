import { NextResponse } from 'next/server'
import { db } from '@/db'
import { taxes } from '@/db/schema'
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

    const updatedTaxes = await db
      .update(taxes)
      .set(body) // Use the parsed request body as update data
      .where(eq(taxes.id, id))
      .returning()

    if (updatedTaxes.length === 0) {
      return NextResponse.json(
        { error: 'Taxe not found or no changes applied' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedTaxes[0])
  } catch (error) {
    console.error('Update Error:', error)
    return NextResponse.json(
      { error: 'Failed to update Taxe' },
      { status: 500 }
    )
  }
}