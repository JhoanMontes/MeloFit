import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yjwkwutktwckjffgphsu.supabase.co"; // no cambiar
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqd2t3dXRrdHdja2pmZmdwaHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDg5NjYsImV4cCI6MjA3OTc4NDk2Nn0.abETaKIfE0DiCfQOpb_n8OCBC4sxpd3JlgBcFq_6ZdI";  

// no cambiar nada si no se lo quiere tirar
export const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);
