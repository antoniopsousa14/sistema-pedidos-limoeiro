import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jyeypcaoidnczuedvlkj.supabase.co";
const supabaseKey = "sb_publishable_PtAYhPkMz5t1jyWNqlUWAw_BEqWgfm6";

export const supabase = createClient(supabaseUrl, supabaseKey);