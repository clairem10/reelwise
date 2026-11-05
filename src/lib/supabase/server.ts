import { createServerClient } from '@supabase/ssr';
import {cookies} from 'next/headers';
import {supabaseEnv} from '@/lib/env';
export async function serverDb(){
 const env=supabaseEnv();
 if(!env) throw new Error('Supabase is not configured.');
 const jar=await cookies();
 return createServerClient(env.url,env.key,{
  cookies:{
   getAll:()=>jar.getAll(),
   setAll:values=>{
    try{values.forEach(({name,value,options})=>jar.set(name,value,options));}
    catch{/* Proxy persists refreshed cookies during server rendering. */}
   }
  }
 });
}
