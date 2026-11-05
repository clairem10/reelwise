import {supabaseEnv} from '@/lib/env';
import {loadApp} from '@/lib/data';
import {LearningApp} from '@/components/learning-app';
import {Setup} from '@/components/setup';
export const dynamic='force-dynamic';
export default async function Page(){
 let configured=false;try{configured=Boolean(supabaseEnv())}catch{return <Setup message="The Supabase key is not safe for a frontend. Set a publishable key or legacy anon key, then redeploy."/>}
 if(!configured)return <Setup/>;
 try{const data=await loadApp();if(!data.courses.length||!data.lessons.length)return <Setup message="Supabase is connected, but no published lessons exist. Apply the curriculum migration to load Data 140."/>;return <LearningApp key={data.viewer?.id??'guest'} initial={data}/>}
 catch{return <Setup message="The course database could not be reached. Verify the Supabase environment variables and apply the included migrations, then refresh."/>}
}
