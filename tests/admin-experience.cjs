const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{let name=path.join(root,req.url.split('?')[0]);if(name.endsWith('/'))name+='index.html';try{res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(name));}catch{res.statusCode=404;res.end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
 const page=await browser.newPage();const catalog=JSON.parse(fs.readFileSync(path.join(root,'admin/catalog.json')));await page.route('https://example.com/meal.jpg',route=>route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(root,catalog.recipes[0].image))}));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/admin/supabase.js',route=>route.fulfill({contentType:'application/javascript',body:`window.fixtureRows=[];window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:'fixture@example.com'}}}}),onAuthStateChange:()=>{}},rpc:async(name,args)=>{if(name==='is_tamaddi_admin')return {data:true};if(window.fixtureDelay)await new Promise(r=>setTimeout(r,window.fixtureDelay));if(window.fixtureFailure)return {error:{message:'Fixture connection failure'}};if(name==='admin_support_read')return {data:{inbox_refresh:false,email:'fixture@example.com',screenshot_private:true,users:0,new_users:0,total:0,unanswered:0,statuses:{},categories:{},response_hours:null,resolution_hours:null,activity:[],days:[],rows:[],count:0,synced_kitchens:0}};if(name==='admin_ai_report')return {data:{requests:0,failures:0,average_latency_ms:null,total_tokens:null,metered_requests:0,models:[],features:[],days:[]}};if(name==='admin_meal_catalog')return {data:structuredClone(fixtureRows)};if(name==='admin_save_meal'){let row=fixtureRows.find(r=>r.id===args.meal_id);if(!row){row={id:args.meal_id,revision:0};fixtureRows.push(row);}if(row.revision!==args.expected_revision)return {error:{message:'meal_changed_reload_before_saving'}};row.revision++;if(args.operation!=='unpublish')row.draft=args.content;if(args.operation==='publish'){row.published=args.content;row.visible=true;}if(args.operation==='unpublish')row.visible=false;return {data:row.revision};}return {data:[]};}})};`}));
 await page.goto('http://127.0.0.1:'+port+'/admin/#3');
 const names=['Overview','Reports & Support','Users','Meals & Recipes','Products & Ingredients','AI & Usage','Analytics','Activity Log','Settings'];
 for(const width of [1440,820,390]){
  await page.setViewportSize({width,height:1000});
  for(let section=0;section<9;section++){
   await page.locator('#nav a').nth(section).click();await page.waitForFunction(i=>document.querySelector('#content').dataset.section===String(i),section);
   await page.waitForTimeout(450);assert.equal(await page.locator('#title').textContent(),names[section]);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+names[section]+' at '+width);
   assert.equal(await page.locator('#notice.error').count(),0,names[section]+' rendered without error');
   await page.screenshot({path:'/tmp/tamaddi-workspace-'+section+'-'+width+'.png',fullPage:true});
  }
 }
 await page.evaluate(()=>{window.fixtureDelay=700;location.hash='2';});await page.locator('.workspace-loading').waitFor();await page.waitForFunction(()=>document.querySelector('#content').dataset.section==='2');await page.locator('.workspace-loading').waitFor({state:'detached'});
 await page.evaluate(()=>{fixtureDelay=0;fixtureFailure=true;location.hash='5';});await page.locator('#notice.error button').waitFor();await page.evaluate(()=>{fixtureFailure=false;});await page.locator('#notice.error button').click();await page.waitForFunction(()=>document.querySelector('#content').dataset.section==='5');assert.equal(await page.locator('#notice.error').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#nav a').nth(6).click();await page.waitForFunction(()=>document.querySelector('#content').dataset.section==='6');assert.equal(await page.evaluate(()=>document.querySelector('#content').getAnimations().filter(a=>a.playState==='running').length),0);
 assert.deepEqual(errors,[]);console.log('PASS: nine destinations at 1440/820/390px, empty states, navigation, delayed skeleton, retry recovery, reduced motion, no overflow or JS errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
