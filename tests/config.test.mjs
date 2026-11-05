import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {safeAuthNext} from '../src/lib/redirect.ts';
import {supabaseEnv} from '../src/lib/env.ts';

test('auth callback only redirects to explicit same-site destinations',()=>{
 assert.equal(safeAuthNext('/account/reset'),'/account/reset');
 for(const path of [null,'/','https://evil.example','//evil.example','/\\evil.example','/%2f%2fevil.example','/account/reset?next=https://evil.example'])assert.equal(safeAuthNext(path),'/');
});
test('configuration requires public Supabase connection values and rejects secret keys',()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 try{delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;assert.equal(supabaseEnv(),null);
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';assert.equal(supabaseEnv().url,'https://project.supabase.co');
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_secret_test';assert.throws(()=>supabaseEnv(),/publishable/);
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature';assert.throws(()=>supabaseEnv(),/service_role/);
 process.env.NEXT_PUBLIC_SUPABASE_URL='javascript:alert(1)';assert.equal(supabaseEnv(),null);
 }finally{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey}
});
test('all 25 course videos are included and answer keys stay outside public assets',async()=>{
 const videos=(await readdir(new URL('../public/videos/',import.meta.url))).filter(f=>f.endsWith('.mp4'));assert.equal(videos.length,25);
 const assets=await readdir(new URL('../public/',import.meta.url));assert.ok(!assets.includes('curriculum.json'));assert.ok(!assets.includes('lessons.js'));
 const seed=await readFile(new URL('../supabase/migrations/202611050002_curriculum.sql',import.meta.url),'utf8');assert.equal((seed.match(/insert into public.lessons /g)||[]).length,25);assert.equal((seed.match(/insert into public.course_sources /g)||[]).length,175);assert.equal((seed.match(/insert into private.quiz_keys /g)||[]).length,25);
});
