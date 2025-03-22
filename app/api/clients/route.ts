import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET all clients
export async function GET() {
  try {
    const allClients = await db.select().from(clients)
    return NextResponse.json(allClients)
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: error },
      { status: 500 }
    )
  }
}

// POST create new client
export async function POST(request: Request) {
  const body = await request.json()
  try {
    const newClient = await db.insert(clients).values(body).returning()
    return NextResponse.json(newClient[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}

// PUT update client
export async function PUT(request: Request) {
  const body = await request.json()
  try {
    const updatedClient = await db
      .update(clients)
      .set(body)
      .where(eq(clients.id, body.id))
      .returning()
    return NextResponse.json(updatedClient[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE client
export async function DELETE(request: Request) {
  const { id } = await request.json()
  try {
    await db.delete(clients).where(eq(clients.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}