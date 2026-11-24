/* Shared catalog editor. Drafts and publishing always cross the administrator RPC boundary. */
async function renderMealManager(current) {
 const rows=await rpc('admin_meal_catalog');
 if(!current())return;
 const search=(platformFilters.search||'').toLowerCase();
 const filtered=rows.filter(row=>(row.draft.title+' '+row.id).toLowerCase().includes(search));
 $('#content').innerHTML=`<div class="panel-heading"><p>Save private drafts, then publish to updated Tamaddi apps. Changes sync when the app opens or within a minute while active.</p><button id="new-meal">+ New meal</button></div><form id="meal-search" class="filters">${field('search','Search meals','search',platformFilters.search||'')}<button>Search</button><button type="button" id="import-meals">Import missing bundled meals</button></form><div class="catalog-grid">${filtered.map(row=>`<article class="panel recipe-card"><img src="${safe(row.draft.image)}" alt="" loading="lazy"><h2>${safe(row.draft.title)}</h2><p>${row.visible?'Published':row.published?'Unpublished':'Draft'} · Revision ${row.revision}</p><button data-edit-meal="${safe(row.id)}">Edit meal</button></article>`).join('')||'<p>No meals yet. Import the existing catalog or create a meal.</p>'}</div><div id="meal-editor"></div>`;
 $('#meal-search').onsubmit=event=>{event.preventDefault();platformFilters.search=new FormData(event.target).get('search');render();};
 $('#new-meal').onclick=()=>editMeal(null);
 document.querySelectorAll('[data-edit-meal]').forEach(button=>button.onclick=()=>editMeal(rows.find(row=>row.id===button.dataset.editMeal)));
 $('#import-meals').onclick=async event=>{
  const button=event.target;button.disabled=true;
  try {
   const response=await fetch('/admin/catalog.json');if(!response.ok)throw Error('Bundled catalog unavailable.');
   const catalog=await response.json();const existing=new Set(rows.map(row=>row.id));let count=0;
   for(const recipe of catalog.recipes){
    if(existing.has(recipe.id))continue;
    const content={...recipe,image:new URL(recipe.image,location.origin).href};delete content.browsable;
    // Seed as drafts. Import never publishes or replaces an existing administrator edit.
    await rpc('admin_save_meal',{meal_id:content.id,content,expected_revision:0,operation:'save'});count++;
   }
   notice(`Imported ${count} private drafts. Review and publish each meal when ready.`);await render();
  }catch(error){notice(error.message,true);button.disabled=false;}
 };
 function editMeal(row){
  const recipe=row?.draft||{id:crypto.randomUUID(),title:'',uzbekName:'',subtitle:'',time:'30 min',servings:'2 ppl',difficulty:'Easy',image:'',tags:['Quick'],primaryTag:'Quick',tagColor:'#86868B',keyIngredients:[],ingredientBaseServings:1,ingredientAmounts:{}};
  $('#meal-editor').innerHTML=`<section class="panel"><h2>${row?'Edit meal':'New meal'}</h2><p>Saving a draft does not change the published meal. Ingredients and quantities use the base servings below.</p><form id="meal-form" class="meal-editor-form">${field('title','Meal name','text',recipe.title)}${field('uzbekName','Alternative name','text',recipe.uzbekName||'')}<label>Description<textarea name="subtitle" required maxlength="2000">${safe(recipe.subtitle)}</textarea></label><div class="filters">${field('time','Preparation time','text',recipe.time)}${field('servings','Servings label','text',recipe.servings)}<label>Difficulty<select name="difficulty">${options({Easy:'Easy',Moderate:'Moderate',Advanced:'Advanced'},recipe.difficulty)}</select></label></div>${field('image','Photo URL (HTTPS)','url',recipe.image)}<label>Upload photo (JPEG, PNG or WebP, maximum 5 MB)<input id="meal-photo" type="file" accept="image/jpeg,image/png,image/webp"></label><p id="photo-status" role="status"></p>${field('tags','Categories, separated by commas','text',recipe.tags.join(', '))}${field('primaryTag','Category label','text',recipe.primaryTag||'')}${field('tagColor','Category color','color',recipe.tagColor||'#86868B')}<fieldset><legend>Ingredients and quantities</legend><div id="meal-ingredient-rows"></div><button type="button" id="add-meal-ingredient">+ Add ingredient</button></fieldset>${field('ingredientBaseServings','Base servings for quantities','number',recipe.ingredientBaseServings||1)}<label>Preparation steps, one per line<textarea name="instructions">${safe((recipe.instructions||[]).join('\n'))}</textarea></label><div class="filters"><button name="action" value="save">Save draft</button><button name="action" value="publish">Publish meal</button>${row?.published?'<button name="action" value="unpublish">Unpublish</button>':''}<button type="button" id="close-meal-editor">Close</button></div><p id="meal-error" role="alert"></p></form></section>`;
  $('#meal-editor').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  function addIngredient(name='',quantity='',unit='g') {
   const line=document.createElement('div');line.className='meal-ingredient-row';
   line.innerHTML=`<label>Ingredient<input data-ingredient-name value="${safe(name)}" maxlength="160" required></label><label>Quantity<input data-ingredient-quantity type="number" min="0" step="any" value="${safe(quantity??'')}" placeholder="Unknown"></label><label>Unit<input data-ingredient-unit value="${safe(unit)}" maxlength="30"></label><button type="button" aria-label="Remove ingredient">Remove</button>`;
   line.querySelector('button').onclick=()=>line.remove();$('#meal-ingredient-rows').append(line);
  }
  for(const name of recipe.keyIngredients) addIngredient(name,recipe.ingredientAmounts?.[name]?.quantity,recipe.ingredientAmounts?.[name]?.unit||'g');
  if(!recipe.keyIngredients.length)addIngredient();
  $('#add-meal-ingredient').onclick=()=>addIngredient();
  $('#close-meal-editor').onclick=()=>{$('#meal-editor').innerHTML='';};
  let uploading=false;
  $('#meal-photo').onchange=async event=>{
   const file=event.target.files[0];if(!file)return;
   const status=$('#photo-status');
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880){status.textContent='Choose a JPEG, PNG or WebP image under 5 MB.';return;}
   uploading=true;status.textContent='Uploading photo…';
   try{
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    const path=recipe.id+'/'+crypto.randomUUID()+'.'+ext;
    const {error}=await client.storage.from('meal-photos').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;
    $('#meal-form [name=image]').value=client.storage.from('meal-photos').getPublicUrl(path).data.publicUrl;
    status.textContent='Photo uploaded. Save or publish the meal to use it.';
   }catch(error){status.textContent='Upload failed: '+error.message;}finally{uploading=false;}
  };
  $('#meal-form').onsubmit=async event=>{
   event.preventDefault();const form=event.target;const errorBox=$('#meal-error');errorBox.textContent='';
   if(uploading){errorBox.textContent='Wait for the photo upload to finish.';return;}
   const operation=event.submitter?.value||'save';
   const buttons=form.querySelectorAll('button');buttons.forEach(button=>button.disabled=true);
   try{
    const values=Object.fromEntries(new FormData(form));
    const content={...recipe,instructions:values.instructions.split('\n').map(v=>v.trim()).filter(Boolean),title:values.title.trim(),uzbekName:values.uzbekName.trim(),subtitle:values.subtitle.trim(),time:values.time.trim(),servings:values.servings.trim(),difficulty:values.difficulty,image:values.image.trim(),tags:values.tags.split(',').map(v=>v.trim()).filter(Boolean),primaryTag:values.primaryTag.trim(),tagColor:values.tagColor,keyIngredients:[...form.querySelectorAll('[data-ingredient-name]')].map(input=>input.value.trim()).filter(Boolean),ingredientBaseServings:Number(values.ingredientBaseServings),ingredientAmounts:Object.fromEntries([...form.querySelectorAll('.meal-ingredient-row')].map(line=>[line.querySelector('[data-ingredient-name]').value.trim(),{quantity:line.querySelector('[data-ingredient-quantity]').value===''?null:Number(line.querySelector('[data-ingredient-quantity]').value),unit:line.querySelector('[data-ingredient-unit]').value.trim()}]))};
    if(operation!=='unpublish'&&(!content.title||!content.subtitle||!content.time||!content.servings||!content.keyIngredients.length||!content.image.startsWith('https://')||!(content.ingredientBaseServings>0)))throw Error('Complete the meal details, ingredients, HTTPS photo and positive base servings.');
    await rpc('admin_save_meal',{meal_id:recipe.id,content,expected_revision:row?.revision||0,operation});
    notice(operation==='publish'?'Meal published. Updated apps will sync it shortly.':operation==='unpublish'?'Meal removed from browsing. Saved references remain available.':'Private draft saved.');
    await render();
   }catch(error){errorBox.textContent=error.message;buttons.forEach(button=>button.disabled=false);}
  };
 }
}
