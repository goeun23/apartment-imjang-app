import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export const uploadPhotos = async (files: File[]) => {
  const supabase = createClientComponentClient()
  
  const uploadPromises = files.map(async (file) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("record-photos")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError)
        throw uploadError
      }

      const { data } = supabase.storage
        .from("record-photos")
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error(`Failed to upload file: ${file.name}`, error)
      return null
    }
  })

  const results = await Promise.all(uploadPromises)
  
  return results.filter((url): url is string => url !== null)
}

export const deletePhoto = async (photoUrl: string) => {
    const supabase = createClientComponentClient()
    try {
        const path = photoUrl.split('/record-photos/').pop()
        if(!path) return false

        const { error } = await supabase.storage
            .from('record-photos')
            .remove([path])
        
        if(error) throw error
        return true
    } catch(e) {
        console.error('Error deleting photo:', e)
        return false
    }
}
