/* =========================================================
   HYROX PREP TRACKER — vanilla JS PWA
   Single-file app logic. No external dependencies.
========================================================= */

/* ---------- Storage ---------- */
const LS = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ---------- Hyrox 8-week plan data ---------- */
function phaseFor(w){ if(w<=2)return"base"; if(w<=4)return"build"; if(w<=6)return"load"; if(w===7)return"peak"; return"deload"; }
const PHASE_LABEL = {base:"BASE — FORM FIRST", build:"BUILD — ADD LOAD", load:"LOAD — RAISE INTENSITY", peak:"PEAK — HEAVIEST WEEK", deload:"DELOAD — BACK OFF"};

function buildWeek(w){
  const p = phaseFor(w);
  const T = {
    base:{squat:"4x6 @ RPE 6-7",rdl:"3x8 @ moderate",lunge:"3x12/leg, light DB",bench:"4x6 @ RPE 6-7",row:"4x8 @ moderate",ohp:"3x8 @ moderate",carry:"4x40m, moderate load",intervals:"6x400m hard, 90s rest",z2:"35 min steady, conversational",sled:"3 rounds, light-mod, focus technique",wallball:"3x15 @ 6-9kg",burpee:"3x8 broad jump burpees",ski:"3x200m",pallof:"3x10/side, light band",hanging:"3x8-10 knee raises",situp:"3x10 bodyweight"},
    build:{squat:"4x5 @ +5-10%, RPE 7",rdl:"3x8 @ +5% load",lunge:"3x12/leg, moderate DB",bench:"4x5 @ +5% load",row:"4x8 @ +5% load",ohp:"3x8 @ +5% load",carry:"4x40m, heavier load",intervals:"7x400m hard, 75s rest",z2:"40 min steady, conversational",sled:"4 rounds, moderate load",wallball:"4x15 @ 6-9kg",burpee:"3x10 broad jump burpees",ski:"4x250m",pallof:"3x12/side, moderate band",hanging:"3x10 leg raises",situp:"3x12 weighted, light plate"},
    load:{squat:"5x5 @ +5%, RPE 7-8",rdl:"4x6 @ +5-10% load",lunge:"4x12/leg, heavier DB",bench:"5x5 @ +5% load",row:"4x10 @ +5% load",ohp:"4x6 @ +5% load",carry:"4x50m, heavier load",intervals:"8x400m hard, 75s rest",z2:"45 min steady, conversational",sled:"4 rounds, race-approaching load",wallball:"4x15-20 @ 9kg",burpee:"4x10 broad jump burpees",ski:"4x300m",pallof:"3x12/side, heavier band",hanging:"3x12 straight leg raises",situp:"3x12-15 weighted"},
    peak:{squat:"5x5 @ +5%, RPE 8",rdl:"4x6 @ +5% load",lunge:"4x12/leg, heaviest DB",bench:"5x5 @ +5% load",row:"4x10 @ +5% load",ohp:"4x6 @ +5% load",carry:"5x50m, heaviest load",intervals:"6x800m hard, 2min rest",z2:"45-50 min steady",sled:"5 rounds, near race load",wallball:"5x15-20 @ 9kg",burpee:"4x10-12 broad jump burpees",ski:"5x300m",pallof:"3x12/side, heaviest band",hanging:"3x12-15 straight leg raises",situp:"4x15 weighted"},
    deload:{squat:"3x5 @ light, RPE 5",rdl:"3x6 @ light",lunge:"2x12/leg, light",bench:"3x5 @ light",row:"3x8 @ light",ohp:"3x6 @ light",carry:"3x40m, moderate",intervals:"4x400m moderate, full recovery",z2:"25 min easy",sled:"2 rounds, light, technique refresh",wallball:"3x12 @ 6kg",burpee:"2x8",ski:"3x200m easy",pallof:"2x10/side, light",hanging:"2x8 knee raises",situp:"2x10 bodyweight"}
  }[p];
  return {
    week:w, phase:p, phaseLabel:PHASE_LABEL[p],
    days:[
      {day:"Day 1",session:"Lower Body Strength",exercises:[
        {name:"Back Squat",presc:T.squat},{name:"Romanian Deadlift",presc:T.rdl},
        {name:"Walking Lunges",presc:T.lunge},{name:"Plank",presc:"3x45s"},
        {name:"Pallof Press",presc:T.pallof,note:"Core finisher — anti-rotation, resists sled drift"}]},
      {day:"Day 2",session:"Run Intervals",exercises:[
        {name:"Warm-up",presc:"10 min easy jog"},{name:"Intervals",presc:T.intervals},
        {name:"Cool-down",presc:"10 min easy jog"}]},
      {day:"Day 3",session:"Upper Body + Carries",exercises:[
        {name:"Bench Press",presc:T.bench},{name:"Bent-Over Row",presc:T.row},
        {name:"Overhead Press",presc:T.ohp},{name:"Farmer's Carry",presc:T.carry},
        {name:"Hanging Leg Raise",presc:T.hanging,note:"Core finisher — swap for dead bug if grip is fried"}]},
      {day:"Day 4",session:"Zone 2 Steady State",exercises:[
        {name:"Row / Ski / Run",presc:T.z2,note:"Stay conversational — don't drift into threshold"}]},
      {day:"Day 5",session:"Hyrox Station Circuit",exercises:[
        {name:"Sled Push/Pull",presc:T.sled},{name:"Wall Balls",presc:T.wallball},
        {name:"Burpee Broad Jumps",presc:T.burpee},{name:"Ski Erg",presc:T.ski},
        {name:"Weighted Sit-Up",presc:T.situp,note:"Core finisher — race-specific, done under fatigue"}]},
      {day:"Day 6",session:"Optional — Easy Movement",exercises:[
        {name:"Walk / Mobility / Light Swim",presc:"20-30 min, low intensity",note:"Skip if fatigue score is high"}]}
    ]
  };
}
const WEEKS = Array.from({length:8},(_,i)=>buildWeek(i+1));

