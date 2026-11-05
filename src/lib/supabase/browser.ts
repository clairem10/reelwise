'use client';
import {createBrowserClient} from '@supabase/ssr';
import {supabaseEnv} from '@/lib/env';
let client:ReturnType<typeof createBrowserClient>|undefined;
export function browserDb() { const env=supabaseEnv(); if(!env) throw new Error('Supabase is not configured.'); return client ??=createBrowserClient(env.url,env.key); }
