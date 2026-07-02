import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const supabase = createServiceClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `selfies/${Date.now()}.${ext}`

  const buffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('intercoop')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('intercoop').getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}
