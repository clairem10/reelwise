"""Regenerate the versioned curriculum seed. Input stays outside public/ and src/."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
m=json.loads((root/'scripts/curriculum-source.json').read_text())
def sql(v):
 if v is None:return 'null'
 if isinstance(v,bool):return 'true' if v else 'false'
 if isinstance(v,int):return str(v)
 return "'"+str(v).replace("'","''")+"'"
lines=['begin;','-- Original Reelwise explanations and metadata links. No copied textbook prose/artwork.']
def insert(table,row,conflict):
 cols=','.join(row);vals=','.join(sql(x) for x in row.values());updates=','.join(f'{k}=excluded.{k}' for k in row if k not in conflict)
 lines.append(f'insert into {table} ({cols}) values ({vals}) on conflict ({",".join(conflict)}) do update set {updates};')
insert('public.courses',dict(id='data140',title='Probability for Data Science',code='DATA 140',term=m['term'],description='Original short-form chapter introductions for independent study alongside UC Berkeley Data 140.',source_url=m['home'],coverage=m['coverage'],published=True),['id'])
for l in m['chapters']:
 id=f'data140-ch{l["chapter"]:02}'
 # Store the array as a JSON literal cast to text[] using a follow-up expression.
 insert('public.lessons',dict(id=id,course_id='data140',position=l['chapter'],title=l['title'],topic=l['chapterTitle'],hook=l['hook'],transcript='PLACEHOLDER',formula=l['formula'],video_path='/'+l['video'],duration_seconds=18,source_url=l['source'],narrated_url=l.get('narratedUrl'),embed_url=l.get('embedUrl'),published=True),['id'])
 lines[-1]=lines[-1].replace("'PLACEHOLDER'",'ARRAY['+','.join(sql(x) for x in l['frames'])+']')
 options=list(l['answers']);correct=l['correct']
 if l['chapter']%2==0:options.reverse();correct=len(options)-1-correct
 insert('public.quiz_questions',dict(id=id+'-check',lesson_id=id,prompt=l['q'],options=json.dumps(options)),['id'])
 insert('private.quiz_keys',dict(question_id=id+'-check',correct_option=correct,explanation=l['why'],remediation=l['why']+' '+l['formula']),['question_id'])
for s in m['sources']:
 insert('public.course_sources',dict(course_id='data140',title=s['title'],path=s['path'],kind=s['kind'],chapter=s['chapter'],url=s['url']),['course_id','path'])
lines.append('commit;');(root/'supabase/migrations/202611050002_curriculum.sql').write_text('\n'.join(lines)+'\n')
