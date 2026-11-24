/* Shared platform pages use the same authorized RPC boundary as support. */
let autoRefresh = true;
let platformFilters = {};
const safe = escapeHTML;
const field = (name,label,type='text',value='') => `<label>${label}<input name="${name}" type="${type}" value="${safe(value)}"></label>`;
const unavailable = message => `<div class="capability-note"><b>Data availability</b><p>${safe(message)}</p></div>`;
const pager = count => `<div class="pager"><button id="platform-prev" ${page===0?'disabled':''}>Previous</button><span>${count} results · Page ${page+1}</span><button id="platform-next" ${(page+1)*25>=count?'disabled':''}>Next</button></div>`;
function wirePlatformFilters(count) {
 const form=$('#platform-filters');
 if(form)form.onsubmit=event=>{event.preventDefault();platformFilters=Object.fromEntries(new FormData(form));page=0;render();};
 if($('#platform-prev')){
  $('#platform-prev').onclick=()=>{page--;render();};
  $('#platform-next').onclick=()=>{page++;render();};
 }
}
function platformForm(extra='') {
 return `<form id="platform-filters" class="filters">${[5,6].includes(route().section)?'':field('search','Search','search',platformFilters.search||'')}${field('after','From','date',platformFilters.after||'')}${field('before','Through','date',platformFilters.before||'')}${extra}<button>Apply filters</button></form>`;
}
let lastPlatformSection;
async function renderPlatform(state,id) {
 if(lastPlatformSection!==state.section){platformFilters={};lastPlatformSection=state.section;}
 const section=state.section;
 const load = view => rpc('admin_support_read',{options:{...platformFilters,page,view,user:state.user}});
 const current = () => id===generation&&authorized;
 if(section===2) {
  if(state.user) {
   const user=await load('user'); if(!current())return;
   $('#content').innerHTML=`<a href="#2">← All users</a><section class="panel"><h2>${safe(user.name||user.email||'Account')}</h2><p>${safe(user.email)}<br>${safe(user.id)}</p><div class="cards">${card('Support requests',user.support_requests)}${card('Synced pantry items',user.pantry_items??'Not synced')}${card('Synced grocery items',user.grocery_items??'Not synced')}${card('Recorded shopping trips',user.recorded_trips??'Not synced')}</div><p>Created ${date(user.created_at)} · Last sign-in ${date(user.last_sign_in_at)}</p><button id="user-support">View this user’s requests</button></section>${unavailable('Kitchen counts describe the latest account snapshot. They do not measure active users or engagement. Passwords and authentication credentials are never returned.')}`;
   const history=await rpc('admin_support_read',{options:{view:'inbox',user:user.id,page:0}});
   if(!current())return;
   const profile=document.createElement('section');profile.className='panel user-history';
   profile.innerHTML='<div class="panel-heading"><div><h2>Support request history</h2><p>Latest 25 requests for this account</p></div></div><div class="profile-request-list">'+history.rows.map(request=>'<a href="#1/'+request.user_id+'/'+request.request_id+'"><div><b>'+safe(request.subject)+'</b><small>'+kinds[request.kind]+' · '+date(request.created_at)+'</small></div><span class="badge">'+statuses[request.status]+'</span></a>').join('')+'</div>';
   if(!history.rows.length)profile.innerHTML+='<p>No support requests for this account.</p>';
   $('#content').append(profile);
   $('#user-support').onclick=()=>{filters={user:user.id};location.hash='1';};
  } else {
   const data=await load('users');if(!current())return;
   $('#content').innerHTML=platformForm(`<label>Sort<select name="sort">${options({newest:'Newest accounts',oldest:'Oldest accounts'},platformFilters.sort)}</select></label>`)+`<div class="table-wrap"><table><thead><tr><th>Account</th><th>Joined</th><th>Last sign-in</th><th>Support</th><th>Kitchen</th></tr></thead><tbody>${data.rows.map(u=>`<tr><td><a href="#2/${u.id}">${safe(u.name||u.email||'Account')}</a><small>${safe(u.email)}</small></td><td>${date(u.created_at)}</td><td>${date(u.last_sign_in_at)}</td><td>${u.support_requests}</td><td>${u.has_synced_kitchen?'Synced':'Not synced'}</td></tr>`).join('')||'<tr><td colspan="5">No matching accounts.</td></tr>'}</tbody></table></div>`+pager(data.count);
   wirePlatformFilters(data.count);
  }
 } else if(section===3||section===4) {
  const response=await fetch('/admin/catalog.json');if(!response.ok)throw Error('Could not load the app catalog.');
  const catalog=await response.json();if(!current())return;
  const query=(platformFilters.search||'').toLowerCase();
  const recipes=catalog.recipes.filter(r=>(r.title+' '+r.keyIngredients.join(' ')).toLowerCase().includes(query)&&(!platformFilters.category||r.tags.includes(platformFilters.category)));
  const tags=Object.fromEntries([...new Set(catalog.recipes.flatMap(r=>r.tags))].sort().map(t=>[t,t]));
  const ingredientMap=new Map();
  catalog.recipes.forEach(r=>r.keyIngredients.forEach(name=>{if(!ingredientMap.has(name))ingredientMap.set(name,[]);ingredientMap.get(name).push(r.title);}));
  const ingredients=[...ingredientMap].filter(([name])=>name.toLowerCase().includes(query)).sort(([a],[b])=>a.localeCompare(b));
  $('#content').innerHTML=unavailable(section===3?'Recipes and preparation content are shipped inside the iOS application. This view reads that exact catalog. Publishing, editing and deletion require a shared catalog and an app release integration, which do not exist yet.':'These are ingredients referenced by the app’s recipe catalog. User inventory is private account data, not a shared product catalog. Shared product editing and image publishing are unavailable in the current architecture.')+
   `<form id="platform-filters" class="filters">${field('search','Search catalog','search',platformFilters.search||'')}${section===3?`<label>Category<select name="category">${options({'':'All categories',...tags},platformFilters.category)}</select></label>`:''}<button>Search</button></form>`+
   (section===3?`<div class="catalog-grid">${recipes.slice(page*24,(page+1)*24).map(r=>`<details class="panel recipe-card"><summary><img src="${safe(r.image)}" alt="" loading="lazy"><h2>${safe(r.title)}</h2><p>${safe(r.time)} · ${safe(r.difficulty)}</p><span class="badge">${r.browsable?'In app browse catalog':'Retained for saved meals'}</span></summary><p>${safe(r.subtitle)}</p><h3>Ingredients</h3>${r.ingredientBaseServings?'<p>Quantities shown for '+safe(r.ingredientBaseServings)+' serving(s).</p>':''}<ul>${r.keyIngredients.map(name=>`<li>${safe(name)}${r.ingredientAmounts?.[name]?.quantity!=null?' · '+safe(r.ingredientAmounts[name].quantity)+' '+safe(r.ingredientAmounts[name].unit):''}</li>`).join('')}</ul><p>${safe(r.servings)}</p>${r.recipeSources?.length?'<h3>Recipe sources</h3>'+r.recipeSources.map(url=>'<p><a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">'+safe(url)+'</a></p>').join(''):''}</details>`).join('')||'<p>No matching meals.</p>'}</div>`:
    `<div class="table-wrap"><table><thead><tr><th>Ingredient</th><th>Referenced in</th></tr></thead><tbody>${ingredients.slice(page*24,(page+1)*24).map(([name,meals])=>`<tr><td>${safe(name)}</td><td style="white-space:normal">${meals.map(title=>'<button type="button" class="recipe-reference" data-recipe-name="'+safe(title)+'">'+safe(title)+'</button>').join(' ')}</td></tr>`).join('')||'<tr><td>No matching ingredients.</td></tr>'}</tbody></table></div>`);
  const count=section===3?recipes.length:ingredients.length;
  $('#content').insertAdjacentHTML('beforeend',`<div class="pager"><button id="platform-prev" ${page===0?'disabled':''}>Previous</button><span>${count} entries</span><button id="platform-next" ${(page+1)*24>=count?'disabled':''}>Next</button></div>`);
  wirePlatformFilters(count);
  document.querySelectorAll('[data-recipe-name]').forEach(button=>button.onclick=()=>{
   platformFilters={search:button.dataset.recipeName};lastPlatformSection=3;page=0;location.hash='3';
  });
 } else if(section===5) {
  const {data,error}=await client.rpc('admin_ai_report',{after_date:platformFilters.after||new Date(Date.now()-29*86400000).toISOString().slice(0,10),before_date:platformFilters.before||new Date().toISOString().slice(0,10)});
  if(error)throw error;if(!current())return;
  $('#content').innerHTML=platformForm()+`<div class="cards">${card('AI requests',data.requests)}${card('Failed requests',data.failures)}${card('Average response time',data.average_latency_ms===null?'—':(data.average_latency_ms/1000).toFixed(2)+' s')}${card('Provider-reported tokens',data.total_tokens??'—',data.metered_requests+' metered requests')}</div><section class="panel"><h2>Usage by model</h2><div class="table-wrap"><table><thead><tr><th>Model</th><th>Requests</th><th>Tokens</th></tr></thead><tbody>${data.models.map(m=>`<tr><td>${safe(m.model)}</td><td>${m.requests}</td><td>${m.tokens??'Not reported'}</td></tr>`).join('')||'<tr><td colspan="3">No recorded usage in this range.</td></tr>'}</tbody></table></div><h2 style="margin-top:24px">Usage by feature</h2>${data.features.map(f=>`<p>${safe(f.feature)} · ${f.requests} requests</p>`).join('')||'<p>No usage recorded.</p>'}<h2>Requests over time</h2>${chartPanel(data.days,'n','Recorded AI requests')}</section>${unavailable('Only requests made after deployment of usage instrumentation are recorded. Historical usage is unavailable. Provider billing and pricing rates are not connected, so actual or estimated costs cannot be calculated. No prompts, kitchen contents or credentials are stored in usage records.')}`;
  wirePlatformFilters();
 } else if(section===6) {
  const data=await load('analytics');if(!current())return;
  const days=data.days||[];
  const max=Math.max(1,...days.flatMap(d=>[d.registrations,d.requests]));
  $('#content').innerHTML=platformForm()+`<div class="cards">${card('Registrations in range',days.reduce((sum,d)=>sum+d.registrations,0))}${card('Support submissions',days.reduce((sum,d)=>sum+d.requests,0))}${card('Synced kitchen accounts',data.synced_kitchens,'Current total, outside date filter')}</div><div class="analytics-pair">${chartPanel(days,'registrations','Registrations over time')}${chartPanel(days,'requests','Support submissions','#8198bc')}</div>${unavailable('Last sign-in is not an active-user measure. Meal engagement, product usage and AI consumption are not reliably recorded in the current backend.')}`;
  wirePlatformFilters();
 } else if(section===7) {
  const data=await load('activity');if(!current())return;
  $('#content').innerHTML=platformForm(`<label>Action<select name="action">${options({'':'All actions',login:'Administrator login',reply:'Official reply',note:'Internal note',status:'Status change',priority:'Priority change',refresh_preference:'Preference change'},platformFilters.action)}</select></label>`)+`<div class="table-wrap"><table><thead><tr><th>Action</th><th>Administrator</th><th>Entity</th><th>Details</th><th>Time</th></tr></thead><tbody>${data.rows.map(e=>`<tr><td>${safe(e.action)}</td><td>${safe(e.actor||'Former administrator')}</td><td>${e.entity?`<a href="#1/${safe(e.entity)}">Open request</a>`:'Administration'}</td><td>${safe(e.detail||'—')}</td><td>${date(e.created_at)}</td></tr>`).join('')||'<tr><td colspan="5">No activity in this range.</td></tr>'}</tbody></table></div>`+pager(data.count);
  wirePlatformFilters(data.count);
 } else if(section===8) {
  const data=await load('settings');if(!current())return;autoRefresh=data.inbox_refresh;
  $('#content').innerHTML=`<div class="settings-grid"><section class="panel"><h2>Administrator account</h2><p>${safe(data.email)}</p><span class="badge">Authorized administrator</span><p>Access is verified by the database on every admin operation.</p><button id="settings-logout">Sign out of this session</button></section><section class="panel"><h2>Inbox preferences</h2><form id="preferences"><label class="check-label"><input type="checkbox" name="refresh" ${data.inbox_refresh?'checked':''}>Refresh the workspace every 15 seconds</label><p>Applies to this administrator account across sessions. Refresh pauses while you edit a form.</p><button class="primary">Save preference</button></form></section><section class="panel"><h2>Support configuration</h2><p>Screenshot storage — ${data.screenshot_private?'Private':'Requires security review'}</p><p>Notifications — persistent in-app replies<br>Official replies and internal notes are stored separately.</p></section><section class="panel"><h2>AI configuration</h2><p>Provider credentials and model configuration are maintained in Supabase function secrets. No secret values are available to this dashboard.</p></section></div>`;
  $('#settings-logout').onclick=()=>$('#logout').click();
  $('#preferences').onsubmit=async event=>{
   event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;
   try{await rpc('admin_platform_write',{operation:'refresh_preference',enabled:event.target.elements.refresh.checked});await render();notice('Preference saved');}
   catch(error){notice(error.message,true);button.disabled=false;}
  };
 } else throw Error('Unknown administration section.');
}

