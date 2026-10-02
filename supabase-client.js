// Supabase client — chave publicável: segura para uso no navegador.
// Nunca coloque service_role/secret key neste arquivo.
window.SUPABASE_CONFIG={
  url:"https://nqqvqobayffaxcadchzj.supabase.co",
  publishableKey:"sb_publishable_Fcb-G-ohECsquIVtAI-cPg_ewVFIYQ7"
};
window.SUPABASE_READY=Boolean(window.SUPABASE_CONFIG.url&&window.SUPABASE_CONFIG.publishableKey&&window.supabase);
window.supabaseClient=window.SUPABASE_READY
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
  : null;