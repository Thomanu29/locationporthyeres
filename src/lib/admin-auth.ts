import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export function verifyAdmin(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.ADMIN_PASSWORD}`
  const a = Buffer.from(auth)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return null
}