/* ---------- Exercise library ---------- */
const LIBRARY = {
  "Barbell":[["Back Squat","4x6","reps"],["Front Squat","4x6","reps"],["Deadlift","4x5","reps"],
    ["Romanian Deadlift","3x8","reps"],["Sumo Deadlift","4x5","reps"],["Bench Press","4x6","reps"],
    ["Incline Bench Press","4x8","reps"],["Overhead Press","3x8","reps"],["Push Press","3x6","reps"],
    ["Bent-Over Row","4x8","reps"],["Barbell Curl","3x10","reps"],["Hip Thrust","3x10","reps"]],
  "Dumbbell":[["DB Bench Press","4x8","reps"],["DB Row","4x10","reps"],["DB Shoulder Press","3x10","reps"],
    ["Goblet Squat","3x12","reps"],["Walking Lunges","3x12/leg","reps"],["Bulgarian Split Squat","3x10/leg","reps"],
    ["Farmer's Carry","4x40m","distance"],["DB Curl","3x12","reps"],["Lateral Raise","3x12","reps"],
    ["DB RDL","3x10","reps"],["Renegade Row","3x8/side","reps"]],
  "Machine":[["Leg Press","4x10","reps"],["Hack Squat","4x10","reps"],["Leg Extension","3x12","reps"],
    ["Leg Curl","3x12","reps"],["Lat Pulldown","4x10","reps"],["Seated Cable Row","4x10","reps"],
    ["Chest Press Machine","4x10","reps"],["Shoulder Press Machine","3x10","reps"],["Pec Deck","3x12","reps"],
    ["Cable Crossover","3x12","reps"],["Smith Machine Squat","4x8","reps"],["Assisted Pull-up","3x8","reps"],
    ["Assisted Dip","3x8","reps"],["Cable Tricep Pushdown","3x12","reps"],["Cable Face Pull","3x15","reps"],
    ["Hip Abductor Machine","3x15","reps"],["Hip Adductor Machine","3x15","reps"],["Calf Raise Machine","4x15","reps"]],
  "Bodyweight":[["Push-up","3x15","reps"],["Pull-up","3x8","reps"],["Chin-up","3x8","reps"],
    ["Dip","3x10","reps"],["Plank","3x45s","time"],["Sit-up","3x15","reps"],["Air Squat","3x20","reps"],
    ["Burpee","3x10","reps"],["Mountain Climbers","3x30s","time"],["Jump Squat","3x12","reps"],
    ["Handstand Hold","3x20s","time"],["Pistol Squat","3x5/leg","reps"]],
  "Cardio Machine":[["Treadmill","20 min","time"],["Rowing Machine","2000m","distance"],
    ["Ski Erg","1000m","distance"],["Assault Bike","15 min","time"],["Stationary Bike","30 min","time"],
    ["Elliptical","25 min","time"],["Stairmaster","20 min","time"],["Jacob's Ladder","10 min","time"]],
  "Cardio Outdoor":[["Running","5 km","distance"],["Cycling","20 km","distance"],["Swimming","1500m","distance"],
    ["Walking","30 min","time"],["Hiking","60 min","time"],["Jump Rope","10 min","time"]],
  "Hyrox Station":[["Sled Push","4x25m","distance"],["Sled Pull","4x25m","distance"],
    ["Sandbag Lunges","4x25m","distance"],["Wall Balls","4x15","reps"],["Burpee Broad Jumps","4x10","reps"],
    ["Farmer's Carry (station)","4x200m","distance"],["Ski Erg (station)","4x250m","distance"],["Rowing (station)","4x250m","distance"]],
  "Mobility / Stretch":[["Hip Flexor Stretch","2x30s/side","time"],["Couch Stretch","2x45s/side","time"],
    ["Pigeon Pose","2x45s/side","time"],["World's Greatest Stretch","2x5/side","reps"],
    ["Thoracic Rotation","2x10/side","reps"],["Shoulder Dislocate","2x10","reps"],["Cat-Cow","2x10","reps"],
    ["90/90 Hip Switch","2x8/side","reps"],["Hamstring Stretch","2x30s/side","time"],["Calf Stretch","2x30s/side","time"],
    ["Ankle Circles","2x10/side","reps"],["Foam Rolling — Quads","2 min/side","time"],
    ["Foam Rolling — Back","2 min","time"],["Band Pull-Apart","3x15","reps"],["Deep Squat Hold","3x30s","time"]]
};

