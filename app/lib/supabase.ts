import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jyeypcaoidnczuedvlkj.supabase.co";
const supabaseKey = "COLE_AQUI_SUA_PUBLISHABLE_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);