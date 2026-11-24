/* Route-specific refinement keeps Overview unchanged. */
let selectedSettingsPanel = 0;
function chartPanel(rows,key,title,color='#1683ff') {
 const maximum=Math.max(1,...rows.map(row=>Number(row[key]||0)));
 const total=rows.reduce((sum,row)=>sum+Number(row[key]||0),0);
 return '<section class="panel refined-chart"><div class="panel-heading"><div><h2>'+escapeHTML(title)+'</h2><p>'+total+' recorded in the selected range</p></div></div><div class="chart-scroll" role="img" aria-label="'+escapeHTML(title)+' by date">'+(rows.map(row=>'<div class="chart-day"><span>'+(row[key]||0)+'</span><div><i style="height:'+Number(row[key]||0)/maximum*100+'%;background:'+color+'"></i></div><small>'+escapeHTML(row.day.slice(5))+'</small></div>').join('')||'<p>No recorded activity in this range.</p>')+'</div></section>';
}
function refineWorkspace() {
 const section=route().section;
 if(section===0)return;
 const content=document.querySelector('#content');
 content.classList.add('refined-page');content.dataset.refined=String(section);
 const descriptions={
  1:['Customer conversations','Manage requests and keep every customer conversation in context.'],
  2:['People using Tamaddi','Find an account and review its support history and synchronized state.'],
  3:['The Tamaddi recipe collection','Create meals, review drafts and publish updates to the app.'],
  4:['Ingredients, connected','Explore the ingredients behind the collection and the recipes that use them.'],
  5:['Assistant performance','Monitor recorded requests, reliability, response time and provider-reported usage.'],
  6:['Growth and support','Understand registrations and support demand over a selected period.'],
  7:['Workspace history','A persistent record of administrator actions and the requests they relate to.'],
  8:['Administration preferences','Manage your inbox preferences and review system configuration.']
 };
 if(!content.querySelector('.section-introduction')&&!route().ticket) {
  const intro=document.createElement('div');intro.className='section-introduction';
  intro.innerHTML='<h2>'+descriptions[section][0]+'</h2><p>'+descriptions[section][1]+'</p>';content.prepend(intro);
 }
 content.querySelectorAll('tr').forEach(row=>{
  const link=row.querySelector('td:first-child a[href]');if(!link||row.dataset.clickable)return;
  row.dataset.clickable='true';row.tabIndex=0;row.setAttribute('aria-label',link.textContent.trim());
  row.onclick=event=>{if(!event.target.closest('a,button,input,select'))location.hash=link.hash;};
  row.onkeydown=event=>{if(event.target===row&&(event.key==='Enter'||event.key===' ')){event.preventDefault();location.hash=link.hash;}};
 });
 if(section===2)content.querySelectorAll('tbody tr td:first-child').forEach(cell=>{
  const link=cell.querySelector('a');if(!link||cell.querySelector('.person-initials'))return;
  const avatar=document.createElement('span');avatar.className='person-initials';
  avatar.textContent=link.textContent.trim().split(/\s+/).slice(0,2).map(name=>name[0]).join('').toUpperCase();
  avatar.setAttribute('aria-hidden','true');cell.prepend(avatar);cell.classList.add('person-cell');
 });
 if(section===1&&!route().ticket&&filters.attention) {
  const summary=document.createElement('div');summary.className='filter-context';
  summary.innerHTML='<span>Showing requests requiring an administrator response</span><button type="button">Show all requests</button>';
  summary.querySelector('button').onclick=()=>{filters={};page=0;render();};content.querySelector('.filters').before(summary);
 }
 if(section===2&&route().user) {
  const panel=content.querySelector('.panel');
  if(panel) {
   panel.classList.add('user-profile');
   const heading=panel.querySelector('h2');
   const avatar=document.createElement('span');avatar.className='profile-initials';
   avatar.textContent=heading.textContent.trim().split(/\s+/).slice(0,2).map(name=>name[0]).join('').toUpperCase();
   heading.before(avatar);
   const dates=[...panel.querySelectorAll(':scope>p')].find(p=>p.textContent.startsWith('Created '));
   if(dates){
    const registration=document.createElement('section');registration.className='profile-registration';
    registration.innerHTML='<h3>Registration and sign-in</h3>';registration.append(dates);panel.append(registration);
   }
  }
 }
 if(section===3)content.querySelectorAll('.recipe-card summary').forEach(summary=>{
  summary.onclick=event=>{
   event.preventDefault();
   let dialog=document.querySelector('#recipe-viewer');
   if(!dialog){dialog=document.createElement('dialog');dialog.id='recipe-viewer';document.body.append(dialog);}
   dialog.innerHTML='<button type="button" class="recipe-close">Close recipe</button><div class="recipe-detail">'+summary.parentElement.innerHTML+'</div>';
   const cloned=dialog.querySelector('summary'),heading=document.createElement('div');
   heading.className='recipe-detail-heading';heading.innerHTML=cloned.innerHTML;cloned.replaceWith(heading);
   dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();
  };
 });
 if(section===7) {
  const labels={reply:['reply','Official reply'],note:['notebook-pen','Internal note'],status:['circle-check','Status change'],priority:['flag','Priority change'],login:['log-in','Administrator login'],refresh_preference:['settings-2','Preference updated']};
  content.querySelectorAll('tbody tr').forEach(row=>{
   const first=row.querySelector('td');if(!first||row.children.length<5)return;
   const label=labels[first.textContent.trim()];if(label)first.innerHTML='<span class="audit-action">'+outline(label[0])+escapeHTML(label[1])+'</span>';
  });
 }
 if(section===8&&!content.querySelector('.settings-navigation')) {
  const grid=content.querySelector('.settings-grid');
  if(grid){
   const nav=document.createElement('nav');nav.className='settings-navigation';nav.setAttribute('aria-label','Settings sections');
   ['Account','Inbox preferences','Support configuration','AI configuration'].forEach((label,index)=>{
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.onclick=()=>{
     selectedSettingsPanel=index;
     [...grid.children].forEach((panel,i)=>panel.hidden=i!==index);
     nav.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    };nav.append(button);
   });
   const layout=document.createElement('div');layout.className='settings-layout';grid.before(layout);layout.append(nav,grid);nav.querySelectorAll('button')[selectedSettingsPanel].click();
  }
 }
 window.lucide?.createIcons({attrs:{'stroke-width':1.7}});
}
