import { createClient } from '@supabase/supabase-js'

// ── FILL THESE IN BEFORE RUNNING ──────────────────────────────
const OLD_URL = 'https://sdjvbqkwgphtgdpnvraa.supabase.co'
const OLD_SERVICE_KEY = '' // old SUPABASE_SERVICE_ROLE_KEY from .env.local
const NEW_URL = ''         // new project URL
const NEW_SERVICE_KEY = '' // new SUPABASE_SERVICE_ROLE_KEY

const OLD_OWNER_ID = ''    // customer UUID in OLD project
const NEW_OWNER_ID = ''    // customer UUID in NEW project (after invite)
// ──────────────────────────────────────────────────────────────

const oldClient = createClient(OLD_URL, OLD_SERVICE_KEY)
const newClient = createClient(NEW_URL, NEW_SERVICE_KEY)

async function migrateStorage() {
  console.log('Listing files in old bucket...')
  const { data: files, error: listError } = await oldClient.storage
    .from('bills')
    .list(OLD_OWNER_ID, { limit: 1000 })

  if (listError) throw new Error(`List failed: ${listError.message}`)
  if (!files || files.length === 0) {
    console.log('No files found in old bucket. Done.')
    return
  }

  console.log(`Found ${files.length} file(s). Migrating...`)

  for (const file of files) {
    const oldPath = `${OLD_OWNER_ID}/${file.name}`
    const newPath = `${NEW_OWNER_ID}/${file.name}`

    // Download from old project
    const { data: blob, error: downloadError } = await oldClient.storage
      .from('bills')
      .download(oldPath)

    if (downloadError || !blob) {
      console.error(`  SKIP ${oldPath}: download failed — ${downloadError?.message}`)
      continue
    }

    // Upload to new project
    const { error: uploadError } = await newClient.storage
      .from('bills')
      .upload(newPath, blob, { upsert: true })

    if (uploadError) {
      console.error(`  FAIL ${newPath}: upload failed — ${uploadError.message}`)
      continue
    }

    console.log(`  OK   ${oldPath} → ${newPath}`)
  }

  console.log('\nStorage migration complete.')
  console.log(`\nNow run this SQL in the NEW project to fix file_url paths:`)
  console.log(`UPDATE bills SET file_url = REPLACE(file_url, '${OLD_OWNER_ID}', '${NEW_OWNER_ID}') WHERE owner_id = '${NEW_OWNER_ID}' AND file_url IS NOT NULL;`)
}

migrateStorage().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
