import {NextResponse,type NextRequest} from 'next/server';
import type {EmailOtpType} from '@supabase/supabase-js';
import {serverDb} from '@/lib/supabase/server';
import {safeAuthNext} from '@/lib/redirect';
export async function GET(request:NextRequest){const url=request.nextUrl;const code=url.searchParams.get('code'),token=url.searchParams.get('token_hash'),type=url.searchParams.get('type');let ok=false;try{const db=await serverDb();if(code){const {error}=await db.auth.exchangeCodeForSession(code);ok=!error}else if(token&&['signup','recovery','email','magiclink'].includes(type??'')){const {error}=await db.auth.verifyOtp({token_hash:token,type:type as EmailOtpType});ok=!error}}catch{}const next=ok?safeAuthNext(url.searchParams.get('next')):'/?auth_error=expired';const response=NextResponse.redirect(new URL(next,url.origin));response.headers.set('Cache-Control','no-store');return response;}
