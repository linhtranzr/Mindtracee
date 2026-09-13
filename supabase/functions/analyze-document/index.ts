import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
const cors={ 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' }
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
 try{
  const authorization=req.headers.get('Authorization'); if(!authorization) throw new Error('Bạn cần đăng nhập lại.')
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}}})
  const {data:{user}}=await db.auth.getUser(); if(!user) throw new Error('Phiên đăng nhập không hợp lệ.')
  const body=await req.json(); const documentId=String(body.documentId||''); const title=String(body.title||'Tài liệu').slice(0,300)
  const pages=(Array.isArray(body.pages)?body.pages:[]).slice(0,80).map((p:{page?:number;text?:string})=>({page:Number(p.page),text:String(p.text||'').slice(0,6000)})).filter((p:{page:number;text:string})=>p.page>0&&p.text)
  if(!documentId||!pages.length) throw new Error('Không trích xuất được nội dung PDF.')
  let remaining=24000; const excerpts:string[]=[]
  for(const p of pages){if(remaining<=0)break;const text=p.text.slice(0,remaining);excerpts.push(`[TRANG ${p.page}]\n${text}`);remaining-=text.length}
  const key=Deno.env.get('GROQ_API_KEY'); if(!key) throw new Error('GROQ_KEY_MISSING: Chưa cấu hình GROQ_API_KEY.')
  const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:Deno.env.get('GROQ_MODEL')||'openai/gpt-oss-20b',response_format:{type:'json_object'},temperature:.2,max_completion_tokens:2200,messages:[{role:'system',content:'Bạn là trợ lý học tập MindTrace. Chỉ dùng nội dung tài liệu. Trả JSON hợp lệ gồm summary (string), key_points (array {text,page}), simple_explanations (array {concept,explanation,page}), terms (array {term,definition,page}), review_questions (array string). Không bịa nguồn; page phải là số trang xuất hiện trong nhãn.'},{role:'user',content:`Phân tích tài liệu "${title}" để người đọc học nhanh và hiểu sâu.\n\n${excerpts.join('\n\n')}`} ]})})
  const payload=await response.json(); if(!response.ok){if(response.status===429)throw new Error('GROQ_RATE_LIMIT: Đã chạm giới hạn miễn phí.');throw new Error(payload?.error?.message||'Groq chưa thể phân tích.')}
  const raw=String(payload?.choices?.[0]?.message?.content||''); let content; try{content=JSON.parse(raw)}catch{throw new Error('AI trả về dữ liệu không hợp lệ. Hãy thử lại.')}
  const {error}=await db.from('document_insights').upsert({user_id:user.id,document_id:documentId,content,source_pages:pages.length,updated_at:new Date().toISOString()},{onConflict:'user_id,document_id'}); if(error)throw error
  return new Response(JSON.stringify({content}),{headers:{...cors,'Content-Type':'application/json'}})
 }catch(error){return new Response(JSON.stringify({error:error instanceof Error?error.message:'Đã có lỗi.'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
})
