import { supabase } from './supabase'

function extOf(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin'
}

export async function uploadAvatar(profileId: string, file: File): Promise<string> {
  const ext = extOf(file.name)
  const path = `${profileId}/avatar-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadBackground(
  profileId: string,
  pageId: string,
  kind: 'landing' | 'main',
  file: File,
  previousUrl?: string | null
): Promise<{ url: string; type: 'image' | 'video' }> {
  const isVideo = file.type.startsWith('video/')
  const ext = extOf(file.name) || (isVideo ? 'mp4' : 'jpg')
  // Unique name per upload: re-uploading must yield a fresh URL so neither the
  // browser nor the CDN can serve the stale bytes of the replaced background.
  const path = `${profileId}/${pageId}/${kind}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('backgrounds').upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from('backgrounds').getPublicUrl(path)
  const bust = Date.now()
  const sep = data.publicUrl.includes('?') ? '&' : '?'

  // Best-effort cleanup of the replaced file - only when it belongs to this
  // slot (never delete a file the other slot points at via "Use main background").
  if (previousUrl) {
    try {
      const marker = '/backgrounds/'
      const idx = previousUrl.indexOf(marker)
      if (idx !== -1) {
        const prevPath = previousUrl.slice(idx + marker.length).split('?')[0]
        const prevName = prevPath.split('/').pop() ?? ''
        const owns =
          prevName === `${kind}.${ext}` ||
          prevName.startsWith(`${kind}-`) ||
          (prevName.startsWith(kind) && /\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)$/i.test(prevName))
        if (owns && prevPath !== path) {
          await supabase.storage.from('backgrounds').remove([prevPath])
        }
      }
    } catch {
      // cleanup is best-effort - the new upload already succeeded
    }
  }

  return { url: `${data.publicUrl}${sep}t=${bust}`, type: isVideo ? 'video' : 'image' }
}

export async function uploadAudio(profileId: string, pageId: string, file: File): Promise<string> {
  const ext = extOf(file.name) || 'mp3'
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${profileId}/${pageId}/${Date.now()}-${safe || `audio.${ext}`}`
  const { error } = await supabase.storage.from('audio').upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from('audio').getPublicUrl(path)
  return data.publicUrl
}
