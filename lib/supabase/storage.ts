import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export const uploadPhotos = async (files: File[]) => {
  const supabase = createClientComponentClient()
  const uploadedUrls: string[] = []

  for (const file of files) {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("record-photos")
      .upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading photo:", uploadError)
      continue
    }

    const { data } = supabase.storage
      .from("record-photos")
      .getPublicUrl(filePath)

    uploadedUrls.push(data.publicUrl)
  }

  return uploadedUrls
}
