import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET client by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  
  if (isNaN(id)) {
    return NextResponse.json(
      { error: 'Invalid client ID' },
      { status: 400 }
    )
  }
  
  try {
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1)
    
    if (client.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(client[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}