function outline(name) { return '<i data-lucide="'+name+'" aria-hidden="true"></i>'; }
function polishAdmin() {
 document.querySelector('#content').classList.remove('refined-page');
 delete document.querySelector('#content').dataset.refined;
 const names=['layout-dashboard','messages-square','user-round','utensils','package','sparkles','chart-no-axes-column','notebook-text','settings'];
 document.querySelectorAll('#nav a').forEach((link,index)=>{
   const existing=link.querySelector('svg');
   if(existing&&!existing.classList.contains('lucide'))existing.outerHTML=outline(names[index]);
   link.title=sections[index];
 });
 const stats=['user-round','user-round-plus','message-square','circle-alert','refresh-cw','circle-check'];
 document.querySelectorAll('.metrics .card').forEach((item,index)=>{
   if(!item.querySelector('.stat-icon'))item.insertAdjacentHTML('afterbegin','<span class="stat-icon">'+outline(stats[index])+'</span>');
 });
 const overviewPanel=document.querySelector('.analytics-grid');
 if(overviewPanel) {
   const chart=overviewPanel.firstElementChild;
   const breakdown=overviewPanel.lastElementChild;
   breakdown.querySelector('h2').textContent='Support analytics';
   if(!breakdown.querySelector('.support-summary')) {
     const summary=document.createElement('div');summary.className='support-summary';
     breakdown.querySelectorAll('.category-row').forEach(row=>{row.querySelector('progress').remove();summary.append(row);});
     summary.append(breakdown.querySelector('.response-metrics'));
     breakdown.insertBefore(summary,breakdown.querySelector(".footnote"));
   }
   overviewPanel.before(breakdown);
   overviewPanel.append(document.querySelector('.activity-panel'));
   chart.querySelector('h2').textContent='Submission days';
 }
 const welcome=document.querySelector('.welcome');
 if(welcome)welcome.remove();
 const notification=document.querySelector('.notification-access');
 notification.innerHTML=outline('bell');
 notification.title='Requests requiring attention';
 notification.onclick=event=>{event.preventDefault();filters={attention:'true'};page=0;if(location.hash==='#1')render();else location.hash='1';};
 document.querySelector('#refresh').innerHTML=outline('refresh-cw');
 document.querySelector('#refresh').setAttribute('aria-label','Refresh data');
 document.querySelector('#collapse').innerHTML=outline('panel-left-close');
 document.querySelectorAll('.activity-icon').forEach(item=>{
   const action=item.nextElementSibling?.querySelector('b')?.textContent||'';
   item.innerHTML=outline(action==='Registration'?'user-round-plus':action.includes('reply')?'reply':action.includes('status')?'settings':'send');
 });
 window.lucide?.createIcons({attrs:{'stroke-width':1.7}});
 refineWorkspace();
}
authenticate();
