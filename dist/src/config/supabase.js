"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE || '';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: { Authorization: `Bearer ${process.env.JWT_SERVICE_ROLE}` },
    },
});
exports.default = supabase;
