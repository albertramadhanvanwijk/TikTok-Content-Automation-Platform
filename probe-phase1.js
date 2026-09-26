const http=require('http');
function req(method, path, body, cookie){
  return new Promise((resolve,reject)=>{
    const data=body?JSON.stringify(body):null;
    const opts={hostname:'localhost',port:3000,path,method,headers:{'Content-Type':'application/json', 'Accept':'application/json'}};
    if(data) opts.headers['Content-Length']=Buffer.byteLength(data);
    if(cookie) opts.headers['Cookie']=cookie;
    const r=http.request(opts,res=>{
      let b=''; res.on('data',d=>b+=d);
      res.on('end',()=> resolve({status:res.statusCode, headers:res.headers, body:b}));
    });
    r.setTimeout(8000,()=>{r.destroy(); reject(new Error('timeout '+path))});
    r.on('error',reject);
    if(data) r.write(data);
    r.end();
  });
}
(async()=>{
  const email='probe'+Date.now()+'@test.com';
  const username='probe'+Date.now().toString().slice(-6);
  console.log('=== PHASE 1 PROBE START ===');
  console.log('email',email,'username',username);
  let r=await req('POST','/auth/register',{username,email,password:'Test@1234',full_name:'Probe User'});
  console.log('1 register',r.status, r.body.slice(0,600));
  r=await req('POST','/auth/login',{email,password:'Test@1234'});
  console.log('2 login',r.status, r.body.slice(0,800));
  const sc=r.headers['set-cookie']||[];
  console.log('set-cookie count',sc.length);
  if(sc[0]) console.log('set-cookie[0]', sc[0].slice(0,300));
  const cookie=sc.map(c=>c.split(';')[0]).join('; ');
  console.log('cookie header', cookie.slice(0,300));
  let r2=await req('GET','/auth/profile',null,cookie);
  console.log('3 profile',r2.status, r2.body.slice(0,600));
  let r3=await req('GET','/content/carousels?limit=5&offset=0',null,cookie);
  console.log('4 carousels list',r3.status, r3.body.slice(0,1000));
  let j; try{j=JSON.parse(r3.body);}catch(e){console.log('parse fail',e.message)}
  const items=(j&&j.data)?(j.data.items||[]):[];
  console.log('items count',items.length);
  if(items.length>0){
    const id=items[0].id;
    console.log('testing carousel',id);
    let rp=await req('PUT','/content/carousels/'+id,{title:'Probe Updated '+Date.now()},cookie);
    console.log('5 PUT carousel',rp.status, rp.body.slice(0,800));
    let rg=await req('GET','/content/carousels/'+id,null,cookie);
    console.log('6 GET carousel',rg.status, rg.body.slice(0,800));
    let rs=await req('GET','/content/carousels/'+id+'/slides',null,cookie);
    console.log('7 GET slides',rs.status, rs.body.slice(0,1500));
  } else {
    console.log('no carousels to test PUT/slides - creating one');
    let rc=await req('POST','/content/carousels',{title:'Probe Carousel', description:'test', tags:['test']},cookie);
    console.log('create carousel',rc.status, rc.body.slice(0,800));
    if(rc.status===201){
      let jc=JSON.parse(rc.body);
      const nid=jc.data?.carousel?.id||jc.data?.id;
      console.log('new id',nid);
      if(nid){
        let rs2=await req('POST','/content/carousels/'+nid+'/slides',{slide_number:1, title:'Slide 1', content_text:'hello'},cookie);
        console.log('create slide',rs2.status, rs2.body.slice(0,800));
        let rg2=await req('GET','/content/carousels/'+nid+'/slides',null,cookie);
        console.log('get slides after',rg2.status, rg2.body.slice(0,1500));
        let ru=await req('PUT','/content/carousels/'+nid,{title:'Updated via PUT'},cookie);
        console.log('PUT update title',ru.status, ru.body.slice(0,800));
      }
    }
  }
  let rt=await req('GET','/content/templates',null,cookie);
  console.log('8 GET templates',rt.status, rt.body.slice(0,800));
  let ra=await req('POST','/ai/generate-carousel',{topic:'Trading Psychology', style:'professional', slides_count:3},cookie);
  console.log('9 ai generate',ra.status, ra.body.slice(0,2000));
  let rta=await req('GET','/tiktok/auth-url?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Ftiktok%2Fcallback',null,cookie);
  console.log('10 tiktok auth-url',rta.status, rta.body.slice(0,1000));
  let rj=await req('POST','/tiktok/connect',{code:'mock_code_123', redirect_uri:'http://localhost:3001/tiktok/callback'},cookie);
  console.log('11 tiktok connect',rj.status, rj.body.slice(0,1000));
  let rjp=await req('GET','/tiktok/accounts',null,cookie);
  console.log('12 tiktok accounts',rjp.status, rjp.body.slice(0,1000));
  // try create upload job with required fields
  let aparse; try{ aparse=JSON.parse(rjp.body);}catch(e){}
  const acc=(aparse&&aparse.data&&aparse.data.accounts&&aparse.data.accounts[0])?aparse.data.accounts[0]:null;
  console.log('acc',acc?acc.id:'none');
  // get a carousel id for job
  let rc2=await req('GET','/content/carousels?limit=1&offset=0',null,cookie);
  let jc2; try{jc2=JSON.parse(rc2.body);}catch(e){}
  const car=(jc2&&jc2.data&&jc2.data.items&&jc2.data.items[0])?jc2.data.items[0]:null;
  console.log('car for job',car?car.id:'none');
  if(car&&acc){
    // need a real file path - create dummy
    const fs=require('fs'); const path=require('path');
    const dummyPath=path.join(__dirname,'uploads','probe_dummy.mp4');
    try{ fs.mkdirSync(path.dirname(dummyPath),{recursive:true}); if(!fs.existsSync(dummyPath)) fs.writeFileSync(dummyPath, Buffer.alloc(100)); }catch(e){}
    console.log('dummyPath exists?', fs.existsSync(dummyPath));
    let rjob=await req('POST','/tiktok/upload-jobs',{carousel_id:car.id, tiktok_account_id:acc.id, video_file_path:dummyPath, title:'Test upload'},cookie);
    console.log('13 create upload job',rjob.status, rjob.body.slice(0,1500));
    // also test missing fields
    let rjob2=await req('POST','/tiktok/upload-jobs',{carousel_id:car.id, tiktok_account_id:acc.id},cookie);
    console.log('14 create upload job missing fields',rjob2.status, rjob2.body.slice(0,800));
  }
  console.log('=== PHASE 1 PROBE DONE ===');
})().catch(e=>{console.error('PROBE ERR',e); process.exit(1)});
