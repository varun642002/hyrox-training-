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
  "Barbell":[["Back Squat","4x6","reps","Quadriceps"],["Front Squat","4x6","reps","Quadriceps"],["Deadlift","4x5","reps","Hamstrings"],
    ["Romanian Deadlift","3x8","reps","Hamstrings"],["Sumo Deadlift","4x5","reps","Glutes"],["Bench Press","4x6","reps","Chest"],
    ["Incline Bench Press","4x8","reps","Chest"],["Overhead Press","3x8","reps","Shoulders"],["Push Press","3x6","reps","Shoulders"],
    ["Bent-Over Row","4x8","reps","Lats"],["Barbell Curl","3x10","reps","Biceps"],["Hip Thrust","3x10","reps","Glutes"]],
  "Dumbbell":[["DB Bench Press","4x8","reps","Chest"],["DB Row","4x10","reps","Lats"],["DB Shoulder Press","3x10","reps","Shoulders"],
    ["Goblet Squat","3x12","reps","Quadriceps"],["Walking Lunges","3x12/leg","reps","Quadriceps"],["Bulgarian Split Squat","3x10/leg","reps","Quadriceps"],
    ["Farmer's Carry","4x40m","distance","Forearms"],["DB Curl","3x12","reps","Biceps"],["Lateral Raise","3x12","reps","Shoulders"],
    ["DB RDL","3x10","reps","Hamstrings"],["Renegade Row","3x8/side","reps","Lats"]],
  "Machine":[["Leg Press","4x10","reps","Quadriceps"],["Hack Squat","4x10","reps","Quadriceps"],["Leg Extension","3x12","reps","Quadriceps"],
    ["Leg Curl","3x12","reps","Hamstrings"],["Lat Pulldown","4x10","reps","Lats"],["Seated Cable Row","4x10","reps","Lats"],
    ["Chest Press Machine","4x10","reps","Chest"],["Shoulder Press Machine","3x10","reps","Shoulders"],["Pec Deck","3x12","reps","Chest"],
    ["Cable Crossover","3x12","reps","Chest"],["Smith Machine Squat","4x8","reps","Quadriceps"],["Assisted Pull-up","3x8","reps","Lats"],
    ["Assisted Dip","3x8","reps","Triceps"],["Cable Tricep Pushdown","3x12","reps","Triceps"],["Cable Face Pull","3x15","reps","Traps"],
    ["Hip Abductor Machine","3x15","reps","Abductors"],["Hip Adductor Machine","3x15","reps","Adductors"],["Calf Raise Machine","4x15","reps","Calves"]],
  "Bodyweight":[["Push-up","3x15","reps","Chest"],["Pull-up","3x8","reps","Lats"],["Chin-up","3x8","reps","Biceps"],
    ["Dip","3x10","reps","Triceps"],["Plank","3x45s","time","Abdominals"],["Sit-up","3x15","reps","Abdominals"],["Air Squat","3x20","reps","Quadriceps"],
    ["Burpee","3x10","reps","Cardio"],["Mountain Climbers","3x30s","time","Abdominals"],["Jump Squat","3x12","reps","Quadriceps"],
    ["Handstand Hold","3x20s","time","Shoulders"],["Pistol Squat","3x5/leg","reps","Quadriceps"]],
  "Cardio Machine":[["Treadmill","20 min","time","Cardio"],["Rowing Machine","2000m","distance","Cardio"],
    ["Ski Erg","1000m","distance","Cardio"],["Assault Bike","15 min","time","Cardio"],["Stationary Bike","30 min","time","Cardio"],
    ["Elliptical","25 min","time","Cardio"],["Stairmaster","20 min","time","Cardio"],["Jacob's Ladder","10 min","time","Cardio"]],
  "Cardio Outdoor":[["Running","5 km","distance","Cardio"],["Cycling","20 km","distance","Cardio"],["Swimming","1500m","distance","Cardio"],
    ["Walking","30 min","time","Cardio"],["Hiking","60 min","time","Cardio"],["Jump Rope","10 min","time","Cardio"]],
  "Hyrox Station":[["Sled Push","4x25m","distance","Quadriceps"],["Sled Pull","4x25m","distance","Lats"],
    ["Sandbag Lunges","4x25m","distance","Quadriceps"],["Wall Balls","4x15","reps","Quadriceps"],["Burpee Broad Jumps","4x10","reps","Cardio"],
    ["Farmer's Carry (station)","4x200m","distance","Forearms"],["Ski Erg (station)","4x250m","distance","Cardio"],["Rowing (station)","4x250m","distance","Cardio"]],
  "Mobility / Stretch":[["Hip Flexor Stretch","2x30s/side","time","Mobility"],["Couch Stretch","2x45s/side","time","Mobility"],
    ["Pigeon Pose","2x45s/side","time","Mobility"],["World's Greatest Stretch","2x5/side","reps","Mobility"],
    ["Thoracic Rotation","2x10/side","reps","Mobility"],["Shoulder Dislocate","2x10","reps","Mobility"],["Cat-Cow","2x10","reps","Mobility"],
    ["90/90 Hip Switch","2x8/side","reps","Mobility"],["Hamstring Stretch","2x30s/side","time","Mobility"],["Calf Stretch","2x30s/side","time","Mobility"],
    ["Ankle Circles","2x10/side","reps","Mobility"],["Foam Rolling — Quads","2 min/side","time","Mobility"],
    ["Foam Rolling — Back","2 min","time","Mobility"],["Band Pull-Apart","3x15","reps","Traps"],["Deep Squat Hold","3x30s","time","Mobility"]]
};

// Names that appear only in the Hyrox 8-week Plan (slightly different wording than library entries)
const PLAN_MUSCLE_MAP = {
  "Back Squat":"Quadriceps","Romanian Deadlift":"Hamstrings","Walking Lunges":"Quadriceps","Plank":"Abdominals","Pallof Press":"Abdominals",
  "Warm-up":"Cardio","Intervals":"Cardio","Cool-down":"Cardio","Bench Press":"Chest","Bent-Over Row":"Lats",
  "Overhead Press":"Shoulders","Farmer's Carry":"Forearms","Hanging Leg Raise":"Abdominals","Row / Ski / Run":"Cardio",
  "Sled Push/Pull":"Quadriceps","Wall Balls":"Quadriceps","Burpee Broad Jumps":"Cardio","Ski Erg":"Cardio",
  "Weighted Sit-Up":"Abdominals","Walk / Mobility / Light Swim":"Mobility"
};

// Fine-grained muscle categories shown in the Body Distribution table (order matches display order)
const BODY_MUSCLES = ["Abdominals","Abductors","Adductors","Biceps","Calves","Cardio","Chest","Forearms",
  "Glutes","Hamstrings","Lats","Quadriceps","Shoulders","Traps","Triceps"];

// Broad grouping used only for the 6-axis radar chart
const RADAR_MUSCLES = ["Back","Chest","Legs","Core","Arms","Shoulders"];
const FINE_TO_BROAD = {
  Lats:"Back", Traps:"Back",
  Chest:"Chest",
  Quadriceps:"Legs", Hamstrings:"Legs", Glutes:"Legs", Calves:"Legs", Abductors:"Legs", Adductors:"Legs",
  Abdominals:"Core",
  Biceps:"Arms", Triceps:"Arms", Forearms:"Arms",
  Shoulders:"Shoulders"
};


function allLibraryExercises(){
  const custom = LS.get("hx_custom_exercises", []);
  const list = [];
  Object.entries(LIBRARY).forEach(([cat, items])=> items.forEach(([name,presc,unit,muscle])=> list.push({name,cat,presc,unit,muscle,custom:false})));
  custom.forEach(ex=> list.push({...ex, custom:true}));
  return list;
}

function getMuscle(name){
  for(const items of Object.values(LIBRARY)){
    const hit = items.find(i=>i[0]===name);
    if(hit) return hit[3];
  }
  const custom = LS.get("hx_custom_exercises", []);
  const c = custom.find(i=>i.name===name);
  if(c) return c.muscle || "Other";
  if(PLAN_MUSCLE_MAP[name]) return PLAN_MUSCLE_MAP[name];
  return "Other";
}

function parseSets(presc){
  const m = /^(\d+)\s*x/i.exec(presc||"");
  return m ? Number(m[1]) : 3;
}

function getPlanPresc(weekNum, dayName, exName){
  const w = WEEKS[weekNum-1];
  if(!w) return "";
  const d = w.days.find(dd=>dd.day===dayName);
  if(!d) return "";
  const ex = d.exercises.find(e=>e.name===exName);
  return ex ? ex.presc : "";
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
  plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  gear:'<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
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
  foodLog: LS.get("hx_food_log",[]),
  routines: LS.get("hx_routines",[]),
  routineBuilder: null,
  calc: LS.get("hx_calc", {
    activeCalc:"bmr", age:25, gender:"male", height:180, weight:101,
    neck:38, waist:90, hip:95, restingHR:60, activityMultiplier:1.465, result:null,
    goalDelta:0, bust:90, bwaist:75, highHip:85, bhip:95
  }),
  settings: LS.get("hx_settings", {
    sounds:true, vibration:true, defaultRest:90, keepAwake:false,
    plateCalc:true, rpeTracking:true, autoStartRest:true
  }),
  plateCalcOpen: null, // element id string when plate calc popover open
  restDuration: LS.get("hx_rest_duration",90),
  session: LS.get("hx_active_session", null),
  libCategory: "All",
  libSearch: "",
  showCustomForm: false,
  chartMetric: "sets",
  calendarMonthOffset: 0,
  bodyDistWeekOffset: 0,
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
  LS.set("hx_food_log", state.foodLog);
  LS.set("hx_routines", state.routines);
  LS.set("hx_calc", state.calc);
  LS.set("hx_settings", state.settings);
  LS.set("hx_rest_duration", state.restDuration);
  LS.set("hx_active_session", state.session);
}

