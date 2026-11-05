import {serverDb} from '@/lib/supabase/server';
import type {AppData,Course,Lesson,Question,Source,Progress} from './types';
export async function loadApp():Promise<AppData>{
 const db=await serverDb();
 const results=await Promise.all([db.from('courses').select('*').order('created_at'),db.from('lessons').select('*').order('position'),db.from('course_sources').select('*').order('id'),db.from('quiz_questions').select('*'),db.auth.getUser()]);
 for(const r of results.slice(0,4))if(r.error)throw new Error('Course database is unavailable. Apply the supplied Supabase migrations and check the project configuration.');
 const [c,l,s,q,auth]=results;const user=auth.data&&'user' in auth.data?auth.data.user:null;
 const base:AppData={courses:c.data as Course[],lessons:l.data as Lesson[],sources:s.data as Source[],questions:q.data as Question[],viewer:null,progress:[],bookmarks:[],enrollments:[]};
 if(!user)return base;
 const [profile,progress,bookmarks,enrollments]=await Promise.all([db.from('profiles').select('display_name').eq('id',user.id).single(),db.from('lesson_progress').select('lesson_id,quiz_passed,watched_seconds'),db.from('bookmarks').select('lesson_id'),db.from('enrollments').select('course_id')]);
 for(const result of [profile,progress,bookmarks,enrollments])if(result.error)throw new Error('Your account data could not be loaded. Check the Supabase schema and try again.');
 if(!profile.data||!progress.data||!bookmarks.data||!enrollments.data)throw new Error('Account data is incomplete.');
 return {...base,viewer:{id:user.id,email:user.email??'',displayName:profile.data.display_name},progress:progress.data as Progress[],bookmarks:bookmarks.data.map(r=>r.lesson_id as string),enrollments:enrollments.data.map(r=>r.course_id as string)};
}
