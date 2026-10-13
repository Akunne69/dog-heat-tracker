const STORE_KEY = "dog-heat-tracker-v1";
const DEFAULT_CYCLE_DAYS = 180; // starting estimate only; individual cycles vary
const REMINDER_DAYS = 14;
let dogs = loadDogs();
let selectedDogId = null;
let toastTimer;

function loadDogs(){ try { const data=JSON.parse(localStorage.getItem(STORE_KEY)||"[]"); return Array.isArray(data)?data:[]; } catch { return []; } }
function saveDogs(){ localStorage.setItem(STORE_KEY, JSON.stringify(dogs)); render(); checkReminders(); syncNativeReminders(); }
function id(){ return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random().toString(16).slice(2)); }
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dateOnly(s){ if(!s)return null; const d=new Date(s+"T12:00:00"); return Number.isNaN(d.getTime())?null:d; }
function dateString(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function dayDiff(a,b){return Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);}
function pretty(s){const d=dateOnly(s);return d?d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):"Not recorded";}
function latestCycle(dog){return [...(dog.cycles||[])].sort((a,b)=>(b.observed||"").localeCompare(a.observed||""))[0]||null;}
function estimateNext(dog){const cycles=[...(dog.cycles||[])].filter(c=>c.status==="ended"&&c.observed).sort((a,b)=>a.observed.localeCompare(b.observed)); if(cycles.length>=2){const gaps=[];for(let i=1;i<cycles.length;i++){const gap=dayDiff(dateOnly(cycles[i-1].observed),dateOnly(cycles[i].observed));if(gap>=90&&gap<=400)gaps.push(gap);}if(gaps.length){const avg=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);return {date:addDays(dateOnly(cycles[cycles.length-1].observed),avg),based:"your dog's recorded cycles"};}}const last=cycles[cycles.length-1]||null;if(last)return {date:addDays(dateOnly(last.observed),DEFAULT_CYCLE_DAYS),based:"a general 6-month estimate"};return null;}
function showToast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function render(){document.getElementById("dogCount").textContent=dogs.length;const upcoming=dogs.filter(d=>{const e=estimateNext(d);return e&&dayDiff(new Date(),e.date)>=0&&dayDiff(new Date(),e.date)<=30;}).length;document.getElementById("upcomingCount").textContent=upcoming;
const list=document.getElementById("dogList");list.innerHTML="";document.getElementById("emptyState").classList.toggle("hidden",dogs.length>0);
dogs.forEach(dog=>{const cycle=latestCycle(dog),estimate=estimateNext(dog);let status="No cycle recorded",cls="";if(cycle&&cycle.status==="active"){status="Heat signs ongoing";cls="active";}else if(estimate){const days=dayDiff(new Date(),estimate.date);status=days<0?"Next cycle estimate passed":days===0?"Possible heat date today":`Next estimate ${pretty(dateString(estimate.date))}`;cls=days>=0&&days<=30?"upcoming":"";}
const card=document.createElement("article");card.className="dog-card";card.innerHTML=`<div class="dog-avatar">🐕</div><div class="dog-info"><h3>${escapeHtml(dog.name)}</h3><p>${escapeHtml(dog.breed||"Breed not added")}${dog.dob?" · Born "+pretty(dog.dob):""}</p><span class="status-pill ${cls}">${escapeHtml(status)}</span><div class="card-actions"><button class="small-btn" data-action="view" data-id="${dog.id}">View profile</button><button class="small-btn" data-action="cycle" data-id="${dog.id}">＋ Record heat</button></div></div>`;list.appendChild(card);});
if(selectedDogId && dogs.some(d=>d.id===selectedDogId)) renderDetail(); else document.getElementById("detailSection").classList.add("hidden");
}
function renderDetail(){const dog=dogs.find(d=>d.id===selectedDogId);if(!dog)return;document.getElementById("detailSection").classList.remove("hidden");document.getElementById("detailName").textContent=dog.name;const latest=latestCycle(dog),est=estimateNext(dog);let html=`<div class="detail-card"><h3>Profile</h3><p><strong>Breed:</strong> ${escapeHtml(dog.breed||"Not recorded")}</p><p><strong>Date of birth:</strong> ${pretty(dog.dob)}</p><p><strong>Notes:</strong> ${escapeHtml(dog.notes||"None")}</p><button class="small-btn" data-action="editdog" data-id="${dog.id}">Edit profile</button> <button class="small-btn" data-action="delete" data-id="${dog.id}">Delete dog</button></div>`;
if(latest&&latest.status==="active"){html+=`<div class="detail-card"><h3>Current recorded cycle</h3><p>First noticed: <strong>${pretty(latest.observed)}</strong></p><p>Signs: ${escapeHtml(latest.signs||"Not recorded")}</p><p>This is the date signs were first observed, not necessarily the true start date.</p><button class="small-btn" data-action="endcycle" data-id="${dog.id}" data-cycle="${latest.id}">Mark signs as stopped</button> <button class="small-btn" data-action="editcycle" data-id="${dog.id}" data-cycle="${latest.id}">Edit record</button></div>`;}
if(est){const days=dayDiff(new Date(),est.date);html+=`<div class="detail-card"><h3>Next heat estimate</h3><p><strong>${pretty(dateString(est.date))}</strong></p><p>${days<0?`${Math.abs(days)} days ago (estimate)`:`In about ${days} days`} · Based on ${escapeHtml(est.based)}.</p><p>Cycles vary. This is only a planning estimate and cannot identify fertile days.</p></div>`;}else{html+=`<div class="detail-card"><h3>Next heat estimate</h3><p>Add at least one completed cycle. For now, we do not have enough history to estimate this dog's next cycle.</p></div>`;}
html+=`<div class="detail-card"><h3>Cycle history</h3>`;const cycles=[...(dog.cycles||[])].sort((a,b)=>b.observed.localeCompare(a.observed));if(!cycles.length)html+=`<p>No cycles recorded yet.</p>`;cycles.forEach(c=>{html+=`<div class="record-row"><div><strong>${pretty(c.observed)}</strong><p>${escapeHtml(c.signs||"Signs not recorded")} · ${c.status==="active"?"Ongoing":"Signs stopped"}</p>${c.notes?`<p>${escapeHtml(c.notes)}</p>`:""}<p>First observed date</p></div><div class="record-actions"><button class="small-btn" data-action="editcycle" data-id="${dog.id}" data-cycle="${c.id}">Edit</button><button class="small-btn" data-action="deletecycle" data-id="${dog.id}" data-cycle="${c.id}">Delete</button></div></div>`;});html+=`</div><button class="primary-btn full" data-action="cycle" data-id="${dog.id}">＋ Record another heat cycle</button>`;document.getElementById("detailContent").innerHTML=html;}
function openDogForm(){document.getElementById("dogFormSection").classList.remove("hidden");document.getElementById("dogName").focus();document.getElementById("dogFormSection").scrollIntoView({behavior:"smooth",block:"start"});}
function closeDogForm(){document.getElementById("dogFormSection").classList.add("hidden");document.getElementById("dogForm").reset();}
function openCycle(dogId){document.getElementById("cycleDogId").value=dogId;document.getElementById("cycleObserved").value=dateString(new Date());document.getElementById("cycleNotes").value="";document.getElementById("cycleStatus").value="active";document.getElementById("cycleDialogTitle").textContent=`Record heat for ${dogs.find(d=>d.id===dogId)?.name||"dog"}`;document.getElementById("cycleDialog").showModal();}
function openEditCycle(dogId,cycleId){const dog=dogs.find(d=>d.id===dogId),c=dog?.cycles.find(x=>x.id===cycleId);if(!c)return;document.getElementById("editDogId").value=dogId;document.getElementById("editCycleId").value=cycleId;document.getElementById("editObserved").value=c.observed;document.getElementById("editStatus").value=c.status;document.getElementById("editNotes").value=c.notes||"";document.getElementById("editCycleDialog").showModal();}
function checkReminders(){const today=dateString(new Date());const due=[];dogs.forEach(d=>{const e=estimateNext(d);if(!e)return;const days=dayDiff(new Date(),e.date);if(days>=0&&days<=REMINDER_DAYS)due.push({dog:d.name,days,date:dateString(e.date)});});const key="dog-heat-reminder-"+today;const previous=localStorage.getItem(key);const msg=due.map(x=>`${x.dog}: possible heat around ${pretty(x.date)} (${x.days} days)`).join("\n");if(due.length){const box=document.getElementById("detailContent");if(selectedDogId&&box&&!document.getElementById("detailSection").classList.contains("hidden")){const existing=document.getElementById("reminderBanner");if(!existing){const div=document.createElement("div");div.id="reminderBanner";div.className="reminder-row";div.textContent="Reminder: "+msg.replace(/\n/g," · ");box.prepend(div);}}if(Notification.permission==="granted"&&!previous){try{new Notification("Dog Heat Tracker",{body:msg});}catch(e){}localStorage.setItem(key,"shown");}}}
document.getElementById("addDogBtn").onclick=openDogForm;document.getElementById("emptyAddBtn").onclick=openDogForm;document.getElementById("cancelDogBtn").onclick=closeDogForm;document.getElementById("closeDetailBtn").onclick=()=>{selectedDogId=null;render();};document.getElementById("notifyBtn").onclick=async()=>{
if(window.isDogHeatNativeApp && window.isDogHeatNativeApp()){
  try { const result=await window.enableNativeDogHeatNotifications(); showToast(result?"Phone reminders enabled.":"Please allow notifications in Android settings."); await syncNativeReminders(); }
  catch(e){ showToast("Could not enable reminders. Check Android notification permission."); }
  return;
}
if(!("Notification"in window)){showToast("Browser notifications are unavailable here. The Android APK supports scheduled phone reminders.");return;}
const result=await Notification.requestPermission();
showToast(result==="granted"?"Browser notifications enabled. Keep the app available for reminder checks.":"Notifications were not enabled.");
checkReminders();
};
document.getElementById("dogForm").onsubmit=e=>{e.preventDefault();const name=document.getElementById("dogName").value.trim();if(!name)return;dogs.push({id:id(),name,breed:document.getElementById("dogBreed").value.trim(),dob:document.getElementById("dogDob").value,notes:document.getElementById("dogNotes").value.trim(),cycles:[],createdAt:new Date().toISOString()});saveDogs();closeDogForm();showToast(`${name} added.`);};
document.getElementById("cycleForm").onsubmit=e=>{e.preventDefault();const dog=dogs.find(d=>d.id===document.getElementById("cycleDogId").value);if(!dog)return;dog.cycles.push({id:id(),observed:document.getElementById("cycleObserved").value,signs:document.getElementById("cycleSigns").value,status:document.getElementById("cycleStatus").value,notes:document.getElementById("cycleNotes").value.trim()});document.getElementById("cycleDialog").close();selectedDogId=dog.id;saveDogs();showToast("Cycle record saved.");};
document.getElementById("editCycleForm").onsubmit=e=>{e.preventDefault();const dog=dogs.find(d=>d.id===document.getElementById("editDogId").value),c=dog?.cycles.find(x=>x.id===document.getElementById("editCycleId").value);if(!c)return;c.observed=document.getElementById("editObserved").value;c.status=document.getElementById("editStatus").value;c.notes=document.getElementById("editNotes").value.trim();document.getElementById("editCycleDialog").close();selectedDogId=dog.id;saveDogs();showToast("Cycle record updated.");};
document.getElementById("closeCycleBtn").onclick=()=>document.getElementById("cycleDialog").close();document.getElementById("closeEditCycleBtn").onclick=()=>document.getElementById("editCycleDialog").close();
document.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const action=b.dataset.action,dogId=b.dataset.id,dog=dogs.find(d=>d.id===dogId),cycleId=b.dataset.cycle;if(action==="view"){selectedDogId=dogId;render();document.getElementById("detailSection").scrollIntoView({behavior:"smooth"});}if(action==="cycle")openCycle(dogId);if(action==="editcycle")openEditCycle(dogId,cycleId);if(action==="endcycle"){const c=dog?.cycles.find(x=>x.id===cycleId);if(c){c.status="ended";saveDogs();showToast("Cycle marked as stopped. Record the date signs stopped in notes if needed.");}}if(action==="delete"){if(confirm(`Delete ${dog?.name} and all its records from this device? This cannot be undone.`)){dogs=dogs.filter(d=>d.id!==dogId);if(selectedDogId===dogId)selectedDogId=null;saveDogs();showToast("Dog profile deleted.");}}if(action==="deletecycle"){if(confirm("Delete this cycle record?")){dog.cycles=dog.cycles.filter(c=>c.id!==cycleId);saveDogs();showToast("Cycle record deleted.");}}if(action==="editdog"){const name=prompt("Dog's name:",dog.name);if(name===null||!name.trim())return;dog.name=name.trim();const breed=prompt("Breed:",dog.breed||"");if(breed!==null)dog.breed=breed.trim();const notes=prompt("Notes:",dog.notes||"");if(notes!==null)dog.notes=notes.trim();saveDogs();showToast("Profile updated.");}});
if("serviceWorker"in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
async function syncNativeReminders(){
  if(!(window.isDogHeatNativeApp && window.isDogHeatNativeApp()) || !window.scheduleNativeDogHeatReminders) return;
  const now = new Date();
  const reminders = [];
  let notificationId = 4200;
  dogs.forEach(dog => {
    const estimate = estimateNext(dog);
    if(!estimate || !estimate.date) return;
    const estimateDate = new Date(estimate.date);
    // Give advance notice at 14 days and 3 days, and a same-day planning reminder.
    [14, 3, 0].forEach(daysBefore => {
      const when = new Date(estimateDate);
      when.setDate(when.getDate() - daysBefore);
      when.setHours(9, 0, 0, 0);
      if(when <= now) return;
      const label = daysBefore === 14 ? "in about 2 weeks" : daysBefore === 3 ? "in about 3 days" : "around today";
      reminders.push({
        id: notificationId++,
        title: `Heat-cycle check: ${dog.name}`,
        body: `A heat cycle may be approaching ${label}. This is only a calendar estimate; watch for signs and keep her away from unneutered males.`,
        at: when.getTime()
      });
    });
  });
  try { await window.scheduleNativeDogHeatReminders(reminders); }
  catch(e) { console.warn("Native reminder scheduling was not completed", e); }
}
window.syncNativeDogHeatReminders = syncNativeReminders;
render();checkReminders();syncNativeReminders();

document.getElementById("exportBackupBtn").onclick=()=>{
  const payload={format:"dog-heat-tracker-backup",version:1,exportedAt:new Date().toISOString(),dogs};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`dog-heat-tracker-backup-${dateString(new Date())}.json`;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast("Backup exported. Keep the JSON file somewhere safe.");
};
document.getElementById("importBackupBtn").onclick=()=>document.getElementById("importBackupFile").click();
document.getElementById("importBackupFile").onchange=async e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    const incoming=Array.isArray(data)?data:data.dogs;
    if(!Array.isArray(incoming)||!incoming.every(d=>d&&typeof d.name==="string"&&Array.isArray(d.cycles||[]))){
      throw new Error("That file is not a valid Dog Heat Tracker backup.");
    }
    if(!confirm(`Restore ${incoming.length} dog profile(s)? This replaces the profiles currently stored on this phone. Export a backup first if you want to keep them.`))return;
    dogs=incoming.map(d=>({...d,id:d.id||id(),cycles:(d.cycles||[]).map(c=>({...c,id:c.id||id()}))}));
    selectedDogId=null;saveDogs();showToast("Backup restored successfully.");
  }catch(err){showToast(err.message||"Could not read that backup file.");}
  finally{e.target.value="";}
};
