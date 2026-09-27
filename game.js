'use strict';
const $=s=>document.querySelector(s);
let current=0, placed=Array(6).fill(null), selected=null, checked=false, solved=false, order=[], completed=new Set();
try {completed=new Set(JSON.parse(localStorage.getItem('room-makeover-v2-completed')||'[]').filter(n=>Number.isInteger(n)&&n>=0&&n<8));}catch{}
function shuffle(a){return a.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);}
function save(){try{localStorage.setItem('room-makeover-v2-completed',JSON.stringify([...completed]));}catch{}}
function loadRoom(i){current=i;placed=Array(6).fill(null);selected=null;checked=false;solved=false;order=shuffle([...ROOMS[i].answer,...EXTRAS[i]]);const r=ROOMS[i];$('#portrait').src=`assets/${r.name.toLowerCase()}.webp`;$('#portrait').alt=r.name;$('#name').textContent=r.name;$('#title').textContent=r.title;$('#story').textContent=r.text;$('#signature').textContent=`Love, ${r.name}`;$('#background').src=`assets/room-${r.bg}.webp`;render();}
function isLocked(id){return checked&&placed.some((v,i)=>v===id&&ROOMS[current].answer[i]===id);}
function choose(id){if(solved||isLocked(id))return;selected=selected===id?null:id;render();}
function put(id,index){if(!id||solved||isLocked(id))return;const old=placed.indexOf(id), occupant=placed[index];if(occupant&&isLocked(occupant))return;if(old===index){selected=null;render();return;}if(old>=0)placed[old]=occupant;placed[index]=id;selected=null;if(placed.every(Boolean)){checked=true;solved=placed.every((v,i)=>v===ROOMS[current].answer[i]);if(solved){completed.add(current);save();}}render();}
function render(){
 $('#scene').classList.toggle('selecting',Boolean(selected));
 $('#rooms').innerHTML=ROOMS.map((r,i)=>`<button class="${i===current?'active ':''}${completed.has(i)?'done':''}" aria-label="${r.name}'s room${completed.has(i)?', completed':''}" ${i===current?'aria-current="step"':''} data-room="${i}">${completed.has(i)?'✓':i+1}</button>`).join('');
 $('#spots').innerHTML=SPOTS.map((p,i)=>{const id=placed[i],f=FURNITURE[id],good=checked&&id===ROOMS[current].answer[i],bad=checked&&id&&!good;return `<button class="spot ${id?'occupied':''} ${id&&selected===id?'selected':''} ${good?'correct':bad?'wrong':''}" data-spot="${i}" ${id?`data-id="${id}"`:''} aria-label="${id?f[0]+(good?', correct':bad?', try another position':''):'Empty space '+(i+1)}" style="left:${p.x}%;top:${p.y}%;--iw:${id?WIDTHS[id]*(i<3?0.94:1.08):22}cqw;--ih:${id?(i<3?f[2]:Math.min(f[2],29))*941/1672:12}cqw;width:${id?f[1]:22}%;height:${id?f[2]:12}%;z-index:${i<3?1:2}">${id?`<img src="assets/${id}.webp" alt="" draggable="false">`:''}${good||bad?`<span class="mark" aria-hidden="true">${good?'✓':'×'}</span>`:''}</button>`;}).join('');
 $('#inventory').innerHTML=order.map(id=>`<button class="piece ${placed.includes(id)?'used':''} ${selected===id?'selected':''}" data-id="${id}" aria-label="${FURNITURE[id][0]}${placed.includes(id)?', in the room':''}" ${solved||isLocked(id)?'disabled':''}><img src="assets/${id}.webp" alt="" draggable="false"></button>`).join('');
 const count=placed.filter(Boolean).length;
 $('#count').textContent=count+' / 6';$('#return').disabled=!selected||!placed.includes(selected)||isLocked(selected);
 $('#status').textContent=solved?'Beautiful! Everything is in the right place.':selected?'Choose a space in the room.':checked?'Move or replace the red pieces.':count?'Keep reading. Your room is taking shape.':'Choose a piece of furniture.';
 $('#next').hidden=!solved;$('#next').textContent=completed.size===8?'Finish ✦':'Next room →';
}
$('#rooms').addEventListener('click',e=>{const b=e.target.closest('[data-room]');if(b)loadRoom(+b.dataset.room);});
$('#inventory').addEventListener('click',e=>{if(suppressClick)return;const b=e.target.closest('[data-id]');if(b&&!b.disabled)choose(b.dataset.id);});
$('#spots').addEventListener('click',e=>{if(suppressClick)return;const b=e.target.closest('[data-spot]');if(!b)return;if(selected)put(selected,+b.dataset.spot);else if(b.dataset.id)choose(b.dataset.id);});
$('#return').onclick=()=>{if(selected&&!isLocked(selected)){placed=placed.map(v=>v===selected?null:v);selected=null;render();}};
$('#restart').onclick=()=>loadRoom(current);
$('#next').onclick=()=>{if(!solved)return;if(completed.size===8){$('#finish').showModal();return;}let i=(current+1)%8;while(completed.has(i))i=(i+1)%8;loadRoom(i);};
$('#again').onclick=()=>{completed.clear();save();$('#finish').close();loadRoom(0);};$('#close-finish').onclick=()=>$('#finish').close();
let drag=null,suppressClick=false;
document.addEventListener('pointerdown',e=>{if(e.button!==0||solved)return;const b=e.target.closest('[data-id]');if(!b||b.disabled||isLocked(b.dataset.id))return;drag={id:b.dataset.id,x:e.clientX,y:e.clientY,pointer:e.pointerId,ghost:null};});
document.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;if(!drag.ghost&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;if(!drag.ghost){drag.ghost=document.createElement('img');drag.ghost.className='ghost';drag.ghost.src=`assets/${drag.id}.webp`;drag.ghost.alt='';document.body.append(drag.ghost);}drag.ghost.style.left=e.clientX-60+'px';drag.ghost.style.top=e.clientY-110+'px';e.preventDefault();},{passive:false});
document.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;if(!d.ghost)return;d.ghost.remove();suppressClick=true;setTimeout(()=>suppressClick=false,0);const rect=$('#scene').getBoundingClientRect();if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){const x=(e.clientX-rect.left)/rect.width*100,y=(e.clientY-rect.top)/rect.height*100;let nearest=0;SPOTS.forEach((p,i)=>{if(Math.hypot(x-p.x,y-p.y)<Math.hypot(x-SPOTS[nearest].x,y-SPOTS[nearest].y))nearest=i;});put(d.id,nearest);}});
document.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=null;drag?.ghost?.remove();drag=null;render();}});
new ResizeObserver(()=>{const wrap=$('.scene-wrap');if(matchMedia('(orientation:portrait)').matches){$('#scene').style.width='100%';}else{$('#scene').style.width=Math.min(wrap.clientWidth,wrap.clientHeight*1672/941)+'px';}}).observe($('.scene-wrap'));
loadRoom(0);
