const http=require('http');
function req(method, path, body, cookie){
  return new Promise((resolve,reject)=>{
    const data=body?JSON.stringify(body):null;
    const opts={hostname:'localhost',port:3000,path,method,headers:{'Content-Type':'application/json'}};
    if(data) opts.headers['Content-Length']=Buffer.byteLength(data);
    if(cookie) opts.headers['Cookie']=cookie;
    const r=http.request(opts,res=>{
      let b=''; res.on('data',d=>b+=d);
      res.on('end',()=> resolve({status:res.statusCode, body:b, headers:res.headers}));
    });
    r.setTimeout(8000,()=>{r.destroy(); reject(new Error('timeout '+path))});
    r.on('error',reject);
    if(data) r.write(data);
    r.end();
  });
}
(async()=>{
  const email='probeB'+Date.now()+'@test.com';
  const username='probeB'+Date.now().toString().slice(-6);
  let r=await req('POST','/auth/register',{username,email,password:'Test@1234',full_name:'Probe B'});
  console.log('register',r.status);
  r=await req('POST','/auth/login',{email,password:'Test@1234'});
  console.log('login',r.status, r.body.slice(0,400));
  const cookie=(r.headers['set-cookie']||[]).map(c=>c.split(';')[0]).join('; ');
  console.log('cookie',cookie.slice(0,80)+'...');
  // create carousel
  let rc=await req('POST','/content/carousels',{title:'Carousel For Job', description:'desc'},cookie);
  console.log('create carousel',rc.status, rc.body.slice(0,600));
  let jc=JSON.parse(rc.body); const carId=jc.data?.carousel?.id;
  console.log('carId',carId);
  // add slide
  let rs=await req('POST','/content/carousels/'+carId+'/slides',{slide_number:1, title:'S1', content_text:'hello'},cookie);
  console.log('create slide',rs.status, rs.body.slice(0,600));
  // test PUT update carousel (expected 404)
  let rp=await req('PUT','/content/carousels/'+carId,{title:'Updated Title'},cookie);
  console.log('PUT carousel',rp.status, rp.body.slice(0,800));
  // test reorder: update slide slide_number
  let js=JSON.parse(rs.body); const slideId=js.data?.slide?.id;
  let ru=await req('PUT','/content/slides/'+slideId,{slide_number:2},cookie);
  console.log('PUT slide slide_number',ru.status, ru.body.slice(0,800));
  // create second slide
  let rs2=await req('POST','/content/carousels/'+carId+'/slides',{slide_number:2, title:'S2', content_text:'world'},cookie);
  console.log('create slide2',rs2.status, rs2.body.slice(0,400));
  let rg=await req('GET','/content/carousels/'+carId+'/slides',null,cookie);
  console.log('GET slides',rg.status, rg.body.slice(0,1500));
  // test DELETE template route missing
  let rt=await req('POST','/content/templates',{name:'Tmpl Test', style_name:'modern', style_data:{color:'#000'}},cookie);
  console.log('create template',rt.status, rt.body.slice(0,800));
  let jt=JSON.parse(rt.body); const tmplId=jt.data?.template?.id;
  console.log('tmplId',tmplId);
  let rd=await req('DELETE','/content/templates/'+tmplId,null,cookie);
  console.log('DELETE template',rd.status, rd.body.slice(0,800));
  let rl=await req('GET','/content/templates',null,cookie);
  console.log('GET templates after',rl.status, rl.body.slice(0,800));
  // test authStore flow: updateProfile
  let ru2=await req('PUT','/auth/profile',{full_name:'Updated Name'},cookie);
  console.log('PUT /auth/profile',ru2.status, ru2.body.slice(0,600));
  // test upload image without file
  let ri=await req('POST','/upload/image',{},cookie);
  console.log('POST /upload/image no file',ri.status, ri.body.slice(0,600));
  // test analytics
  let ra=await req('GET','/analytics/dashboard',null,cookie);
  console.log('GET /analytics/dashboard',ra.status, ra.body.slice(0,800));
  // test TikTok with placeholder key -> should hit mock path? Check what happens
  let rta=await req('GET','/tiktok/auth-url?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Ftiktok%2Fcallback',null,cookie);
  console.log('tiktok auth-url',rta.status, rta.body.slice(0,800));
  console.log('auth-url client_key empty?', rta.body.includes('client_key=&'));
  let rtc=await req('POST','/tiktok/connect',{code:'mock_code_test', redirect_uri:'http://localhost:3001/tiktok/callback'},cookie);
  console.log('tiktok connect',rtc.status, rtc.body.slice(0,1000));
  let rtb=await req('GET','/tiktok/accounts',null,cookie);
  console.log('tiktok accounts',rtb.status, rtb.body.slice(0,800));
  console.log('=== probe-phase1b done ===');
})().catch(e=>{console.error('ERR',e); process.exit(1)});
