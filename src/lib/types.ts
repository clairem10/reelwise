export interface Course { id:string; title:string; code:string; term:string; description:string; source_url:string; coverage:string }
export interface Lesson { id:string; course_id:string; position:number; title:string; topic:string; hook:string; transcript:string[]; formula:string; video_path:string; duration_seconds:number; source_url:string; narrated_url:string|null; embed_url:string|null }
export interface Source { id:number; course_id:string; title:string; path:string; kind:'Notebook'|'Dataset'; chapter:number|null; url:string }
export interface Question { id:string; lesson_id:string; prompt:string; options:string[] }
export interface Progress { lesson_id:string; quiz_passed:boolean; watched_seconds:number }
export interface Viewer { id:string; email:string; displayName:string }
export interface AppData { courses:Course[]; lessons:Lesson[]; sources:Source[]; questions:Question[]; viewer:Viewer|null; progress:Progress[]; bookmarks:string[]; enrollments:string[] }
export interface QuizResult { is_correct:boolean; explanation:string; remediation:string|null; formula:string }
