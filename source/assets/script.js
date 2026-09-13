
const btn=document.querySelector('.menu-btn'),nav=document.querySelector('.nav');
btn?.addEventListener('click',()=>{const o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(o))});
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const obs=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
function toast(m){const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4200)}
document.querySelectorAll('.demo-form').forEach(f=>f.addEventListener('submit',e=>{if(f.dataset.demo==="true"){e.preventDefault();toast(f.dataset.message||'Form is ready to connect.')}}));

const photoItems=document.querySelectorAll('.photo-open,.travel-shot');
if(photoItems.length){
  const box=document.createElement('div');
  box.className='lightbox';
  box.setAttribute('role','dialog');
  box.setAttribute('aria-modal','true');
  box.setAttribute('aria-label','Photo viewer');
  box.innerHTML='<button type="button" aria-label="Close photo">×</button><img alt="Expanded travel photograph">';
  document.body.appendChild(box);
  const image=box.querySelector('img');
  const close=()=>{box.classList.remove('open');image.removeAttribute('src');document.body.style.overflow=''};
  const open=item=>{image.src=item.dataset.full||item.querySelector('img')?.src||'';image.alt=item.querySelector('img')?.alt||'Expanded travel photograph';box.classList.add('open');document.body.style.overflow='hidden';box.querySelector('button').focus()};
  photoItems.forEach(item=>{item.addEventListener('click',()=>open(item));item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(item)}})});
  box.querySelector('button').addEventListener('click',close);
  box.addEventListener('click',e=>{if(e.target===box)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('open'))close()});
}

const detailItems=document.querySelectorAll('.detail-trigger');
if(detailItems.length){
  const panel=document.createElement('div');
  panel.className='detail-window';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','detail-title');
  panel.innerHTML='<div class="detail-dialog"><button class="detail-close" type="button" aria-label="Close window">×</button><div class="detail-icon" aria-hidden="true"></div><h2 id="detail-title"></h2><p></p><div class="detail-window-actions"><a class="btn btn-primary" href="stories.html">My stories</a><a class="btn btn-outline" href="admin/">＋ Add content</a></div></div>';
  document.body.appendChild(panel);
  const close=()=>{panel.classList.remove('open');document.body.style.overflow=''};
  const open=item=>{panel.querySelector('.detail-icon').textContent=item.dataset.detailIcon||'✦';panel.querySelector('h2').textContent=item.dataset.detailTitle||'';panel.querySelector('p').textContent=item.dataset.detailText||'';panel.classList.add('open');document.body.style.overflow='hidden';panel.querySelector('.detail-close').focus()};
  detailItems.forEach(item=>{item.addEventListener('click',()=>open(item));item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(item)}})});
  panel.querySelector('.detail-close').addEventListener('click',close);panel.addEventListener('click',event=>{if(event.target===panel)close()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel.classList.contains('open'))close()});
}
