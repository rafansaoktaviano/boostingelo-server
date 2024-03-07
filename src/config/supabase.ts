import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // headers: { Authorization: req.headers.get('Authorization')! },
  },
})

export default supabase
