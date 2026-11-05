export function supabaseEnv() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if (!url || !key || url.includes('YOUR-PROJECT') || key.includes('YOUR-PUBLISHABLE')) return null;
 try { const parsed=new URL(url); if(!['http:','https:'].includes(parsed.protocol)) return null; } catch { return null; }
 // Secret API keys must never be shipped in a NEXT_PUBLIC_ variable.
 if (key.startsWith('sb_secret_')) throw new Error('Use a Supabase publishable key, not a secret key.');
 if (key.startsWith('eyJ')) { try { const payload=JSON.parse(atob(key.split('.')[1])); if(payload.role==='service_role') throw new Error('Use an anon key, not service_role.'); } catch(e) { if(e instanceof Error && e.message.includes('service_role')) throw e; } }
 return {url,key};
}
