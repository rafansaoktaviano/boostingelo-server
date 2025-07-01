import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth:{
    persistSession: false
  }
})

export default supabase