function render(){
  const root = document.getElementById("app");
  root.innerHTML = `
    <header class="app-header" style="display:flex;align-items:flex-end;justify-content:space-between;">
      <div>
        <div class="eyebrow-row"><div class="eyebrow-dash"></div><span class="eyebrow">Full Training System</span></div>
        <h1 class="title">HYROX PREP</h1>
      </div>
      <button data-nav="settings" style="background:${state.tab==='settings'?'var(--surface-alt)':'none'};border:none;color:${state.tab==='settings'?'var(--accent)':'var(--muted)'};padding:8px;border-radius:10px;cursor:pointer;">${svg('gear',22)}</button>
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
  if(state.tab==="settings") main.innerHTML = renderSettingsTab();
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
   WORKOUT TAB — freestyle logger, set-table style
========================================================= */
const REST_OPTIONS = [0,60,90,120,180];
const RPE_OPTIONS = ["–","6","6.5","7","7.5","8","8.5","9","9.5","10"];

function getPreviousSet(exerciseName, setIndex){
  for(const sess of state.workoutLog){
    const ex = sess.exercises.find(e=>e.name===exerciseName);
    if(ex && ex.sets.length){
      const set = ex.sets[setIndex] || ex.sets[ex.sets.length-1];
      if(set && (set.weight||set.reps)) return set;
    }
  }
  return null;
}

function sessionMuscles(exercises){
  const set = new Set();
  exercises.forEach(ex=> set.add(getMuscle(ex.name)));
  return Array.from(set);
}

function renderRoutineBuilder(){
  const b = state.routineBuilder;
  return `<div class="info-box" style="padding:14px;margin-bottom:12px;">
    <input type="text" id="routine-name" placeholder="Routine name (e.g. Leg Day 2)" value="${b.name}"
      style="width:100%;background:var(--surface-alt);border-radius:8px;padding:10px;font-size:14px;color:var(--text);margin-bottom:10px;">

    ${b.exercises.length? b.exercises.map((e,i)=>`<div class="history-row" style="margin-bottom:4px;">
      <span style="font-size:13px;font-weight:600;">${e.name}</span>
      <span class="mono" style="font-size:12px;color:var(--steel);">${e.sets} sets</span>
      <button class="del" data-remove-builder-ex="${i}">${svg('x',12)}</button>
    </div>`).join("") : ""}

    <div style="display:flex;gap:6px;margin-top:${b.exercises.length?'10px':'0'};">
      <select class="select-input" id="routine-ex-picker" style="margin-bottom:0;flex:1;">
        <option value="">Choose an exercise…</option>
        ${Object.entries(LIBRARY).map(([cat,items])=>`<optgroup label="${cat}">
          ${items.map(([n])=>`<option value="${n}">${n}</option>`).join("")}
        </optgroup>`).join("")}
      </select>
      <input type="number" id="routine-ex-sets" value="3" min="1" style="width:52px;background:var(--surface-alt);border-radius:8px;padding:9px;text-align:center;color:var(--accent);font-family:'SF Mono',monospace;font-weight:700;">
    </div>
    <button class="btn btn-ghost btn-block" data-action="add-builder-exercise" style="margin-top:8px;">${svg('plus',14)} Add Exercise</button>
    <button class="btn btn-accent btn-block" data-action="save-routine" style="margin-top:10px;">Save Routine</button>
  </div>`;
}

function renderWorkoutTab(){
  if(!state.session){
    const recent = state.workoutLog.slice(0,5);
    return `
      <button class="btn btn-accent btn-block" data-action="start-session" style="margin-top:4px;">${svg('plus',16)} Start Empty Workout</button>

      <div class="row-between" style="margin:18px 0 8px;">
        <span class="eyebrow-label" style="margin:0;">Routines</span>
        <button class="btn btn-ghost" data-action="toggle-routine-builder" style="padding:6px 12px;font-size:12px;">${state.routineBuilder? 'Cancel' : svg('plus',13)+' New Routine'}</button>
      </div>
      ${state.routineBuilder ? renderRoutineBuilder() : ""}
      ${state.routines.length===0 && !state.routineBuilder ? `<div class="empty-note">No routines saved yet.</div>` :
        state.routines.map(r=>`<div class="routine-card">
          <div class="row-between">
            <span style="font-weight:800;font-size:15px;">${r.name}</span>
            <button class="del" data-del-routine="${r.id}">${svg('x',14)}</button>
          </div>
          <div style="font-size:12px;color:var(--muted);margin:6px 0 12px;">${r.exercises.map(e=>e.name).join(", ")}</div>
          <button class="btn btn-steel btn-block" data-start-routine="${r.id}">Start Routine</button>
        </div>`).join("")}

      <div class="eyebrow-label" style="margin-top:20px;">Recent Sessions</div>
      ${recent.length===0?`<div class="empty-note">No sessions logged yet.</div>`:
        recent.map(s=>{
          const muscles = sessionMuscles(s.exercises);
          return `<div class="history-row" style="align-items:flex-start;">
          <div>
            <div style="font-weight:700;font-size:13px;">${s.exercises.length} exercise${s.exercises.length!==1?'s':''}${s.durationMin?` · ${s.durationMin} min`:''}</div>
            <div class="mono" style="font-size:11px;color:var(--muted);margin-top:2px;">${s.date}${s.volume?` · ${Math.round(s.volume)}kg vol`:''}</div>
            <div style="margin-top:5px;">${muscles.map(m=>`<span class="muscle-chip">${m}</span>`).join("")}</div>
          </div>
          <button class="del" data-del-session="${s.id}">${svg('x',14)}</button>
        </div>`;}).join("")}
    `;
  }
  const s = state.session;
  const muscles = sessionMuscles(s.exercises);
  return `
    <div class="row-between" style="margin-bottom:4px;">
      <div>
        <div class="eyebrow-label" style="margin:0 0 2px;">In Progress</div>
        <div class="mono" style="font-size:12px;color:var(--muted);">Started ${new Date(s.startedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <button class="btn btn-accent" style="padding:10px 18px;" data-action="finish-session">Finish</button>
    </div>
    ${muscles.length? `<div style="margin:10px 0 4px;">${muscles.map(m=>`<span class="muscle-chip active">${m}</span>`).join("")}</div>`:""}

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
      s.exercises.map((ex,exi)=>{
        const muscle = getMuscle(ex.name);
        const restLabel = ex.restDuration ? `${ex.restDuration}s` : "OFF";
        const showRPE = state.settings.rpeTracking;
        const isBarbell = (LIBRARY["Barbell"]||[]).some(i=>i[0]===ex.name);
        const showPlates = state.settings.plateCalc && isBarbell;
        const gridCols = showRPE ? "24px 1fr 52px 52px 44px 32px" : "24px 1fr 62px 62px 32px";
        return `
        <div class="ex-log-card">
          <div class="row-between" style="margin-bottom:4px;">
            <div>
              <div style="font-weight:800;color:var(--steel);font-size:15px;">${ex.name}</div>
              <span class="muscle-chip">${muscle}</span>
            </div>
            <button class="del" data-del-exercise="${exi}">${svg('x',15)}</button>
          </div>
          <input type="text" class="notes-inline" placeholder="Add notes here…" value="${ex.notes||''}" data-notes-exercise="${exi}">
          <div class="row-between">
            <button class="rest-toggle" data-rest-toggle="${exi}">${svg('workout',13)} Rest Timer: ${restLabel}</button>
            ${showPlates?`<button class="rest-toggle" data-plate-calc="${exi}" style="color:var(--accent);">Plates</button>`:""}
          </div>
          ${state.plateCalcOpen===String(exi) ? renderPlatePopover(exi) : ""}

          <div class="set-table-header" style="grid-template-columns:${gridCols};">
            <span>SET</span><span>PREVIOUS</span><span>KG</span><span>REPS</span>${showRPE?"<span>RPE</span>":""}<span></span>
          </div>
          ${ex.sets.map((set,si)=>{
            const prev = getPreviousSet(ex.name, si);
            const prevLabel = prev ? `${prev.weight||'–'}kg × ${prev.reps||'–'}` : "–";
            return `<div class="set-row ${set.done?'done':''}" style="grid-template-columns:${gridCols};">
              <span class="mono set-num">${si+1}</span>
              <span class="mono set-prev">${prevLabel}</span>
              <input type="number" class="mono set-input" value="${set.weight}" data-set-field="${exi}|${si}|weight" placeholder="–">
              <input type="text" class="mono set-input" value="${set.reps}" data-set-field="${exi}|${si}|reps" placeholder="–">
              ${showRPE?`<button class="rpe-btn" data-rpe="${exi}|${si}">${set.rpe||'RPE'}</button>`:""}
              <button class="set-check ${set.done?'done':''}" data-set-done="${exi}|${si}">${set.done?svg('check',13):''}</button>
            </div>`;
          }).join("")}
          <button class="add-set-btn" data-add-set="${exi}">${svg('plus',14)} Add Set</button>
        </div>
      `;}).join("")}
  `;
}

function renderPlatePopover(exi){
  const target = Number(state.plateTarget||0);
  const bar = Number(state.plateBar||20);
  const res = calcPlates(target, bar);
  return `<div class="info-box" style="padding:12px;margin-bottom:10px;">
    <div style="display:flex;gap:6px;margin-bottom:8px;">
      <div style="flex:1;"><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);">Target (kg)</label>
        <input type="number" id="plate-target" value="${target||''}" placeholder="100" style="display:block;width:100%;background:var(--surface-alt);border-radius:8px;padding:8px;margin-top:4px;font-family:'SF Mono',monospace;font-weight:700;color:var(--accent);"></div>
      <div style="width:90px;"><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);">Bar (kg)</label>
        <select class="select-input" id="plate-bar" style="margin:4px 0 0;padding:8px;">
          ${[20,15,10,7.5].map(b=>`<option value="${b}" ${bar===b?'selected':''}>${b}</option>`).join("")}
        </select></div>
    </div>
    <button class="btn btn-steel btn-block" data-action="run-plate-calc">Calculate Plates</button>
    ${target>0 ? (res.perSide.length ?
      `<div style="margin-top:10px;text-align:center;">
        <div class="stat-label">Per Side</div>
        <div class="mono" style="font-weight:900;font-size:16px;color:var(--text);margin-top:4px;">${res.perSide.map(p=>`${p.count}×${p.plate}kg`).join("  +  ")}</div>
        ${res.remainder>0.01?`<div style="font-size:11px;color:var(--accent);margin-top:4px;">${res.remainder.toFixed(2)}kg/side can't be made with standard plates</div>`:""}
      </div>`
      : `<div style="font-size:12px;color:var(--muted);margin-top:8px;text-align:center;">Target must be heavier than the bar.</div>`) : ""}
  </div>`;
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
  if(!state.settings.sounds) return;
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
function vibrate(ms=200){ if(!state.settings.vibration) return; try{ navigator.vibrate && navigator.vibrate(ms); }catch{} }

/* Wake lock — keeps screen on during an active session when enabled */
let wakeLockHandle = null;
async function applyWakeLock(){
  try{
    const shouldHold = state.settings.keepAwake && !!state.session;
    if(shouldHold && !wakeLockHandle && "wakeLock" in navigator){
      wakeLockHandle = await navigator.wakeLock.request("screen");
      wakeLockHandle.addEventListener("release", ()=>{ wakeLockHandle = null; });
    } else if(!shouldHold && wakeLockHandle){
      await wakeLockHandle.release();
      wakeLockHandle = null;
    }
  }catch{ wakeLockHandle = null; }
}
document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible") applyWakeLock(); });

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
    <select class="select-input" id="custom-muscle">
      ${[...BODY_MUSCLES,"Mobility","Other"].map(m=>`<option value="${m}">${m}</option>`).join("")}
    </select>
    <input type="text" id="custom-presc" placeholder="Default prescription (e.g. 3x12)" style="background:var(--surface-alt);border-radius:8px;padding:10px;width:100%;margin-bottom:8px;font-size:14px;color:var(--text);">
    <button class="btn btn-accent btn-block" data-action="save-custom">Save Exercise</button>
  </div>`;
}

/* =========================================================
   BODY TAB
========================================================= */
/* =========================================================
   FITNESS CALCULATORS — BMR, TDEE, LBM, Ideal Weight, Body Fat, HR Zones
========================================================= */
function calcBMR(age, gender, heightCm, weightKg){
  // Mifflin-St Jeor
  const base = 10*weightKg + 6.25*heightCm - 5*age;
  return gender==="male" ? base+5 : base-161;
}

const ACTIVITY_MULTIPLIERS = [
  {key:"bmr", label:"Basal Metabolic Rate (BMR)", mult:1},
  {key:"sedentary", label:"Little or no exercise", mult:1.2},
  {key:"light", label:"Exercise 1-3 times/week", mult:1.375},
  {key:"moderate", label:"Exercise 4-5 times/week", mult:1.465},
  {key:"active", label:"Daily exercise or intense 3-4x/week", mult:1.55},
  {key:"veryactive", label:"Intense exercise 6-7 times/week", mult:1.725},
  {key:"extra", label:"Very intense daily, or physical job", mult:1.9}
];

function calcLBM(gender, heightCm, weightKg){
  const boer = gender==="male"
    ? 0.407*weightKg + 0.267*heightCm - 19.2
    : 0.252*weightKg + 0.473*heightCm - 48.3;
  const hume = gender==="male"
    ? 0.3281*weightKg + 0.33929*heightCm - 29.5336
    : 0.29569*weightKg + 0.41813*heightCm - 43.2933;
  return { boer, hume };
}

function calcIdealWeight(gender, heightCm){
  const inchesOver5ft = Math.max(0, (heightCm/2.54) - 60);
  const table = gender==="male"
    ? { Robinson:52+1.9*inchesOver5ft, Miller:56.2+1.41*inchesOver5ft, Devine:50+2.3*inchesOver5ft, Hamwi:48+2.7*inchesOver5ft }
    : { Robinson:49+1.7*inchesOver5ft, Miller:53.1+1.36*inchesOver5ft, Devine:45.5+2.3*inchesOver5ft, Hamwi:45.5+2.2*inchesOver5ft };
  return table;
}

function calcBodyFatNavy(gender, heightCm, neckCm, waistCm, hipCm){
  if(gender==="male"){
    return 495/(1.0324 - 0.19077*Math.log10(waistCm-neckCm) + 0.15456*Math.log10(heightCm)) - 450;
  }
  return 495/(1.29579 - 0.35004*Math.log10(waistCm+(hipCm||0)-neckCm) + 0.22100*Math.log10(heightCm)) - 450;
}

function calcHeartRateZones(age, restingHR){
  const maxHR = 220-age;
  const zones = [
    {label:"50-60% (Very Light)", lo:0.5, hi:0.6},
    {label:"60-70% (Light)", lo:0.6, hi:0.7},
    {label:"70-80% (Moderate)", lo:0.7, hi:0.8},
    {label:"80-90% (Hard)", lo:0.8, hi:0.9},
    {label:"90-100% (Maximum)", lo:0.9, hi:1.0}
  ];
  const useKarvonen = restingHR && restingHR>0;
  const rows = zones.map(z=>{
    if(useKarvonen){
      const lo = Math.round((maxHR-restingHR)*z.lo + restingHR);
      const hi = Math.round((maxHR-restingHR)*z.hi + restingHR);
      return {label:z.label, lo, hi};
    }
    return {label:z.label, lo:Math.round(maxHR*z.lo), hi:Math.round(maxHR*z.hi)};
  });
  return { maxHR, rows, useKarvonen };
}

const CALCULATORS = [
  {key:"bmr", label:"BMR"},
  {key:"calorie", label:"Calories / TDEE (with goal)"},
  {key:"protein", label:"Protein Intake"},
  {key:"carbs", label:"Carbohydrate Intake"},
  {key:"fat", label:"Fat Intake"},
  {key:"lbm", label:"Lean Body Mass"},
  {key:"ideal", label:"Ideal Weight"},
  {key:"bodyfat", label:"Body Fat %"},
  {key:"bodytype", label:"Body Type (Shape)"},
  {key:"hr", label:"Heart Rate Zones"}
];

const GOAL_OPTIONS = [
  {label:"Maintain weight", delta:0},
  {label:"Mild loss — 0.25 kg/week", delta:-275},
  {label:"Loss — 0.5 kg/week", delta:-550},
  {label:"Extreme loss — 1 kg/week", delta:-1100},
  {label:"Mild gain — 0.25 kg/week", delta:275},
  {label:"Gain — 0.5 kg/week", delta:550},
  {label:"Extreme gain — 1 kg/week", delta:1100}
];

function calcMacros(tdee){
  // Standard splits used by calculator.net-style tools
  return {
    carbs:   { lo: tdee*0.40/4, hi: tdee*0.65/4 },   // 40-65% of kcal, 4 kcal/g
    protein: { lo: tdee*0.10/4, hi: tdee*0.35/4 },   // 10-35% of kcal
    fat:     { lo: tdee*0.20/9, hi: tdee*0.35/9 },   // 20-35% of kcal, 9 kcal/g
    satFatMax: tdee*0.10/9                            // <10% kcal from saturated fat
  };
}

function calcBodyType(bust, waist, highHip, hip){
  // calculator.net-style shape classification
  const whr = hip>0 ? (waist/hip) : 0;
  let shape = "Undefined";
  if(bust>0 && waist>0 && hip>0){
    if(Math.abs(bust-hip) <= bust*0.05 && waist < Math.min(bust,hip)*0.75) shape = "Hourglass";
    else if(hip > bust*1.05 && waist < hip*0.8) shape = "Pear / Triangle";
    else if(bust > hip*1.05 && waist < bust*0.8) shape = "Inverted Triangle";
    else if(Math.abs(bust-hip) <= bust*0.05 && waist >= Math.min(bust,hip)*0.75) shape = "Rectangle / Banana";
    else if(waist >= Math.min(bust,hip)) shape = "Apple / Round";
    else shape = "Rectangle / Banana";
  }
  return { shape, whr };
}

function calcInputRow(id, label, val, unit){
  return `<div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);">${label}</label>
    <div style="display:flex;align-items:center;background:var(--surface-alt);border-radius:8px;padding:8px;margin-top:4px;">
      <input type="number" id="${id}" value="${val}" style="flex:1;background:none;color:var(--text);font-family:'SF Mono',monospace;font-weight:700;font-size:13px;">
      ${unit?`<span style="font-size:11px;color:var(--muted);">${unit}</span>`:""}
    </div></div>`;
}

function genderToggle(id, current){
  return `<div>
    <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);">Gender</label>
    <div style="display:flex;gap:6px;margin-top:4px;">
      <button class="cat-chip ${current==='male'?'active':''}" data-gender-toggle="${id}|male" style="flex:1;text-align:center;">Male</button>
      <button class="cat-chip ${current==='female'?'active':''}" data-gender-toggle="${id}|female" style="flex:1;text-align:center;">Female</button>
    </div></div>`;
}

function renderCalculators(){
  const c = state.calc;
  const active = c.activeCalc;
  let fields = "", result = "";

  if(active==="bmr"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-age","Age",c.age,"")}
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-weight","Weight",c.weight,"kg")}
    </div>`;
    if(c.result && c.result.type==="bmr"){
      result = `<div class="info-box" style="text-align:center;padding:16px;margin-top:10px;">
        <div class="stat-label">Basal Metabolic Rate</div>
        <div class="mono" style="font-weight:900;font-size:28px;color:var(--accent);">${Math.round(c.result.bmr)}<span style="font-size:13px;color:var(--muted);margin-left:4px;">kcal/day</span></div>
      </div>`;
    }
  }

  if(active==="calorie"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-age","Age",c.age,"")}
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-weight","Weight",c.weight,"kg")}
    </div>
    <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin:10px 0 4px;">Activity Level</label>
    <select class="select-input" id="calc-activity">
      ${ACTIVITY_MULTIPLIERS.map(a=>`<option value="${a.mult}" ${c.activityMultiplier===a.mult?'selected':''}>${a.label}</option>`).join("")}
    </select>
    <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin:10px 0 4px;">Your Goal</label>
    <select class="select-input" id="calc-goal">
      ${GOAL_OPTIONS.map(g=>`<option value="${g.delta}" ${c.goalDelta===g.delta?'selected':''}>${g.label}</option>`).join("")}
    </select>`;
    if(c.result && c.result.type==="calorie"){
      const goalKcal = c.result.tdee + c.result.goalDelta;
      result = `<div class="grid2" style="margin-top:10px;">
        <div class="stat-card"><div class="stat-label">Maintenance (TDEE)</div><div class="stat-value" style="color:var(--steel);">${Math.round(c.result.tdee)}<span class="stat-unit">kcal</span></div></div>
        <div class="stat-card"><div class="stat-label">Goal Calories</div><div class="stat-value" style="color:var(--accent);">${Math.round(goalKcal)}<span class="stat-unit">kcal</span></div></div>
      </div>
      <div class="info-box" style="text-align:center;padding:12px;margin-top:8px;">
        <button class="btn btn-steel" data-action="use-maintenance" style="padding:8px 16px;">Use as Maintenance Calories</button>
      </div>`;
    }
  }

  if(active==="protein"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-age","Age",c.age,"")}
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-weight","Weight",c.weight,"kg")}
    </div>
    <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin:10px 0 4px;">Activity Level</label>
    <select class="select-input" id="calc-activity">
      ${ACTIVITY_MULTIPLIERS.map(a=>`<option value="${a.mult}" ${c.activityMultiplier===a.mult?'selected':''}>${a.label}</option>`).join("")}
    </select>`;
    if(c.result && c.result.type==="protein"){
      result = `<div class="grid2" style="margin-top:10px;">
        <div class="stat-card"><div class="stat-label">RDA Minimum (0.8g/kg)</div><div class="stat-value" style="color:var(--steel);">${c.result.rda.toFixed(0)}<span class="stat-unit">g/day</span></div></div>
        <div class="stat-card"><div class="stat-label">% of Calories (10-35%)</div><div class="stat-value" style="color:var(--steel);">${Math.round(c.result.pctLo)}–${Math.round(c.result.pctHi)}<span class="stat-unit">g</span></div></div>
        <div class="stat-card" style="grid-column:1/-1;"><div class="stat-label">Training / Muscle Building (1.6-2.2g/kg)</div><div class="stat-value" style="color:var(--accent);">${c.result.trainLo.toFixed(0)}–${c.result.trainHi.toFixed(0)}<span class="stat-unit">g/day</span></div></div>
      </div>
      <div class="info-box" style="margin-top:10px;font-size:12px;">For your Hyrox training + fat loss goal, the training range is the one to aim for.</div>`;
    }
  }

  if(active==="carbs"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-age","Age",c.age,"")}
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-weight","Weight",c.weight,"kg")}
    </div>
    <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin:10px 0 4px;">Activity Level</label>
    <select class="select-input" id="calc-activity">
      ${ACTIVITY_MULTIPLIERS.map(a=>`<option value="${a.mult}" ${c.activityMultiplier===a.mult?'selected':''}>${a.label}</option>`).join("")}
    </select>`;
    if(c.result && c.result.type==="carbs"){
      result = `<div class="info-box" style="text-align:center;padding:16px;margin-top:10px;">
        <div class="stat-label">Daily Carbohydrates (40–65% of ${Math.round(c.result.tdee)} kcal)</div>
        <div class="mono" style="font-weight:900;font-size:26px;color:var(--accent);">${Math.round(c.result.lo)}–${Math.round(c.result.hi)}<span style="font-size:13px;color:var(--muted);margin-left:4px;">g/day</span></div>
      </div>`;
    }
  }

  if(active==="fat"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-age","Age",c.age,"")}
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-weight","Weight",c.weight,"kg")}
    </div>
    <label style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin:10px 0 4px;">Activity Level</label>
    <select class="select-input" id="calc-activity">
      ${ACTIVITY_MULTIPLIERS.map(a=>`<option value="${a.mult}" ${c.activityMultiplier===a.mult?'selected':''}>${a.label}</option>`).join("")}
    </select>`;
    if(c.result && c.result.type==="fat"){
      result = `<div class="grid2" style="margin-top:10px;">
        <div class="stat-card"><div class="stat-label">Total Fat (20-35%)</div><div class="stat-value" style="color:var(--accent);">${Math.round(c.result.lo)}–${Math.round(c.result.hi)}<span class="stat-unit">g/day</span></div></div>
        <div class="stat-card"><div class="stat-label">Saturated Fat Max (<10%)</div><div class="stat-value" style="color:var(--steel);">${Math.round(c.result.satMax)}<span class="stat-unit">g/day</span></div></div>
      </div>
      <div class="info-box" style="margin-top:10px;font-size:12px;">Based on ${Math.round(c.result.tdee)} kcal/day. Keeping saturated fat under the max supports heart health.</div>`;
    }
  }

  if(active==="bodytype"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-bust","Bust",c.bust,"cm")}
      ${calcInputRow("calc-bwaist","Waist",c.bwaist,"cm")}
      ${calcInputRow("calc-highhip","High Hip",c.highHip,"cm")}
      ${calcInputRow("calc-bhip","Hip",c.bhip,"cm")}
    </div>`;
    if(c.result && c.result.type==="bodytype"){
      result = `<div class="info-box" style="text-align:center;padding:16px;margin-top:10px;">
        <div class="stat-label">Body Shape</div>
        <div style="font-weight:900;font-size:24px;color:var(--accent);margin:4px 0;">${c.result.shape}</div>
        <div class="stat-label" style="margin-top:8px;">Waist-Hip Ratio</div>
        <div class="mono" style="font-weight:900;font-size:20px;color:var(--steel);">${c.result.whr.toFixed(2)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;">WHR is a better health indicator than shape category.</div>
      </div>`;
    }
  }

  if(active==="lbm"){
    fields = `<div class="grid2">
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-weight","Weight",c.weight,"kg")}
    </div>`;
    if(c.result && c.result.type==="lbm"){
      result = `<div class="grid2" style="margin-top:10px;">
        <div class="stat-card"><div class="stat-label">Boer Formula</div><div class="stat-value" style="color:var(--accent);">${c.result.boer.toFixed(1)}<span class="stat-unit">kg</span></div></div>
        <div class="stat-card"><div class="stat-label">Hume Formula</div><div class="stat-value" style="color:var(--steel);">${c.result.hume.toFixed(1)}<span class="stat-unit">kg</span></div></div>
      </div>
      <div class="info-box" style="margin-top:10px;font-size:12px;">Two different formulas, shown for comparison — both are estimates, not measurements.</div>`;
    }
  }

  if(active==="ideal"){
    fields = `<div class="grid2">
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
    </div>`;
    if(c.result && c.result.type==="ideal"){
      const r = c.result;
      result = `<div class="grid2" style="margin-top:10px;">
        <div class="stat-card"><div class="stat-label">Robinson</div><div class="stat-value">${r.Robinson.toFixed(1)}<span class="stat-unit">kg</span></div></div>
        <div class="stat-card"><div class="stat-label">Miller</div><div class="stat-value">${r.Miller.toFixed(1)}<span class="stat-unit">kg</span></div></div>
        <div class="stat-card"><div class="stat-label">Devine</div><div class="stat-value">${r.Devine.toFixed(1)}<span class="stat-unit">kg</span></div></div>
        <div class="stat-card"><div class="stat-label">Hamwi</div><div class="stat-value">${r.Hamwi.toFixed(1)}<span class="stat-unit">kg</span></div></div>
      </div>`;
    }
  }

  if(active==="bodyfat"){
    fields = `<div class="grid2">
      ${genderToggle("calc-gender", c.gender)}
      ${calcInputRow("calc-height","Height",c.height,"cm")}
      ${calcInputRow("calc-neck","Neck",c.neck,"cm")}
      ${calcInputRow("calc-waist","Waist",c.waist,"cm")}
      ${c.gender==="female" ? calcInputRow("calc-hip","Hip",c.hip,"cm") : ""}
    </div>`;
    if(c.result && c.result.type==="bodyfat"){
      result = `<div class="info-box" style="text-align:center;padding:16px;margin-top:10px;">
        <div class="stat-label">Estimated Body Fat (US Navy method)</div>
        <div class="mono" style="font-weight:900;font-size:28px;color:var(--accent);">${c.result.bf.toFixed(1)}<span style="font-size:13px;color:var(--muted);margin-left:4px;">%</span></div>
      </div>`;
    }
  }

  if(active==="hr"){
    fields = `<div class="grid2">
      ${calcInputRow("calc-age","Age",c.age,"")}
      ${calcInputRow("calc-resting","Resting HR (optional)",c.restingHR,"bpm")}
    </div>`;
    if(c.result && c.result.type==="hr"){
      result = `<div class="info-box" style="padding:14px;margin-top:10px;">
        <div class="row-between" style="margin-bottom:10px;">
          <span class="stat-label">Max Heart Rate</span>
          <span class="mono" style="font-weight:900;color:var(--accent);">${c.result.maxHR} bpm</span>
        </div>
        ${c.result.rows.map(z=>`<div class="row-between" style="padding:6px 0;border-top:1px solid var(--border);">
          <span style="font-size:12px;color:var(--muted);">${z.label}</span>
          <span class="mono" style="font-size:13px;color:var(--steel);">${z.lo}–${z.hi} bpm</span>
        </div>`).join("")}
        ${c.result.useKarvonen ? `<div style="font-size:11px;color:var(--muted);margin-top:8px;">Calculated using the Karvonen formula (accounts for resting HR).</div>` : ""}
      </div>`;
    }
  }

  return `
    <select class="select-input" id="calc-picker">
      ${CALCULATORS.map(cc=>`<option value="${cc.key}" ${active===cc.key?'selected':''}>${cc.label}</option>`).join("")}
    </select>
    ${fields}
    <button class="btn btn-accent btn-block" data-action="run-calculator" style="margin-top:10px;">Calculate</button>
    ${result}
  `;
}

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

    <div class="eyebrow-label">Calculators</div>
    <div class="info-box" style="padding:14px;">
      ${renderCalculators()}
    </div>
  `;
}

/* =========================================================
   NUTRITION TAB — auto calories eaten / burned / deficit
========================================================= */
const ACTIVITY_KCAL_PER_MIN = 8; // rough estimate for mixed strength/conditioning work

function todayStr(){ return new Date().toISOString().slice(0,10); }

function todayEaten(){
  return state.foodLog.filter(f=>f.date===todayStr()).reduce((a,f)=>a+Number(f.calories||0),0);
}
function todayActivityKcal(){
  return state.workoutLog
    .filter(s=>s.date===todayStr())
    .reduce((a,s)=>a + (s.durationMin||0)*ACTIVITY_KCAL_PER_MIN, 0);
}
function todayBurned(){
  return Math.round(state.nutrition.maintenance + todayActivityKcal());
}

function renderNutritionTab(){
  const {bodyweight, maintenance, deficit} = state.nutrition;
  const target = maintenance - deficit;
  const proteinLow = Math.round(bodyweight*1.6);
  const proteinHigh = Math.round(bodyweight*2);
  const weeklyLoss = ((deficit*7)/7700).toFixed(2);

  const eaten = todayEaten();
  const burned = todayBurned();
  const netDeficit = burned - eaten;
  const activityKcal = Math.round(todayActivityKcal());
  const todaysFood = state.foodLog.filter(f=>f.date===todayStr());

  return `
    <div class="eyebrow-label" style="margin-top:4px;">Today — Auto-Calculated</div>
    <div class="grid2" style="margin-bottom:8px;">
      <div class="stat-card"><div class="stat-label">Calories Eaten</div><div class="stat-value" style="color:var(--text);">${Math.round(eaten)}<span class="stat-unit">kcal</span></div></div>
      <div class="stat-card"><div class="stat-label">Calories Burned</div><div class="stat-value" style="color:var(--steel);">${burned}<span class="stat-unit">kcal</span></div></div>
    </div>
    <div class="info-box" style="text-align:center;padding:16px;margin-bottom:8px;background:${netDeficit>=0?'rgba(62,207,142,.08)':'rgba(255,90,31,.08)'};">
      <div class="stat-label">${netDeficit>=0?'Deficit Created':'Surplus (over target)'}</div>
      <div class="mono" style="font-weight:900;font-size:28px;color:${netDeficit>=0?'var(--mint)':'var(--accent)'};margin-top:2px;">${netDeficit>=0?'':'+'}${Math.abs(netDeficit)}<span style="font-size:14px;font-weight:700;color:var(--muted);margin-left:4px;">kcal</span></div>
    </div>
    <div class="info-box" style="font-size:12px;margin-bottom:16px;">Burned = maintenance (${maintenance} kcal resting) + ~${activityKcal} kcal from today's logged workout time. This is an estimate, not a metabolic measurement.</div>

    <div class="eyebrow-label">Log Food</div>
    <div class="info-box" style="padding:12px;margin-bottom:8px;">
      <div style="display:flex;gap:6px;">
        <input type="text" id="food-name" placeholder="What did you eat?" style="flex:1;background:var(--surface-alt);border-radius:8px;padding:9px;font-size:13px;color:var(--text);">
        <input type="number" id="food-cal" placeholder="kcal" style="width:70px;background:var(--surface-alt);border-radius:8px;padding:9px;font-size:13px;color:var(--accent);text-align:center;">
      </div>
      <button class="btn btn-accent btn-block" data-action="log-food" style="margin-top:8px;">Add</button>
    </div>
    ${todaysFood.length===0?`<div class="empty-note" style="padding:12px 0;">No food logged today.</div>`:
      todaysFood.map(f=>`<div class="history-row">
        <span style="font-size:13px;font-weight:600;">${f.name}</span>
        <span class="mono" style="font-size:13px;color:var(--accent);">${f.calories} kcal</span>
        <button class="del" data-del-food="${f.id}">${svg('x',12)}</button>
      </div>`).join("")}

    <div class="eyebrow-label">Daily Targets</div>
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
   PROGRESS TAB — stats, radar, weekly activity, calendar/streak
========================================================= */

/* --- data helpers --- */
function activityDates(){
  // Set of "YYYY-MM-DD" strings with any logged activity (plan completions or freestyle sessions)
  const dates = new Set();
  Object.values(state.completed).forEach(ts=> dates.add(new Date(ts).toISOString().slice(0,10)));
  state.workoutLog.forEach(s=> dates.add(s.date));
  return dates;
}

function computeStreak(){
  const dates = activityDates();
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0,0,0,0);
  // if today has no activity yet, start counting from yesterday (still an active streak)
  if(!dates.has(cursor.toISOString().slice(0,10))) cursor.setDate(cursor.getDate()-1);
  while(dates.has(cursor.toISOString().slice(0,10))){
    streak++;
    cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}

function computeMuscleDistribution(daysBack, offsetDays){
  // offsetDays=0 => most recent `daysBack` days. offsetDays=daysBack => the period before that.
  const now = Date.now();
  const end = now - offsetDays*86400000;
  const start = end - daysBack*86400000;
  const counts = {}; RADAR_MUSCLES.forEach(m=> counts[m]=0);

  Object.entries(state.completed).forEach(([key, ts])=>{
    if(ts < start || ts > end) return;
    const [wk,,exName] = key.split("|");
    const broad = FINE_TO_BROAD[getMuscle(exName)];
    if(broad){
      const presc = getPlanPresc(Number(wk), key.split("|")[1], exName);
      counts[broad] += parseSets(presc);
    }
  });
  state.workoutLog.forEach(s=>{
    const t = new Date(s.date).getTime();
    if(t < start || t > end) return;
    s.exercises.forEach(ex=>{
      const broad = FINE_TO_BROAD[getMuscle(ex.name)];
      if(broad) counts[broad] += ex.sets.length;
    });
  });
  return counts;
}

// Fine-grained per-muscle set counts within [startTs, endTs), for the Body Distribution table
function computeMuscleDistributionFine(startTs, endTs){
  const counts = {}; BODY_MUSCLES.forEach(m=> counts[m]=0);
  Object.entries(state.completed).forEach(([key, ts])=>{
    if(ts < startTs || ts >= endTs) return;
    const [wk,day,exName] = key.split("|");
    const muscle = getMuscle(exName);
    if(counts.hasOwnProperty(muscle)){
      const presc = getPlanPresc(Number(wk), day, exName);
      counts[muscle] += parseSets(presc);
    }
  });
  state.workoutLog.forEach(s=>{
    const t = new Date(s.date).getTime();
    if(t < startTs || t >= endTs) return;
    s.exercises.forEach(ex=>{
      const muscle = getMuscle(ex.name);
      if(counts.hasOwnProperty(muscle)) counts[muscle] += ex.sets.length;
    });
  });
  return counts;
}

/* Monday-start week boundaries for a given offset (0 = current week, 1 = last week, ...) */
function weekRange(weekOffset){
  const now = new Date();
  const day = (now.getDay()+6)%7; // Mon=0
  const monday = new Date(now); monday.setHours(0,0,0,0); monday.setDate(now.getDate()-day-7*weekOffset);
  const sunday = new Date(monday); sunday.setDate(monday.getDate()+7);
  return { start: monday, end: sunday };
}

function renderBodyDistribution(weekOffset){
  const { start, end } = weekRange(weekOffset);
  const dates = activityDates();
  const todayStr0 = new Date().toISOString().slice(0,10);
  const dayLabels = ["M","T","W","T","F","S","S"];
  let strip = "";
  for(let i=0;i<7;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const dStr = d.toISOString().slice(0,10);
    const active = dates.has(dStr);
    const isToday = dStr===todayStr0;
    strip += `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
      <span style="font-size:10px;color:var(--muted);font-weight:700;">${dayLabels[i]}</span>
      <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:12px;font-weight:800;font-family:'SF Mono',monospace;
        background:${active?'var(--accent)':'transparent'};
        color:${active?'#151515':'var(--muted)'};
        ${isToday && !active?'box-shadow:inset 0 0 0 1.5px var(--steel);color:var(--steel);':''}">${d.getDate()}</div>
    </div>`;
  }
  const rangeLabel = `${start.toLocaleDateString('default',{day:'2-digit',month:'short'})} – ${new Date(end.getTime()-86400000).toLocaleDateString('default',{day:'2-digit',month:'short',year:'numeric'})}`;

  const counts = computeMuscleDistributionFine(start.getTime(), end.getTime());
  const totalSets = Object.values(counts).reduce((a,b)=>a+b,0);

  return `
    <div class="row-between" style="margin-bottom:12px;">
      <button class="btn btn-ghost" data-bodydist-nav="1" style="padding:6px 12px;">‹</button>
      <span class="mono" style="font-size:12px;font-weight:700;color:var(--text);">${rangeLabel}</span>
      <button class="btn btn-ghost" data-bodydist-nav="-1" style="padding:6px 12px;" ${weekOffset<=0?'disabled':''}>›</button>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:18px;">${strip}</div>
    <div style="display:flex;justify-content:space-between;padding:8px 2px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;">
      <span>Muscle</span><span>Sets</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 2px;border-bottom:1px solid var(--border);">
      <span style="font-weight:800;font-size:14px;">Total</span><span class="mono" style="font-weight:800;color:var(--accent);">${totalSets}</span>
    </div>
    ${BODY_MUSCLES.map(m=>`<div style="display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid var(--border);">
      <span style="font-size:13px;color:${counts[m]>0?'var(--text)':'var(--muted)'};">${m}</span>
      <span class="mono" style="font-size:13px;color:${counts[m]>0?'var(--steel)':'var(--muted)'};">${counts[m]}</span>
    </div>`).join("")}
  `;
}

function computeWeeklyActivity(weeks=8){
  const buckets = Array.from({length:weeks},(_,i)=>({duration:0, volume:0, sets:0}));
  const now = Date.now();
  state.workoutLog.forEach(s=>{
    const t = new Date(s.date).getTime();
    const idx = Math.floor((now - t) / (7*86400000));
    if(idx>=0 && idx<weeks){
      const b = buckets[weeks-1-idx];
      b.duration += s.durationMin || 0;
      b.volume += s.volume || 0;
      b.sets += s.exercises.reduce((a,ex)=>a+ex.sets.length,0);
    }
  });
  Object.values(state.completed).forEach((ts,i)=>{
    const idx = Math.floor((now - ts) / (7*86400000));
    if(idx>=0 && idx<weeks){
      buckets[weeks-1-idx].sets += 1; // rough count; plan sets already reflected via radar, this is activity volume proxy
    }
  });
  return buckets;
}

/* --- SVG radar chart --- */
function radarChart(current, previous){
  const size=260, cx=size/2, cy=size/2, r=90;
  const n = RADAR_MUSCLES.length;
  const maxVal = Math.max(4, ...Object.values(current), ...Object.values(previous));
  function pt(i,val){
    const angle = (Math.PI*2*i/n) - Math.PI/2;
    const dist = (val/maxVal)*r;
    return [cx+dist*Math.cos(angle), cy+dist*Math.sin(angle)];
  }
  function labelPt(i){
    const angle = (Math.PI*2*i/n) - Math.PI/2;
    return [cx+(r+26)*Math.cos(angle), cy+(r+22)*Math.sin(angle)];
  }
  function polygon(data,color,fillOpacity){
    const pts = RADAR_MUSCLES.map((m,i)=>pt(i,data[m]).join(",")).join(" ");
    return `<polygon points="${pts}" fill="${color}" fill-opacity="${fillOpacity}" stroke="${color}" stroke-width="2"/>`;
  }
  const rings = [0.33,0.66,1].map(f=>{
    const pts = RADAR_MUSCLES.map((m,i)=>pt(i,maxVal*f).join(",")).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="#33333d" stroke-width="1"/>`;
  }).join("");
  const spokes = RADAR_MUSCLES.map((m,i)=>{
    const [x,y] = pt(i,maxVal);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#33333d" stroke-width="1"/>`;
  }).join("");
  const labels = RADAR_MUSCLES.map((m,i)=>{
    const [x,y] = labelPt(i);
    return `<text x="${x}" y="${y}" fill="#8B8B94" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="middle">${m}</text>`;
  }).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${rings}${spokes}
    ${polygon(previous,"#8B8B94",0.12)}
    ${polygon(current,"#FF5A1F",0.28)}
    ${labels}
  </svg>`;
}

/* --- SVG weekly bar chart --- */
function weeklyBarChart(buckets, metric){
  const w=300, h=120, barW= w/buckets.length*0.55, gap = w/buckets.length;
  const vals = buckets.map(b=>b[metric]);
  const max = Math.max(1, ...vals);
  const bars = buckets.map((b,i)=>{
    const val = b[metric];
    const bh = (val/max)*(h-20);
    const x = i*gap + (gap-barW)/2;
    const y = h-bh;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3" fill="${i===buckets.length-1?'#FF5A1F':'#4FA8D8'}"/>`;
  }).join("");
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${bars}</svg>`;
}

/* --- calendar grid (Mon-Sun) for a given month --- */
function renderCalendarMonth(monthOffset){
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth()+monthOffset);
  const year = base.getFullYear(), month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay()+6)%7; // Mon=0
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const dates = activityDates();
  const monthName = base.toLocaleString('default',{month:'long', year:'numeric'});

  let cells = "";
  for(let i=0;i<startWeekday;i++) cells += `<div></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const active = dates.has(dateStr);
    const isToday = dateStr === new Date().toISOString().slice(0,10);
    cells += `<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:8px;
      font-size:12px;font-weight:700;font-family:'SF Mono',monospace;
      background:${active?'#FF5A1F':'transparent'};
      color:${active?'#151515':'var(--muted)'};
      ${isToday && !active ? 'box-shadow:inset 0 0 0 1.5px var(--steel);color:var(--steel);':''}">${d}</div>`;
  }
  return `
    <div class="row-between" style="margin-bottom:10px;">
      <button class="btn btn-ghost" data-cal-nav="-1" style="padding:6px 12px;">‹</button>
      <span style="font-weight:800;font-size:14px;">${monthName}</span>
      <button class="btn btn-ghost" data-cal-nav="1" style="padding:6px 12px;" ${monthOffset>=0?'disabled':''}>›</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:10px;color:var(--muted);font-weight:700;text-align:center;margin-bottom:6px;">
      <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">${cells}</div>
  `;
}

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
  const streak = computeStreak();
  const metric = state.chartMetric || "sets";
  const buckets = computeWeeklyActivity(8);
  const currentMuscles = computeMuscleDistribution(30,0);
  const prevMuscles = computeMuscleDistribution(30,30);
  const totalVolume = state.workoutLog.reduce((a,s)=>a+(s.volume||0),0);
  const totalSets = state.workoutLog.reduce((a,s)=>a+s.exercises.reduce((x,e)=>x+e.sets.length,0),0);

  return `
    <div class="eyebrow-label" style="margin-top:4px;">Overview</div>
    <div class="grid2" style="margin-bottom:16px;">
      <div class="stat-card"><div class="stat-label">Streak</div><div class="stat-value" style="color:var(--accent);">🔥 ${streak}<span class="stat-unit">days</span></div></div>
      <div class="stat-card"><div class="stat-label">Freestyle Sessions</div><div class="stat-value">${sessions}</div></div>
      <div class="stat-card"><div class="stat-label">Total Volume</div><div class="stat-value">${Math.round(totalVolume).toLocaleString()}<span class="stat-unit">kg</span></div></div>
      <div class="stat-card"><div class="stat-label">Total Sets Logged</div><div class="stat-value">${totalSets}</div></div>
    </div>

    <div class="eyebrow-label">Weekly Activity — Last 8 Weeks</div>
    <div class="info-box" style="padding:14px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        ${["sets","duration","volume"].map(m=>`<button class="cat-chip ${metric===m?'active':''}" data-metric="${m}">${m.charAt(0).toUpperCase()+m.slice(1)}</button>`).join("")}
      </div>
      ${weeklyBarChart(buckets, metric)}
    </div>

    <div class="eyebrow-label">Muscle Distribution — Last 30 Days</div>
    <div class="info-box" style="display:flex; flex-direction:column; align-items:center; padding:16px;">
      ${radarChart(currentMuscles, prevMuscles)}
      <div style="display:flex; gap:16px; margin-top:6px;">
        <span style="font-size:11px;color:var(--muted);"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:5px;"></span>Current</span>
        <span style="font-size:11px;color:var(--muted);"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--muted);margin-right:5px;"></span>Previous 30d</span>
      </div>
    </div>

    <div class="eyebrow-label">Body Distribution</div>
    <div class="info-box" style="padding:14px;">
      ${renderBodyDistribution(state.bodyDistWeekOffset||0)}
    </div>

    <div class="eyebrow-label">Calendar</div>
    <div class="info-box" style="padding:14px;">
      ${renderCalendarMonth(state.calendarMonthOffset||0)}
    </div>

    <div class="eyebrow-label">Phase 1 Completion</div>
    <div class="info-box" style="text-align:center;padding:20px;margin-bottom:16px;">
      <div class="mono" style="font-weight:900;font-size:36px;color:var(--accent);">${overall}%</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px;">${done} of ${total} plan sessions logged</div>
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
   SETTINGS TAB — export/import + workout settings
========================================================= */
const ALL_DATA_KEYS = ["hx_completed","hx_active_week","hx_nutrition","hx_bodylog","hx_custom_exercises",
  "hx_workout_log","hx_food_log","hx_routines","hx_calc","hx_settings","hx_rest_duration","hx_tab"];

function exportAllJSON(){
  const data = { app:"hyrox-prep", version:1, exportedAt:new Date().toISOString(), data:{} };
  ALL_DATA_KEYS.forEach(k=>{ const v = localStorage.getItem(k); if(v!==null) data.data[k]=v; });
  downloadFile("hyrox-prep-backup-"+todayStr()+".json", JSON.stringify(data,null,2), "application/json");
}

function csvEscape(s){ s = String(s==null?"":s); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }

function exportWorkoutsCSV(){
  const rows = [["date","exercise","muscle","set_number","weight_kg","reps","rpe","duration_min","session_volume_kg","notes"]];
  state.workoutLog.slice().reverse().forEach(s=>{
    s.exercises.forEach(ex=>{
      ex.sets.forEach((set,si)=>{
        rows.push([s.date, ex.name, getMuscle(ex.name), si+1, set.weight||"", set.reps||"", set.rpe||"", s.durationMin||"", s.volume?Math.round(s.volume):"", ex.notes||""]);
      });
    });
  });
  // plan completions as their own rows
  Object.entries(state.completed).forEach(([key,ts])=>{
    const [wk,day,exName] = key.split("|");
    rows.push([new Date(ts).toISOString().slice(0,10), exName+" (Plan "+wk+" "+day+")", getMuscle(exName), "", "", "", "", "", "", "plan check-off"]);
  });
  const csv = rows.map(r=>r.map(csvEscape).join(",")).join("\n");
  downloadFile("hyrox-workouts-"+todayStr()+".csv", csv, "text/csv");
}

function exportMeasurementsCSV(){
  const rows = [["date","weight_kg","sleep_hrs","hrv_ms","waist_cm","chest_cm","arms_cm","bodyfat_pct"]];
  state.bodylog.slice().reverse().forEach(e=>{
    rows.push([e.date, e.weight||"", e.sleep||"", e.hrv||"", e.waist||"", e.chest||"", e.arms||"", e.bodyfat||""]);
  });
  const csv = rows.map(r=>r.map(csvEscape).join(",")).join("\n");
  downloadFile("hyrox-measurements-"+todayStr()+".csv", csv, "text/csv");
}

function downloadFile(filename, content, mime){
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

function importAllJSON(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(!parsed || parsed.app!=="hyrox-prep" || !parsed.data){
        alert("This doesn't look like a Hyrox Prep backup file.");
        return;
      }
      if(!confirm("Import will REPLACE all current app data with the backup. Continue?")) return;
      Object.entries(parsed.data).forEach(([k,v])=>{
        if(ALL_DATA_KEYS.includes(k)) localStorage.setItem(k, v);
      });
      location.reload();
    }catch(e){
      alert("Could not read that file — is it a valid backup JSON?");
    }
  };
  reader.readAsText(file);
}

/* Plate calculator: greedy plates-per-side for a target barbell weight */
const PLATE_SIZES = [25,20,15,10,5,2.5,1.25];
function calcPlates(target, barWeight){
  if(!target || target <= barWeight) return { perSide:[], remainder:0 };
  let perSideWeight = (target - barWeight)/2;
  const perSide = [];
  let rem = perSideWeight;
  PLATE_SIZES.forEach(p=>{
    const count = Math.floor(rem/p + 1e-9);
    if(count>0){ perSide.push({plate:p, count}); rem = +(rem - count*p).toFixed(3); }
  });
  return { perSide, remainder: rem };
}

function settingToggle(key, label, desc){
  const on = !!state.settings[key];
  return `<div style="padding:14px 0;border-bottom:1px solid var(--border);">
    <div class="row-between">
      <span style="font-weight:700;font-size:15px;">${label}</span>
      <button data-setting-toggle="${key}" style="width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;background:${on?'var(--steel)':'var(--surface-alt)'};transition:background .15s;">
        <span style="position:absolute;top:3px;${on?'right:3px':'left:3px'};width:20px;height:20px;border-radius:50%;background:${on?'#fff':'#6a6a74'};"></span>
      </button>
    </div>
    ${desc?`<div style="font-size:12px;color:var(--muted);margin-top:4px;max-width:85%;">${desc}</div>`:""}
  </div>`;
}

function renderSettingsTab(){
  const s = state.settings;
  return `
    <div class="eyebrow-label" style="margin-top:4px;">Export Data</div>
    <div class="info-box" style="padding:14px;">
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Export your entire workout and measurement history. The JSON backup can be imported back; CSVs are for spreadsheets.</div>
      <button class="btn btn-accent btn-block" data-action="export-json" style="margin-bottom:8px;">Full Backup (JSON)</button>
      <button class="btn btn-steel btn-block" data-action="export-workouts-csv" style="margin-bottom:8px;">Export Workouts (CSV)</button>
      <button class="btn btn-steel btn-block" data-action="export-measurements-csv">Export Measurements (CSV)</button>
    </div>

    <div class="eyebrow-label">Import Data</div>
    <div class="info-box" style="padding:14px;">
      <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Restore from a Full Backup (JSON) file. This replaces all current data in the app.</div>
      <input type="file" id="import-file" accept=".json,application/json" style="display:none;">
      <button class="btn btn-ghost btn-block" data-action="import-json">Choose Backup File…</button>
    </div>

    <div class="eyebrow-label">Workout Settings</div>
    <div class="info-box" style="padding:0 14px;">
      ${settingToggle("sounds","Sounds","Beep when the rest timer finishes.")}
      ${settingToggle("vibration","Vibration","Vibrate when the rest timer finishes.")}
      ${settingToggle("autoStartRest","Auto-Start Rest Timer","Checking off a set automatically starts that exercise's rest timer.")}
      ${settingToggle("keepAwake","Keep Awake During Workout","Prevents your phone screen from sleeping while a session is in progress.")}
      ${settingToggle("plateCalc","Plate Calculator","Shows a plates button next to weight inputs for barbell exercises.")}
      ${settingToggle("rpeTracking","RPE Tracking","Show the RPE column in the workout logger.")}
      <div style="padding:14px 0;">
        <div class="row-between">
          <span style="font-weight:700;font-size:15px;">Default Rest Timer</span>
          <select class="select-input" id="default-rest-select" style="width:auto;margin:0;padding:6px 10px;">
            ${[0,30,60,90,120,150,180,240].map(v=>`<option value="${v}" ${s.defaultRest===v?'selected':''}>${v===0?'Off':v+'s'}</option>`).join("")}
          </select>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">New exercises added to a session start with this rest duration.</div>
      </div>
    </div>

    <div class="eyebrow-label">Danger Zone</div>
    <div class="info-box" style="padding:14px;">
      <button class="btn btn-ghost btn-block" data-action="reset-all" style="color:#ff6b6b;">Reset All App Data</button>
    </div>
  `;
}

/* =========================================================
   EVENT HANDLERS
========================================================= */
function attachHandlers(){
  document.querySelectorAll("[data-nav]").forEach(el=>{
    el.addEventListener("click", ()=>{ state.tab = el.dataset.nav; render(); });
  });

  // Settings
  document.querySelectorAll("[data-setting-toggle]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const key = el.dataset.settingToggle;
      state.settings[key] = !state.settings[key];
      if(key==="keepAwake") applyWakeLock();
      render();
    });
  });
  const restSelect = document.getElementById("default-rest-select");
  if(restSelect) restSelect.addEventListener("change", ()=>{
    state.settings.defaultRest = Number(restSelect.value);
    persist();
  });
  const expJsonBtn = document.querySelector('[data-action="export-json"]');
  if(expJsonBtn) expJsonBtn.addEventListener("click", exportAllJSON);
  const expWkBtn = document.querySelector('[data-action="export-workouts-csv"]');
  if(expWkBtn) expWkBtn.addEventListener("click", exportWorkoutsCSV);
  const expMeasBtn = document.querySelector('[data-action="export-measurements-csv"]');
  if(expMeasBtn) expMeasBtn.addEventListener("click", exportMeasurementsCSV);
  const impBtn = document.querySelector('[data-action="import-json"]');
  const impFile = document.getElementById("import-file");
  if(impBtn && impFile){
    impBtn.addEventListener("click", ()=> impFile.click());
    impFile.addEventListener("change", ()=>{ if(impFile.files.length) importAllJSON(impFile.files[0]); });
  }
  const resetBtn = document.querySelector('[data-action="reset-all"]');
  if(resetBtn) resetBtn.addEventListener("click", ()=>{
    if(confirm("This permanently deletes ALL app data (workouts, logs, routines, settings). Are you sure?")){
      if(confirm("Last check — this cannot be undone. Delete everything?")){
        ALL_DATA_KEYS.forEach(k=>localStorage.removeItem(k));
        location.reload();
      }
    }
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
      if(state.completed[key]) delete state.completed[key];
      else state.completed[key] = Date.now();
      render();
    });
  });

  // Workout tab
  const startBtn = document.querySelector('[data-action="start-session"]');
  if(startBtn) startBtn.addEventListener("click", ()=>{
    state.session = { startedAt: Date.now(), exercises: [] };
    applyWakeLock();
    render();
  });

  // Routines
  const toggleBuilderBtn = document.querySelector('[data-action="toggle-routine-builder"]');
  if(toggleBuilderBtn) toggleBuilderBtn.addEventListener("click", ()=>{
    state.routineBuilder = state.routineBuilder ? null : { name:"", exercises:[] };
    render();
  });
  const addBuilderExBtn = document.querySelector('[data-action="add-builder-exercise"]');
  if(addBuilderExBtn) addBuilderExBtn.addEventListener("click", ()=>{
    const nameEl = document.getElementById("routine-name");
    if(nameEl) state.routineBuilder.name = nameEl.value;
    const picker = document.getElementById("routine-ex-picker");
    const setsEl = document.getElementById("routine-ex-sets");
    if(picker && picker.value){
      state.routineBuilder.exercises.push({ name: picker.value, sets: Math.max(1, Number(setsEl.value)||3) });
      render();
    }
  });
  document.querySelectorAll("[data-remove-builder-ex]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const nameEl = document.getElementById("routine-name");
      if(nameEl) state.routineBuilder.name = nameEl.value;
      state.routineBuilder.exercises.splice(Number(el.dataset.removeBuilderEx),1);
      render();
    });
  });
  const saveRoutineBtn = document.querySelector('[data-action="save-routine"]');
  if(saveRoutineBtn) saveRoutineBtn.addEventListener("click", ()=>{
    const nameEl = document.getElementById("routine-name");
    const name = nameEl ? nameEl.value.trim() : "";
    if(!name || !state.routineBuilder.exercises.length) return;
    state.routines.unshift({ id: Date.now(), name, exercises: state.routineBuilder.exercises });
    state.routineBuilder = null;
    render();
  });
  document.querySelectorAll("[data-del-routine]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.routines = state.routines.filter(r=>r.id !== Number(el.dataset.delRoutine));
      render();
    });
  });
  document.querySelectorAll("[data-start-routine]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const routine = state.routines.find(r=>r.id === Number(el.dataset.startRoutine));
      if(!routine) return;
      state.session = {
        startedAt: Date.now(),
        exercises: routine.exercises.map(e=>({
          name: e.name, notes:"", restDuration:state.settings.defaultRest,
          sets: Array.from({length:e.sets}, ()=>({weight:"",reps:"",rpe:"",done:false}))
        }))
      };
      render();
    });
  });
  const finishBtn = document.querySelector('[data-action="finish-session"]');
  if(finishBtn) finishBtn.addEventListener("click", ()=>{
    if(state.session.exercises.length){
      const finishedAt = Date.now();
      const durationMin = Math.max(1, Math.round((finishedAt - state.session.startedAt)/60000));
      let volume = 0;
      state.session.exercises.forEach(ex=> ex.sets.forEach(s=>{
        const w = parseFloat(s.weight); const r = parseFloat(s.reps);
        if(!isNaN(w) && !isNaN(r)) volume += w*r;
      }));
      state.workoutLog.unshift({
        id: Date.now(),
        date: new Date().toISOString().slice(0,10),
        startedAt: state.session.startedAt,
        finishedAt, durationMin, volume,
        exercises: state.session.exercises
      });
    }
    state.session = null;
    applyWakeLock();
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
      state.session.exercises.push({ name: picker.value, notes:"", restDuration:state.settings.defaultRest,
        sets: [{ weight:"", reps:"", rpe:"", done:false }] });
      render();
    }
  });
  document.querySelectorAll("[data-del-exercise]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.session.exercises.splice(Number(el.dataset.delExercise),1);
      render();
    });
  });
  document.querySelectorAll("[data-notes-exercise]").forEach(el=>{
    el.addEventListener("change", ()=>{
      state.session.exercises[Number(el.dataset.notesExercise)].notes = el.value;
      persist();
    });
  });
  document.querySelectorAll("[data-rest-toggle]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const ex = state.session.exercises[Number(el.dataset.restToggle)];
      const idx = REST_OPTIONS.indexOf(ex.restDuration || 0);
      ex.restDuration = REST_OPTIONS[(idx+1) % REST_OPTIONS.length];
      render();
    });
  });
  document.querySelectorAll("[data-plate-calc]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const exi = el.dataset.plateCalc;
      state.plateCalcOpen = state.plateCalcOpen===exi ? null : exi;
      render();
    });
  });
  const runPlateBtn = document.querySelector('[data-action="run-plate-calc"]');
  if(runPlateBtn) runPlateBtn.addEventListener("click", ()=>{
    state.plateTarget = document.getElementById("plate-target").value;
    state.plateBar = document.getElementById("plate-bar").value;
    render();
  });
  document.querySelectorAll("[data-add-set]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const ex = state.session.exercises[Number(el.dataset.addSet)];
      const last = ex.sets[ex.sets.length-1];
      ex.sets.push({ weight: last?last.weight:"", reps: last?last.reps:"", rpe:"", done:false });
      render();
    });
  });
  document.querySelectorAll("[data-set-field]").forEach(el=>{
    el.addEventListener("change", ()=>{
      const [exi,si,field] = el.dataset.setField.split("|");
      state.session.exercises[Number(exi)].sets[Number(si)][field] = el.value;
      persist();
    });
  });
  document.querySelectorAll("[data-rpe]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const [exi,si] = el.dataset.rpe.split("|").map(Number);
      const set = state.session.exercises[exi].sets[si];
      const idx = RPE_OPTIONS.indexOf(set.rpe || "–");
      set.rpe = RPE_OPTIONS[(idx+1) % RPE_OPTIONS.length];
      if(set.rpe === "–") set.rpe = "";
      render();
    });
  });
  document.querySelectorAll("[data-set-done]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const [exi,si] = el.dataset.setDone.split("|").map(Number);
      const ex = state.session.exercises[exi];
      const set = ex.sets[si];
      set.done = !set.done;
      render();
      if(set.done && ex.restDuration>0 && state.settings.autoStartRest) startTimer(ex.restDuration);
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
    const muscle = document.getElementById("custom-muscle").value;
    const presc = document.getElementById("custom-presc").value.trim() || "—";
    if(!name) return;
    state.customExercises.push({ name, cat, presc, unit:"reps", muscle });
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

  // Calculators
  const calcPicker = document.getElementById("calc-picker");
  if(calcPicker) calcPicker.addEventListener("change", ()=>{
    state.calc.activeCalc = calcPicker.value;
    state.calc.result = null;
    render();
  });
  document.querySelectorAll("[data-gender-toggle]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const [, val] = el.dataset.genderToggle.split("|");
      state.calc.gender = val;
      render();
    });
  });
  const runCalcBtn = document.querySelector('[data-action="run-calculator"]');
  if(runCalcBtn) runCalcBtn.addEventListener("click", ()=>{
    const c = state.calc;
    const readNum = (id, fallback)=>{ const el=document.getElementById(id); return el ? (Number(el.value)||fallback) : fallback; };
    c.age = readNum("calc-age", c.age);
    c.height = readNum("calc-height", c.height);
    c.weight = readNum("calc-weight", c.weight);
    c.neck = readNum("calc-neck", c.neck);
    c.waist = readNum("calc-waist", c.waist);
    c.hip = readNum("calc-hip", c.hip);
    c.restingHR = readNum("calc-resting", 0);
    c.bust = readNum("calc-bust", c.bust);
    c.bwaist = readNum("calc-bwaist", c.bwaist);
    c.highHip = readNum("calc-highhip", c.highHip);
    c.bhip = readNum("calc-bhip", c.bhip);
    const activityEl = document.getElementById("calc-activity");
    if(activityEl) c.activityMultiplier = Number(activityEl.value);
    const goalEl = document.getElementById("calc-goal");
    if(goalEl) c.goalDelta = Number(goalEl.value);

    if(c.activeCalc==="bmr"){
      const bmr = calcBMR(c.age, c.gender, c.height, c.weight);
      c.result = { type:"bmr", bmr };
    } else if(c.activeCalc==="calorie"){
      const bmr = calcBMR(c.age, c.gender, c.height, c.weight);
      c.result = { type:"calorie", tdee: bmr*c.activityMultiplier, goalDelta: c.goalDelta };
    } else if(c.activeCalc==="protein"){
      const tdee = calcBMR(c.age, c.gender, c.height, c.weight)*c.activityMultiplier;
      const m = calcMacros(tdee);
      c.result = { type:"protein", rda: c.weight*0.8, pctLo: m.protein.lo, pctHi: m.protein.hi,
        trainLo: c.weight*1.6, trainHi: c.weight*2.2 };
    } else if(c.activeCalc==="carbs"){
      const tdee = calcBMR(c.age, c.gender, c.height, c.weight)*c.activityMultiplier;
      const m = calcMacros(tdee);
      c.result = { type:"carbs", tdee, lo: m.carbs.lo, hi: m.carbs.hi };
    } else if(c.activeCalc==="fat"){
      const tdee = calcBMR(c.age, c.gender, c.height, c.weight)*c.activityMultiplier;
      const m = calcMacros(tdee);
      c.result = { type:"fat", tdee, lo: m.fat.lo, hi: m.fat.hi, satMax: m.satFatMax };
    } else if(c.activeCalc==="bodytype"){
      c.result = { type:"bodytype", ...calcBodyType(c.bust, c.bwaist, c.highHip, c.bhip) };
    } else if(c.activeCalc==="lbm"){
      c.result = { type:"lbm", ...calcLBM(c.gender, c.height, c.weight) };
    } else if(c.activeCalc==="ideal"){
      c.result = { type:"ideal", ...calcIdealWeight(c.gender, c.height) };
    } else if(c.activeCalc==="bodyfat"){
      c.result = { type:"bodyfat", bf: calcBodyFatNavy(c.gender, c.height, c.neck, c.waist, c.hip) };
    } else if(c.activeCalc==="hr"){
      c.result = { type:"hr", ...calcHeartRateZones(c.age, c.restingHR) };
    }
    render();
  });
  const useMaintBtn = document.querySelector('[data-action="use-maintenance"]');
  if(useMaintBtn) useMaintBtn.addEventListener("click", ()=>{
    if(state.calc.result && state.calc.result.type==="calorie"){
      state.nutrition.maintenance = Math.round(state.calc.result.tdee);
      render();
    }
  });

  // Progress tab
  document.querySelectorAll("[data-metric]").forEach(el=>{
    el.addEventListener("click", ()=>{ state.chartMetric = el.dataset.metric; render(); });
  });
  document.querySelectorAll("[data-cal-nav]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const delta = Number(el.dataset.calNav);
      const next = (state.calendarMonthOffset||0) + delta;
      if(next<=0) state.calendarMonthOffset = next;
      render();
    });
  });
  document.querySelectorAll("[data-bodydist-nav]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const delta = Number(el.dataset.bodydistNav);
      const next = (state.bodyDistWeekOffset||0) + delta;
      if(next>=0) state.bodyDistWeekOffset = next;
      render();
    });
  });

  // Nutrition tab — food log
  const logFoodBtn = document.querySelector('[data-action="log-food"]');
  if(logFoodBtn) logFoodBtn.addEventListener("click", ()=>{
    const nameEl = document.getElementById("food-name");
    const calEl = document.getElementById("food-cal");
    const name = nameEl.value.trim();
    const cal = Number(calEl.value);
    if(!name || !cal) return;
    state.foodLog.unshift({ id: Date.now(), date: todayStr(), name, calories: cal });
    render();
  });
  document.querySelectorAll("[data-del-food]").forEach(el=>{
    el.addEventListener("click", ()=>{
      state.foodLog = state.foodLog.filter(f=>f.id !== Number(el.dataset.delFood));
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