function allLibraryExercises(){
  const custom = LS.get("hx_custom_exercises", []);
  const list = [];
  Object.entries(LIBRARY).forEach(([cat, items])=> items.forEach(([name,presc,unit])=> list.push({name,cat,presc,unit,custom:false})));
  custom.forEach(ex=> list.push({...ex, custom:true}));
  return list;
}

/* ---------- Icons (inline SVG, no deps) ---------- */
const ICONS = {
  plan:'<path d="M6.5 6.5h11v11h-11z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3v4M16 3v4M6.5 10h11" stroke="currentColor" stroke-width="2" fill="none"/>',
  workout:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 8l6 4-6 4z" fill="currentColor"/>',
  library:'<path d="M5 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 4h1a2 2 0 0 1 2 2v14h-3" fill="none" stroke="currentColor" stroke-width="2"/>',
  body:'<circle cx="12" cy="5" r="2.2" fill="currentColor"/><path d="M12 8v7M8 11h8M9 20l3-5 3 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  nutrition:'<path d="M12 21c-4 0-7-4-7-9a6 6 0 0 1 7-6 6 6 0 0 1 7 6c0 5-3 9-7 9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6c0-2 1.5-3.5 3-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  progress:'<path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  check:'<path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  x:'<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
};
function svg(name, size=19){ return `<svg width="${size}" height="${size}" viewBox="0 0 24 24">${ICONS[name]}</svg>`; }

/* =========================================================
   STATE
========================================================= */
const state = {
  tab: LS.get("hx_tab","plan"),
  activeWeek: LS.get("hx_active_week",1),
  activeDayIdx: 0,
  completed: LS.get("hx_completed",{}),
  nutrition: LS.get("hx_nutrition",{bodyweight:101,maintenance:2900,deficit:400}),
  bodylog: LS.get("hx_bodylog",[]),
  customExercises: LS.get("hx_custom_exercises",[]),
  workoutLog: LS.get("hx_workout_log",[]),
  restDuration: LS.get("hx_rest_duration",90),
  session: LS.get("hx_active_session", null),
  libCategory: "All",
  libSearch: "",
  showCustomForm: false,
  timer: null
};

function persist(){
  LS.set("hx_tab", state.tab);
  LS.set("hx_active_week", state.activeWeek);
  LS.set("hx_completed", state.completed);
  LS.set("hx_nutrition", state.nutrition);
  LS.set("hx_bodylog", state.bodylog);
  LS.set("hx_custom_exercises", state.customExercises);
  LS.set("hx_workout_log", state.workoutLog);
  LS.set("hx_rest_duration", state.restDuration);
  LS.set("hx_active_session", state.session);
}

function render(){
  const root = document.getElementById("app");
  root.innerHTML = `
    <header class="app-header">
      <div class="eyebrow-row"><div class="eyebrow-dash"></div><span class="eyebrow">Full Training System</span></div>
      <h1 class="title">HYROX PREP</h1>
    </header>
    <main id="main"></main>
    ${renderTimerOverlay()}
    <nav class="bottom-nav">
      ${navBtn("plan","Plan")}
      ${navBtn("workout","Workout")}
      ${navBtn("library","Library")}
      ${navBtn("body","Body")}
      ${navBtn("nutrition","Fuel")}
      ${navBtn("progress","Progress")}
    </nav>
  `;
  const main = document.getElementById("main");
  if(state.tab==="plan") main.innerHTML = renderPlanTab();
  if(state.tab==="workout") main.innerHTML = renderWorkoutTab();
  if(state.tab==="library") main.innerHTML = renderLibraryTab();
  if(state.tab==="body") main.innerHTML = renderBodyTab();
  if(state.tab==="nutrition") main.innerHTML = renderNutritionTab();
  if(state.tab==="progress") main.innerHTML = renderProgressTab();
  attachHandlers();
  persist();
}

