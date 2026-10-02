// Supabase client — preencha apenas com os valores PUBLICÁVEIS do seu projeto.
// Nunca coloque uma service_role/secret key neste arquivo ou no navegador.
window.SUPABASE_CONFIG={
  url:"",
  publishableKey:""
};
window.SUPABASE_READY=Boolean(window.SUPABASE_CONFIG.url&&window.SUPABASE_CONFIG.publishableKey&&window.supabase);
window.supabaseClient=window.SUPABASE_READY
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
  : null;