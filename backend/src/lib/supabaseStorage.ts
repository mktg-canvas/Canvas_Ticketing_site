import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const safeName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
  const path = `tickets/${Date.now()}_${safeName}`
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .upload(path, buffer, { contentType: mimeType, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .getPublicUrl(path)

  return data.publicUrl
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .createSignedUrl(path, 3600)

  if (error) throw new Error(error.message)
  return data.signedUrl
}
