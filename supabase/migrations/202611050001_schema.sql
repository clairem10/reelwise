begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.courses (
 id text primary key, title text not null, code text not null, term text not null,
 description text not null default '', source_url text not null check(source_url ~ '^https://'),
 coverage text not null, published boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.lessons (
 id text primary key, course_id text not null references public.courses(id) on delete cascade,
 position integer not null check(position>0), title text not null, topic text not null,
 hook text not null, transcript text[] not null, formula text not null,
 video_path text not null, duration_seconds integer not null default 18 check(duration_seconds>0),
 source_url text not null check(source_url ~ '^https://'),
 narrated_url text, embed_url text, published boolean not null default false,
 unique(course_id,position)
);
create table public.course_sources (
 id bigint generated always as identity primary key, course_id text not null references public.courses(id) on delete cascade,
 title text not null, path text not null, kind text not null check(kind in ('Notebook','Dataset')),
 chapter integer, url text not null check(url ~ '^https://'), unique(course_id,path)
);
create table public.quiz_questions (
 id text primary key, lesson_id text not null unique references public.lessons(id) on delete cascade,
 prompt text not null, options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options)>=2)
);
create table private.quiz_keys (
 question_id text primary key references public.quiz_questions(id) on delete cascade,
 correct_option integer not null check(correct_option>=0), explanation text not null, remediation text not null
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Learner' check(char_length(display_name) between 1 and 80),
 created_at timestamptz not null default now()
);
create table public.enrollments (
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id text not null references public.courses(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,course_id)
);
create table public.lesson_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null references public.lessons(id) on delete cascade,
 watched_seconds integer not null default 0 check(watched_seconds>=0),
 quiz_passed boolean not null default false, passed_at timestamptz,
 updated_at timestamptz not null default now(), primary key(user_id,lesson_id)
);
create table public.bookmarks (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id text not null references public.lessons(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,lesson_id)
);
create table public.quiz_attempts (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id text not null references public.quiz_questions(id) on delete cascade,
 selected_option integer not null, is_correct boolean not null, created_at timestamptz not null default now()
);
create index quiz_attempts_user_created on public.quiz_attempts(user_id, created_at desc);
create index lessons_course on public.lessons(course_id);
create index course_sources_course on public.course_sources(course_id);

create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),80),''),'Learner'));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
-- Also support users who existed before installing the schema.
insert into public.profiles(id,display_name) select id,'Learner' from auth.users on conflict do nothing;

create function public.submit_quiz(p_question_id text,p_selected_option integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid(); q record; k record; correct boolean;
begin
 if uid is null then raise exception 'Sign in to take a quick check' using errcode='42501'; end if;
 select qq.id, qq.options, l.id as lesson_id, l.course_id, l.formula into q
 from public.quiz_questions qq join public.lessons l on l.id=qq.lesson_id join public.courses c on c.id=l.course_id
 where qq.id=p_question_id and l.published and c.published;
 if not found then raise exception 'Question unavailable' using errcode='22023'; end if;
 if p_selected_option is null or p_selected_option<0 or p_selected_option>=jsonb_array_length(q.options) then
 raise exception 'Invalid option' using errcode='22023'; end if;
 select * into k from private.quiz_keys where question_id=q.id;
 if not found then raise exception 'Question not configured' using errcode='22023'; end if;
 -- Serialize per user to enforce the attempt limit even for concurrent requests.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if (select count(*) from public.quiz_attempts where user_id=uid and created_at>now()-interval '1 minute')>=30 then
 raise exception 'Too many attempts. Try again in a minute.' using errcode='P0001'; end if;
 correct := p_selected_option=k.correct_option;
 insert into public.enrollments(user_id,course_id) values(uid,q.course_id) on conflict do nothing;
 insert into public.quiz_attempts(user_id,question_id,selected_option,is_correct) values(uid,q.id,p_selected_option,correct);
 if correct then
 insert into public.lesson_progress(user_id,lesson_id,quiz_passed,passed_at) values(uid,q.lesson_id,true,now())
 on conflict(user_id,lesson_id) do update set quiz_passed=true,passed_at=coalesce(public.lesson_progress.passed_at,excluded.passed_at),updated_at=now();
 end if;
 return jsonb_build_object('is_correct',correct,'explanation',k.explanation,'remediation',case when correct then null else k.remediation end,'formula',q.formula);
end; $$;

create function public.record_watch(p_lesson_id text,p_watched_seconds integer) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); duration integer;
begin
 if uid is null then raise exception 'Sign in to save progress' using errcode='42501'; end if;
 select l.duration_seconds into duration from public.lessons l join public.courses c on c.id=l.course_id
 where l.id=p_lesson_id and l.published and c.published;
 if not found or p_watched_seconds is null or p_watched_seconds<0 then raise exception 'Invalid watch progress' using errcode='22023'; end if;
 insert into public.lesson_progress(user_id,lesson_id,watched_seconds) values(uid,p_lesson_id,least(p_watched_seconds,duration))
 on conflict(user_id,lesson_id) do update set watched_seconds=greatest(public.lesson_progress.watched_seconds,excluded.watched_seconds),updated_at=now();
end; $$;

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.course_sources enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.quiz_attempts enable row level security;
alter table private.quiz_keys enable row level security;

create policy courses_read on public.courses for select to anon,authenticated using(published);
create policy lessons_read on public.lessons for select to anon,authenticated using(published and exists(select 1 from public.courses c where c.id=course_id and c.published));
create policy sources_read on public.course_sources for select to anon,authenticated using(exists(select 1 from public.courses c where c.id=course_id and c.published));
create policy questions_read on public.quiz_questions for select to anon,authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id and l.published));
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy enrollments_read on public.enrollments for select to authenticated using(user_id=(select auth.uid()));
create policy enrollments_insert on public.enrollments for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.courses c where c.id=course_id and c.published));
create policy enrollments_delete on public.enrollments for delete to authenticated using(user_id=(select auth.uid()));
create policy progress_read on public.lesson_progress for select to authenticated using(user_id=(select auth.uid()));
create policy bookmarks_read on public.bookmarks for select to authenticated using(user_id=(select auth.uid()));
create policy bookmarks_insert on public.bookmarks for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.lessons l where l.id=lesson_id and l.published));
create policy bookmarks_delete on public.bookmarks for delete to authenticated using(user_id=(select auth.uid()));
create policy attempts_read on public.quiz_attempts for select to authenticated using(user_id=(select auth.uid()));

-- Explicit grants: no client role can set quiz results or read answer keys.
revoke all on public.courses,public.lessons,public.course_sources,public.quiz_questions,public.profiles,public.enrollments,public.lesson_progress,public.bookmarks,public.quiz_attempts from anon,authenticated;
grant select on public.courses,public.lessons,public.course_sources,public.quiz_questions to anon,authenticated;
grant select on public.profiles,public.enrollments,public.lesson_progress,public.bookmarks,public.quiz_attempts to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert,delete on public.enrollments,public.bookmarks to authenticated;
revoke all on all tables in schema private from public,anon,authenticated;
revoke all on function public.submit_quiz(text,integer) from public,anon;
revoke all on function public.record_watch(text,integer) from public,anon;
grant execute on function public.submit_quiz(text,integer),public.record_watch(text,integer) to authenticated;
revoke all on function private.handle_new_user() from public,anon,authenticated;
commit;
