import {serverDb} from '@/lib/supabase/server';
import {ResetPassword} from '@/components/auth-panel';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function ResetPage(){let signedIn=false;try{const db=await serverDb();const {data}=await db.auth.getUser();signedIn=Boolean(data.user)}catch{}return <main className="setup"><span className="sticker">REELWISE ACCOUNT</span><h1>A fresh start.</h1>{signedIn?<ResetPassword/>:<><p>Your reset link has expired or is incomplete. Request a new one from the sign-in panel.</p><Link className="pill" href="/">Back to Reelwise →</Link></>}</main>}
