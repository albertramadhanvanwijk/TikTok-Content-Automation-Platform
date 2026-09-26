const http=require('http');
function req(method, path, body, cookie){
  return new Promise((resolve,reject)=>{
    const data=body?JSON.stringify(body):null;
    const opts={hostname:'localhost',port:3000,path,method,headers:{'Content-Type':'application/json','Accept':'application/json'}};
    if(data) opts.headers['Content-Length']=Buffer.byteLength(data);
    if(cookie) opts.headers['Cookie']=cookie;
    const r=http.request(opts,res=>{
      let b=''; res.on('data',d=>b+=d);
      res.on('end',()=> resolve({status:res.statusCode, body:b, headers:res.headers}));
    });
    r.setTimeout(10000,()=>{r.destroy(); reject(new Error('timeout '+path))});
    r.on('error',reject);
    if(data) r.write(data);
    r.end();
  });
}
function assert(status, body, expectStatus, label){
  const ok = status===expectStatus;
  const tag = ok ? '✅ PASS' : '❌ FAIL';
  console.log(`${tag} ${label}: ${status} (expected ${expectStatus}) ${body.slice(0,400).replace(/\n/g,' ')}`);
  if(!ok) process.exitCode=1;
  return ok;
}
(async()=>{
  console.log('=== PHASE 2 PROBE START (after fixes) ===');
  const email='probeF'+Date.now()+'@test.com';
  const username='probeF'+Date.now().toString().slice(-6);
  console.log('user',email,username);
  let r=await req('POST','/auth/register',{username,email,password:'Test@1234',full_name:'Probe Final'});
  assert(r.status,r.body,201,'register');
  r=await req('POST','/auth/login',{email,password:'Test@1234'});
  assert(r.status,r.body,200,'login');
  const cookie=(r.headers['set-cookie']||[]).map(c=>c.split(';')[0]).join('; ');
  console.log('cookie',cookie.slice(0,80)+'...');

  // 1. content carousels list
  let rc=await req('GET','/content/carousels?limit=5&offset=0',null,cookie);
  assert(rc.status,rc.body,200,'GET /content/carousels list');

  // 2. create carousel
  let cr=await req('POST','/content/carousels',{title:'Final Test Carousel', description:'desc for probe', tags:['test','trading']},cookie);
  assert(cr.status,cr.body,201,'POST /content/carousels create');
  let jcr=JSON.parse(cr.body); const carId=jcr.data?.carousel?.id;
  console.log('carId',carId);
  if(!carId) throw new Error('no carId');

  // 3. PUT update carousel (previously 404)
  let pu=await req('PUT','/content/carousels/'+carId,{title:'Updated via PUT Final'},cookie);
  assert(pu.status,pu.body,200,'PUT /content/carousels/:id update title');
  let jpu=JSON.parse(pu.body); console.log('updated title',jpu.data?.carousel?.title);
  if(jpu.data?.carousel?.title!=='Updated via PUT Final'){ console.log('❌ FAIL title not updated'); process.exitCode=1; } else console.log('✅ PASS title updated correctly');

  // 4. create slides
  let s1=await req('POST','/content/carousels/'+carId+'/slides',{slide_number:1, title:'Slide 1', content_text:'hello world 1'},cookie);
  assert(s1.status,s1.body,201,'POST slide 1');
  let s2=await req('POST','/content/carousels/'+carId+'/slides',{slide_number:2, title:'Slide 2', content_text:'hello world 2'},cookie);
  assert(s2.status,s2.body,201,'POST slide 2');
  let js1=JSON.parse(s1.body); let js2=JSON.parse(s2.body);
  const slideId1=js1.data?.slide?.id; const slideId2=js2.data?.slide?.id;
  console.log('slideIds',slideId1,slideId2);

  // 5. GET slides
  let gs=await req('GET','/content/carousels/'+carId+'/slides',null,cookie);
  assert(gs.status,gs.body,200,'GET /content/carousels/:id/slides');
  let jgs=JSON.parse(gs.body); console.log('slides count',jgs.data?.slides?.length);

  // 6. reorder: PUT slide slide_number (previously 400 No updates provided)
  let ru=await req('PUT','/content/slides/'+slideId1,{slide_number:2},cookie);
  assert(ru.status,ru.body,200,'PUT /content/slides/:id slide_number reorder');
  let jru=JSON.parse(ru.body); console.log('slide after reorder slide_number',jru.data?.slide?.slide_number);

  // 6b. verify reorder persisted
  let gs2=await req('GET','/content/carousels/'+carId+'/slides',null,cookie);
  let jgs2=JSON.parse(gs2.body); console.log('slides after reorder', jgs2.data?.slides?.map(s=> `${s.title}:${s.slide_number}`).join(', '));
  const hasReordered = jgs2.data?.slides?.some(s=> s.id===slideId1 && s.slide_number===2);
  console.log(hasReordered ? '✅ PASS reorder persisted' : '❌ FAIL reorder not persisted');
  if(!hasReordered) process.exitCode=1;

  // 7. AI mock generate (previously 400 due to placeholder key not treated as mock)
  let ai=await req('POST','/ai/generate-carousel',{topic:'Trading Psychology', style:'professional', slides_count:3},cookie);
  assert(ai.status,ai.body,201,'POST /ai/generate-carousel mock');
  let jai=JSON.parse(ai.body); console.log('ai mock flag', jai.data?.mock, 'carousel?', !!jai.data?.carousel, 'slides', jai.data?.slides?.length);
  if(!jai.data?.mock){ console.log('❌ FAIL ai mock flag missing'); process.exitCode=1; } else console.log('✅ PASS ai mock flag true');
  const aiCarId=jai.data?.carousel?.id;
  console.log('aiCarId',aiCarId);

  // 8. TikTok auth-url mock (previously client_key= empty)
  let ta=await req('GET','/tiktok/auth-url?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Ftiktok%2Fcallback',null,cookie);
  assert(ta.status,ta.body,200,'GET /tiktok/auth-url mock');
  let jta=JSON.parse(ta.body); console.log('auth_url',jta.data?.auth_url?.slice(0,300), 'mock',jta.data?.mock);
  if(!jta.data?.mock || !jta.data?.auth_url?.includes('mock=1')){ console.log('❌ FAIL tiktok auth-url not mock'); process.exitCode=1; } else console.log('✅ PASS tiktok auth-url mock=1');

  // 9. TikTok connect mock (previously 404)
  let tc=await req('POST','/tiktok/connect',{code:'mock_code_123', redirect_uri:'http://localhost:3001/tiktok/callback'},cookie);
  assert(tc.status,tc.body,201,'POST /tiktok/connect mock');
  let jtc=JSON.parse(tc.body); console.log('connect account', jtc.data?.account?.id || jtc.data?.id || JSON.stringify(jtc.data).slice(0,500));
  const accId=jtc.data?.account?.id || jtc.data?.id || jtc.data?.tiktok_account?.id;
  // fallback: fetch accounts
  let accs=await req('GET','/tiktok/accounts',null,cookie);
  assert(accs.status,accs.body,200,'GET /tiktok/accounts');
  let jaccs=JSON.parse(accs.body); const accounts=jaccs.data?.accounts || jaccs.data || [];
  console.log('accounts count',accounts.length, 'first', accounts[0]?.id);
  const finalAccId=accId || accounts[0]?.id;
  console.log('finalAccId',finalAccId);
  if(!finalAccId){ console.log('❌ FAIL no tiktok account'); process.exitCode=1; }

  // 10. create upload job with placeholder.mp4 (previously 400 Video file not found)
  let carForJob = aiCarId || carId;
  let uj=await req('POST','/tiktok/upload-jobs',{carousel_id:carForJob, tiktok_account_id:finalAccId, video_file_path:'placeholder.mp4', title:'Test Upload Job Probe Final'},cookie);
  assert(uj.status,uj.body,201,'POST /tiktok/upload-jobs placeholder.mp4');
  let juj=JSON.parse(uj.body); const jobId=juj.data?.job?.id || juj.data?.id || juj.data?.upload_job?.id;
  console.log('jobId',jobId, 'status', juj.data?.job?.status || juj.data?.status);
  if(!jobId){ console.log('❌ FAIL no jobId'); process.exitCode=1; }

  // 11. get job status
  if(jobId){
    let js=await req('GET','/tiktok/upload-jobs/'+jobId,null,cookie);
    assert(js.status,js.body,200,'GET /tiktok/upload-jobs/:id');
    let jjs=JSON.parse(js.body); console.log('job status', jjs.data?.job?.status || jjs.data?.status);
    // 12. process job mock (previously would try fs.readFileSync and fail)
    let pr=await req('POST','/tiktok/upload-jobs/'+jobId+'/process',{},cookie);
    // endpoint might be POST /tiktok/upload-jobs/:id/process — check actual route
    if(pr.status===404){
      console.log('process endpoint 404, body',pr.body.slice(0,500));
      // try alternative?
      // check tiktokRoutes for process name
    } else {
      assert(pr.status,pr.body,200,'POST /tiktok/upload-jobs/:id/process mock publish');
      let jpr=JSON.parse(pr.body); console.log('process result', JSON.stringify(jpr.data).slice(0,500));
    }
    // verify published
    let js2=await req('GET','/tiktok/upload-jobs/'+jobId,null,cookie);
    let jjs2=JSON.parse(js2.body); console.log('job status after process', jjs2.data?.job?.status || jjs2.data?.status, 'video_id', jjs2.data?.job?.tiktok_video_id || jjs2.data?.tiktok_video_id);
    const isPublished = (jjs2.data?.job?.status==='published') || (jjs2.data?.status==='published');
    console.log(isPublished ? '✅ PASS job published (mock)' : '❌ FAIL job not published after process');
    if(!isPublished) process.exitCode=1;
  }

  // 13. DELETE template (previously route missing)
  let tcr=await req('POST','/content/templates',{name:'Probe Tmpl Final', style_name:'modern', style_data:{color:'#000'}},cookie);
  assert(tcr.status,tcr.body,201,'POST /content/templates');
  let jtcr=JSON.parse(tcr.body); const tmplId=jtcr.data?.template?.id;
  console.log('tmplId',tmplId);
  let delT=await req('DELETE','/content/templates/'+tmplId,null,cookie);
  assert(delT.status,delT.body,200,'DELETE /content/templates/:id');
  let gt2=await req('GET','/content/templates',null,cookie);
  assert(gt2.status,gt2.body,200,'GET /content/templates after delete');
  let jgt2=JSON.parse(gt2.body); const stillExists=(jgt2.data?.templates||jgt2.data||[]).some(t=> t.id===tmplId);
  console.log(stillExists ? '❌ FAIL template still exists' : '✅ PASS template deleted');
  if(stillExists) process.exitCode=1;

  // 14. DELETE carousel
  let delC=await req('DELETE','/content/carousels/'+carId,null,cookie);
  assert(delC.status,delC.body,200,'DELETE /content/carousels/:id');
  let gcAfter=await req('GET','/content/carousels/'+carId,null,cookie);
  // after delete should be 404
  assert(gcAfter.status,gcAfter.body,404,'GET deleted carousel should 404');

  // 15. schedule carousel (must have slides — business rule)
  let cr2=await req('POST','/content/carousels',{title:'Sched Test', description:'sched'},cookie);
  assert(cr2.status,cr2.body,201,'POST /content/carousels Sched Test create');
  let jcr2=JSON.parse(cr2.body); const schedCarId=jcr2.data?.carousel?.id;
  // add at least 1 slide before scheduling
  let schSlide=await req('POST','/content/carousels/'+schedCarId+'/slides',{slide_number:1, title:'Sched Slide 1', content_text:'content for sched'},cookie);
  assert(schSlide.status,schSlide.body,201,'POST slide for sched carousel');
  // verify slides_count updated
  let gcSched=await req('GET','/content/carousels/'+schedCarId,null,cookie);
  let jgcSched=JSON.parse(gcSched.body); console.log('sched carousel slides_count', jgcSched.data?.carousel?.slides_count);
  // also verify empty carousel cannot be scheduled (negative case)
  let crEmpty=await req('POST','/content/carousels',{title:'Empty Sched Test'},cookie);
  let jEmpty=JSON.parse(crEmpty.body); const emptyId=jEmpty.data?.carousel?.id;
  let schedEmpty=await req('POST','/content/carousels/'+emptyId+'/schedule',{scheduled_at:new Date(Date.now()+3600*1000).toISOString()},cookie);
  assert(schedEmpty.status,schedEmpty.body,400,'POST /content/carousels/:id/schedule empty should 400');
  console.log(schedEmpty.body.slice(0,300).includes('without slides') ? '✅ PASS empty schedule correctly rejected' : 'note: empty schedule rejection message unexpected');
  await req('DELETE','/content/carousels/'+emptyId,null,cookie);
  let future=new Date(Date.now()+ 3600*1000).toISOString();
  let sch=await req('POST','/content/carousels/'+schedCarId+'/schedule',{scheduled_at:future},cookie);
  assert(sch.status,sch.body,200,'POST /content/carousels/:id/schedule with slides');

  // 16. analytics
  let an=await req('GET','/analytics/dashboard',null,cookie);
  assert(an.status,an.body,200,'GET /analytics/dashboard');

  console.log('=== PHASE 2 PROBE DONE ===');
  if(process.exitCode===1) console.log('❌ SOME CHECKS FAILED');
  else console.log('✅ ALL CHECKS PASSED');
})().catch(e=>{console.error('PROBE ERR',e); process.exit(1)});
