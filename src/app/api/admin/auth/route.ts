import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pwd = searchParams.get('pwd')

  if (pwd === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ authenticated: true })
  }
  return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
}