function navBtn(id,label){
  return `<button class="nav-btn ${state.tab===id?'active':''}" data-nav="${id}">${svg(id)}<span>${label}</span></button>`;
}

/* =========================================================
   PLAN TAB
========================================================= */
function weekProgress(w){
  let total=0, done=0;
  w.days.forEach(d=>d.exercises.forEach(ex=>{ total++; if(state.completed[`${w.week}|${d.day}|${ex.name}`]) done++; }));
  return total? Math.round(done/total*100):0;
}

function renderPlanTab(){
  const week = WEEKS[state.activeWeek-1];
  const day = week.days[state.activeDayIdx];
  return `
    <div class="row-between" style="margin-bottom:8px;">
      <span class="eyebrow-label" style="margin:0;">Race Prep — Phase 1</span>
      <span class="phase-pill">${week.phaseLabel}</span>
    </div>
    <div class="week-rail">
      ${WEEKS.map(w=>{
        const pct = weekProgress(w);
        const active = w.week===state.activeWeek;
        return `<button class="week-chip ${active?'active':''}" data-week="${w.week}">
          ${w.week}<span class="week-bar"><span class="week-bar-fill" style="width:${pct}%; ${pct===100?'background:var(--mint);':''}"></span></span>
        </button>`;
      }).join("")}
    </div>
    <div class="day-tabs">
      ${week.days.map((d,i)=>`<button class="day-tab ${i===state.activeDayIdx?'active':''}" data-day="${i}">
        <div class="dtop">${d.day.toUpperCase()}</div><div class="dbot">${d.session}</div></button>`).join("")}
    </div>
    <div>
      ${day.exercises.map(ex=>{
        const key = `${week.week}|${day.day}|${ex.name}`;
        const done = !!state.completed[key];
        return `<div class="ex-card">
          <div class="ex-stripe ${done?'done':'pending'}"></div>
          <div class="ex-body" data-toggle="${key}">
            <div class="ex-check ${done?'done':''}">${done?svg('check',13):''}</div>
            <div style="flex:1;min-width:0;">
              <div class="ex-name ${done?'done':''}">${ex.name}</div>
              <div class="ex-presc ${done?'done':''}">${ex.presc}</div>
              ${ex.note?`<div class="ex-note">${ex.note}</div>`:''}
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>
  `;
}

/* =========================================================
   WORKOUT TAB — freestyle logger with rest timer
========================================================= */
function renderWorkoutTab(){
  if(!state.session){
    const recent = state.workoutLog.slice(0,5);
    return `
      <div class="eyebrow-label" style="margin-top:4px;">Start a Session</div>
      <button class="btn btn-accent btn-block" data-action="start-session">${svg('plus',16)} New Workout</button>
      <div class="eyebrow-label">Recent Sessions</div>
      ${recent.length===0?`<div class="empty-note">No sessions logged yet.</div>`:
        recent.map(s=>`<div class="history-row">
          <div><div style="font-weight:700;font-size:13px;">${s.exercises.length} exercise${s.exercises.length!==1?'s':''}</div>
          <div class="mono" style="font-size:11px;color:var(--muted);">${s.date}</div></div>
          <button class="del" data-del-session="${s.id}">${svg('x',14)}</button>
        </div>`).join("")}
    `;
  }
  const s = state.session;
  return `
    <div class="eyebrow-label" style="margin-top:4px;">In Progress</div>
    <div class="field" style="align-items:flex-start;">
      <div>
        <label>Started</label>
        <div class="mono" style="font-size:12px;color:var(--muted);margin-top:2px;">${new Date(s.startedAt).toLocaleTimeString()}</div>
      </div>
      <button class="btn btn-accent" style="padding:8px 14px;" data-action="finish-session">Finish</button>
    </div>

    <div class="eyebrow-label">Add Exercise</div>
    <select class="select-input" id="ex-picker">
      <option value="">Choose an exercise…</option>
      ${Object.entries(LIBRARY).map(([cat,items])=>`<optgroup label="${cat}">
        ${items.map(([n])=>`<option value="${n}">${n}</option>`).join("")}
      </optgroup>`).join("")}
      ${state.customExercises.length? `<optgroup label="Custom">${state.customExercises.map(c=>`<option value="${c.name}">${c.name}</option>`).join("")}</optgroup>`:""}
    </select>
    <button class="btn btn-ghost btn-block" data-action="add-exercise" style="margin-bottom:16px;">Add to Session</button>

    ${s.exercises.length===0?`<div class="empty-note">No exercises added yet.</div>`:
      s.exercises.map((ex,exi)=>`
      <div class="info-box" style="margin-bottom:12px;padding:12px;">
        <div class="row-between" style="margin-bottom:8px;">
          <span style="font-weight:800;color:var(--text);font-size:14px;">${ex.name}</span>
          <button class="del" data-del-exercise="${exi}">${svg('x',14)}</button>
        </div>
        ${ex.sets.map((set,si)=>`<div class="history-row" style="margin-bottom:4px;">
          <span class="mono" style="font-size:12px;color:var(--muted);">SET ${si+1}</span>
          <span class="mono" style="font-size:13px;color:var(--accent);">${set.weight?set.weight+'kg × ':''}${set.reps}</span>
          <button class="del" data-del-set="${exi}|${si}">${svg('x',12)}</button>
        </div>`).join("")}
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="number" placeholder="kg" class="mono" id="w-${exi}" style="background:var(--surface-alt);border-radius:8px;padding:8px;width:60px;text-align:center;">
          <input type="text" placeholder="reps / time / dist" class="mono" id="r-${exi}" style="background:var(--surface-alt);border-radius:8px;padding:8px;flex:1;text-align:center;">
          <button class="btn btn-steel" data-log-set="${exi}" style="padding:8px 12px;">Log</button>
        </div>
      </div>
    `).join("")}

    <div class="eyebrow-label">Rest Timer</div>
    <div style="display:flex;gap:8px;">
      ${[60,90,120,180].map(sec=>`<button class="btn btn-ghost" data-rest="${sec}" style="flex:1;">${sec}s</button>`).join("")}
    </div>
  `;
}

/* =========================================================
   TIMER OVERLAY
========================================================= */
function renderTimerOverlay(){
  if(!state.timer) return "";
  return `<div class="timer-overlay">
    <div class="timer-label">Rest</div>
    <div class="timer-ring mono">${formatTime(state.timer.remaining)}</div>
    <button class="btn btn-ghost" data-action="cancel-timer">Skip Rest</button>
  </div>`;
}
function formatTime(s){ const m=Math.floor(s/60); const r=s%60; return `${m}:${r.toString().padStart(2,'0')}`; }

function startTimer(seconds){
  if(state.timer && state.timer.handle) clearInterval(state.timer.handle);
  state.timer = {remaining:seconds, total:seconds, handle:null};
  render();
  state.timer.handle = setInterval(()=>{
    state.timer.remaining--;
    if(state.timer.remaining<=0){
      clearInterval(state.timer.handle);
      playBeep(); vibrate();
      state.timer = null;
      render();
      return;
    }
    if(state.timer.remaining<=3){ vibrate(80); }
    const ring = document.querySelector(".timer-ring");
    if(ring) ring.textContent = formatTime(state.timer.remaining);
  },1000);
}
function playBeep(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    for(let i=0;i<3;i++){
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type="sine"; o.frequency.value=880;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i*0.28;
      g.gain.setValueAtTime(0.15,t);
      g.gain.exponentialRampToValueAtTime(0.001, t+0.22);
      o.start(t); o.stop(t+0.25);
    }
  }catch{}
}
function vibrate(ms=200){ try{ navigator.vibrate && navigator.vibrate(ms); }catch{} }

/* =========================================================
   LIBRARY TAB
========================================================= */
function renderLibraryTab(){
  const cats = ["All", ...Object.keys(LIBRARY), ...(state.customExercises.length?["Custom"]:[])];
  let items = allLibraryExercises();
  if(state.libCategory!=="All") items = items.filter(i=> i.cat===state.libCategory || (state.libCategory==="Custom" && i.custom));
  if(state.libSearch) items = items.filter(i=> i.name.toLowerCase().includes(state.libSearch.toLowerCase()));

  return `
    <div class="search-bar">
      <input type="text" id="lib-search" placeholder="Search any exercise…" value="${state.libSearch}">
    </div>
    <div style="margin-bottom:8px;">
      ${cats.map(c=>`<button class="cat-chip ${state.libCategory===c?'active':''}" data-cat="${c}">${c}</button>`).join("")}
    </div>
    <button class="btn btn-accent btn-block" data-action="show-add-custom" style="margin-bottom:16px;">${svg('plus',16)} Add Custom Exercise</button>
    <div id="custom-form-slot">${state.showCustomForm ? customExerciseForm() : ""}</div>
    ${items.map(ex=>`<div class="lib-item">
      <div><div class="lib-item-name">${ex.name}${ex.custom?' <span style="color:var(--accent);font-size:10px;">CUSTOM</span>':''}</div>
      <div class="lib-item-cat">${ex.cat} · ${ex.presc}</div></div>
    </div>`).join("")}
    ${items.length===0?`<div class="empty-note">No exercises match.</div>`:""}
  `;
}

function customExerciseForm(){
  return `<div class="info-box" style="margin-bottom:16px;">
    <input type="text" id="custom-name" placeholder="Exercise name" style="background:var(--surface-alt);border-radius:8px;padding:10px;width:100%;margin-bottom:8px;font-size:14px;color:var(--text);">
    <select class="select-input" id="custom-cat">
      ${Object.keys(LIBRARY).map(c=>`<option value="${c}">${c}</option>`).join("")}
    </select>
    <input type="text" id="custom-presc" placeholder="Default prescription (e.g. 3x12)" style="background:var(--surface-alt);border-radius:8px;padding:10px;width:100%;margin-bottom:8px;font-size:14px;color:var(--text);">
    <button class="btn btn-accent btn-block" data-action="save-custom">Save Exercise</button>
  </div>`;
}

/* =========================================================
   BODY TAB
========================================================= */
function renderBodyTab(){
  const entries = state.bodylog;
  const first = entries[entries.length-1];
  const latest = entries[0];
  const delta = (first && latest) ? (Number(latest.weight)-Number(first.weight)).toFixed(1) : null;
  const fieldSm = (id,label,ph,color) => `<div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);">${label}</label>
    <input type="number" id="${id}" placeholder="${ph}" style="display:block;width:100%;background:var(--surface-alt);border-radius:8px;padding:8px;margin-top:4px;font-size:13px;color:${color};"></div>`;
  return `
    <div class="eyebrow-label" style="margin-top:4px;">Log Entry</div>
    <div class="info-box" style="padding:14px;">
      <div class="grid2">
        <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);">Date</label>
          <input type="date" id="b-date" value="${new Date().toISOString().slice(0,10)}" style="display:block;width:100%;background:var(--surface-alt);border-radius:8px;padding:8px;margin-top:4px;font-size:13px;color:var(--text);"></div>
        ${fieldSm("b-weight","Weight (kg)","101.0","var(--accent)")}
        ${fieldSm("b-sleep","Sleep (hrs)","7.5","var(--steel)")}
        ${fieldSm("b-hrv","HRV (ms)","91","var(--steel)")}
        ${fieldSm("b-waist","Waist (cm)","","var(--text)")}
        ${fieldSm("b-chest","Chest (cm)","","var(--text)")}
        ${fieldSm("b-arms","Arms (cm)","","var(--text)")}
        ${fieldSm("b-bodyfat","Body Fat (%)","","var(--text)")}
      </div>
      <button class="btn btn-accent btn-block" data-action="log-body" style="margin-top:10px;">Log Entry</button>
    </div>

    ${delta!==null?`<div class="field" style="margin-top:12px;"><label>Total weight change</label>
      <span class="mono" style="font-weight:900;color:${Number(delta)<=0?'var(--mint)':'var(--accent)'};">${delta} kg</span></div>`:''}

    <div class="eyebrow-label">History</div>
    ${entries.length===0?`<div class="empty-note">No entries yet.</div>`:
      entries.map(e=>`<div class="history-row">
        <span class="mono" style="font-size:11px;color:var(--muted);">${e.date}</span>
        <span class="mono" style="font-size:12px;color:var(--accent);">${e.weight}kg</span>
        <span class="mono" style="font-size:12px;color:var(--steel);">${e.sleep||'–'}h</span>
        <span class="mono" style="font-size:12px;color:var(--steel);">${e.hrv||'–'}ms</span>
        <button class="del" data-del-body="${e.id}">${svg('x',12)}</button>
      </div>`).join("")}
  `;
}

/* =========================================================
   NUTRITION TAB
========================================================= */
function renderNutritionTab(){
  const {bodyweight, maintenance, deficit} = state.nutrition;
  const target = maintenance - deficit;
  const proteinLow = Math.round(bodyweight*1.6);
  const proteinHigh = Math.round(bodyweight*2);
  const weeklyLoss = ((deficit*7)/7700).toFixed(2);
  return `
    <div class="eyebrow-label" style="margin-top:4px;">Daily Targets</div>
    <div class="field"><label>Bodyweight</label><div><input type="number" id="n-bw" value="${bodyweight}"><span class="unit">kg</span></div></div>
    <div class="field"><label>Maintenance calories</label><div><input type="number" id="n-maint" value="${maintenance}"><span class="unit">kcal</span></div></div>
    <div class="field"><label>Target deficit</label><div><input type="number" id="n-def" value="${deficit}"><span class="unit">kcal</span></div></div>

    <div class="eyebrow-label">Computed</div>
    <div class="grid2">
      <div class="stat-card"><div class="stat-label">Calorie Target</div><div class="stat-value" style="color:var(--accent);">${target}<span class="stat-unit">kcal</span></div></div>
      <div class="stat-card"><div class="stat-label">Weekly Loss (est.)</div><div class="stat-value" style="color:var(--mint);">${weeklyLoss}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">Protein — low</div><div class="stat-value" style="color:var(--steel);">${proteinLow}<span class="stat-unit">g</span></div></div>
      <div class="stat-card"><div class="stat-label">Protein — high</div><div class="stat-value" style="color:var(--steel);">${proteinHigh}<span class="stat-unit">g</span></div></div>
    </div>
    <div class="info-box" style="margin-top:14px;">Recalculate maintenance every 2–3 weeks against your actual weight trend. Don't drop below ~1800–2000 kcal given training volume — recovery beats speed here.</div>
  `;
}

/* =========================================================
   PROGRESS TAB
========================================================= */
function renderProgressTab(){
  let total=0, done=0;
  const perWeek = WEEKS.map(w=>{
    let wt=0, wd=0;
    w.days.forEach(d=>d.exercises.forEach(ex=>{ wt++; total++; if(state.completed[`${w.week}|${d.day}|${ex.name}`]){wd++; done++;} }));
    return {week:w.week, pct: wt?Math.round(wd/wt*100):0, phase:w.phase};
  });
  const overall = total? Math.round(done/total*100):0;
  const phaseColor = {base:'var(--steel)',build:'var(--steel)',load:'var(--accent)',peak:'var(--accent)',deload:'var(--mint)'};
  const sessions = state.workoutLog.length;

  return `
    <div class="eyebrow-label" style="margin-top:4px;">Phase 1 Completion</div>
    <div class="info-box" style="text-align:center;padding:20px;">
      <div class="mono" style="font-weight:900;font-size:36px;color:var(--accent);">${overall}%</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px;">${done} of ${total} plan sessions logged</div>
    </div>
    <div class="grid2" style="margin-top:12px;margin-bottom:16px;">
      <div class="stat-card"><div class="stat-label">Freestyle Sessions</div><div class="stat-value">${sessions}</div></div>
      <div class="stat-card"><div class="stat-label">Body Logs</div><div class="stat-value">${state.bodylog.length}</div></div>
    </div>
    <div class="eyebrow-label">By Week</div>
    ${perWeek.map(w=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div class="mono" style="width:50px;font-size:11px;font-weight:700;color:var(--muted);">WK ${w.week}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${w.pct}%;background:${phaseColor[w.phase]};"></div></div>
      <div class="mono" style="width:36px;text-align:right;font-size:11px;">${w.pct}%</div>
    </div>`).join("")}
  `;
}

/* =========================================================
   EVENT HANDLERS
========================================================= */
function attachHandlers(){
  document.querySelectorAll("[data-nav]").forEach(el=>{
    el.addEventListener("click", ()=>{ state.tab = el.dataset.nav; render(); });
  });

  // Plan tab
  document.querySelectorAll("[data-week]").forEach(el=>{
    el.addEventListener("click", ()=>{ state.activeWeek = Number(el.dataset.week); state.activeDayIdx = 0; render(); });
  });
  document.querySelectorAll("[data-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ state.activeDayIdx = Number(el.dataset.day); render(); });
  });
  document.querySelectorAll("[data-toggle]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const key = el.dataset.toggle;
      state.completed[key] = !state.completed[key];
      render();
    });
  });

  // Workout tab
  const startBtn = document.querySelector('[data-action="start-session"]');
  if(startBtn) startBtn.addEventListener("click", ()=>{
    state.session = { startedAt: Date.now(), exercises: [] };
    render();
  });
  const finishBtn = document.querySelector('[data-action="finish-session"]');
  if(finishBtn) finishBtn.addEventListener("click", ()=>{
    if(state.session.exercises.length){
      state.workoutLog.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0,10),
        exercises: state.session.exercises
      });
    }
    state.session = null;
    render();
  });
  document.querySelectorAll("[data-del-session]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.workoutLog = state.workoutLog.filter(s=>s.id !== Number(el.dataset.delSession));
      render();
    });
  });
  const addExBtn = document.querySelector('[data-action="add-exercise"]');
  if(addExBtn) addExBtn.addEventListener("click", ()=>{
    const picker = document.getElementById("ex-picker");
    if(picker && picker.value){
      state.session.exercises.push({ name: picker.value, sets: [] });
      render();
    }
  });
  document.querySelectorAll("[data-del-exercise]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.session.exercises.splice(Number(el.dataset.delExercise),1);
      render();
    });
  });
  document.querySelectorAll("[data-log-set]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const exi = Number(el.dataset.logSet);
      const w = document.getElementById(`w-${exi}`).value;
      const r = document.getElementById(`r-${exi}`).value;
      if(!r) return;
      state.session.exercises[exi].sets.push({ weight: w, reps: r });
      render();
      startTimer(state.restDuration);
    });
  });
  document.querySelectorAll("[data-del-set]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const [exi,si] = el.dataset.delSet.split("|").map(Number);
      state.session.exercises[exi].sets.splice(si,1);
      render();
    });
  });
  document.querySelectorAll("[data-rest]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.restDuration = Number(el.dataset.rest);
      startTimer(state.restDuration);
    });
  });

  // Timer overlay
  const cancelTimer = document.querySelector('[data-action="cancel-timer"]');
  if(cancelTimer) cancelTimer.addEventListener("click", ()=>{
    if(state.timer && state.timer.handle) clearInterval(state.timer.handle);
    state.timer = null;
    render();
  });

  // Library tab
  const libSearch = document.getElementById("lib-search");
  if(libSearch) libSearch.addEventListener("input", (e)=>{
    state.libSearch = e.target.value;
    const items = allLibraryExercises().filter(i=>{
      const catOk = state.libCategory==="All" || i.cat===state.libCategory || (state.libCategory==="Custom" && i.custom);
      const searchOk = i.name.toLowerCase().includes(state.libSearch.toLowerCase());
      return catOk && searchOk;
    });
    const list = document.querySelectorAll(".lib-item");
    // simplest: full re-render but preserve focus by re-attaching after
    render();
    setTimeout(()=>{ const s=document.getElementById("lib-search"); if(s){ s.focus(); s.setSelectionRange(s.value.length,s.value.length); } },0);
  });
  document.querySelectorAll("[data-cat]").forEach(el=>{
    el.addEventListener("click", ()=>{ state.libCategory = el.dataset.cat; render(); });
  });
  const showCustomBtn = document.querySelector('[data-action="show-add-custom"]');
  if(showCustomBtn) showCustomBtn.addEventListener("click", ()=>{
    state.showCustomForm = !state.showCustomForm;
    render();
  });
  const saveCustomBtn = document.querySelector('[data-action="save-custom"]');
  if(saveCustomBtn) saveCustomBtn.addEventListener("click", ()=>{
    const name = document.getElementById("custom-name").value.trim();
    const cat = document.getElementById("custom-cat").value;
    const presc = document.getElementById("custom-presc").value.trim() || "—";
    if(!name) return;
    state.customExercises.push({ name, cat, presc, unit:"reps" });
    state.showCustomForm = false;
    render();
  });

  // Body tab
  const logBodyBtn = document.querySelector('[data-action="log-body"]');
  if(logBodyBtn) logBodyBtn.addEventListener("click", ()=>{
    const weight = document.getElementById("b-weight").value;
    if(!weight) return;
    state.bodylog.unshift({
      id: Date.now(),
      date: document.getElementById("b-date").value,
      weight,
      sleep: document.getElementById("b-sleep").value,
      hrv: document.getElementById("b-hrv").value,
      waist: document.getElementById("b-waist").value,
      chest: document.getElementById("b-chest").value,
      arms: document.getElementById("b-arms").value,
      bodyfat: document.getElementById("b-bodyfat").value
    });
    render();
  });
  document.querySelectorAll("[data-del-body]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.bodylog = state.bodylog.filter(e=>e.id !== Number(el.dataset.delBody));
      render();
    });
  });

  // Nutrition tab
  ["n-bw","n-maint","n-def"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener("change", ()=>{
      state.nutrition.bodyweight = Number(document.getElementById("n-bw").value);
      state.nutrition.maintenance = Number(document.getElementById("n-maint").value);
      state.nutrition.deficit = Number(document.getElementById("n-def").value);
      render();
    });
  });
}

/* =========================================================
   BOOTSTRAP
========================================================= */
render();

if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}
