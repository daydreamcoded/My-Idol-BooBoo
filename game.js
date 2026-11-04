(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const SAVE_KEY = 'myIdolBooBoo_v1';
  const songData = {
    magnetic: {name:'Magnetic', artist:'ILLIT', difficulty:'EASY', file:'assets/audio/magnetic.mp3', chart:window.BOOBOO_CHARTS.magnetic},
    era404: {name:'404 (New Era)', artist:'KiiiKiii', difficulty:'MEDIUM', file:'assets/audio/404-new-era.mp3', chart:window.BOOBOO_CHARTS.era404},
    ticktack: {name:'Tick-Tack', artist:'ILLIT', difficulty:'HARD', file:'assets/audio/tick-tack.mp3', chart:window.BOOBOO_CHARTS.ticktack}
  };
  const fresh = () => ({best:0, songsPlayed:0, totalScore:0, sfx:true, reducedMotion:false});
  let state = loadState(), currentSong='magnetic', game=null, audioCtx=null, masterGain=null, audioTimer=null, toastTimer=null;
  let soundOn = true;
  function loadState(){ try { const v=JSON.parse(localStorage.getItem(SAVE_KEY)); if(v && typeof v==='object') return {...fresh(),...v}; } catch(e){} return fresh(); }
  function save(){ try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); } catch(e){} updateStats(); }
  function updateStats(){ $("#homeBest").textContent=state.best.toLocaleString(); }
  function showView(id){ if(game && id!=='game' && id!=='results') stopGame(); $$('.view').forEach(v=>v.classList.toggle('active-view',v.id===id)); $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id)); window.scrollTo({top:0,behavior:state.reducedMotion?'auto':'smooth'}); }
  document.addEventListener('click', e=>{const goto=e.target.closest('[data-goto]');if(goto) showView(goto.dataset.goto);const nav=e.target.closest('[data-view]');if(nav) showView(nav.dataset.view);});
  $('#startBtn').addEventListener('click',()=>showView('songs'));
  function showModal(){ $('#modalBackdrop').hidden=false; }
  function closeModal(){ $('#modalBackdrop').hidden=true; }
  $('#closeModal').addEventListener('click',closeModal); $('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});
  function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
  $$('.song-card').forEach(card=>card.addEventListener('click',e=>{if(e.target.closest('button'))return;selectSong(card.dataset.song)}));
  function selectSong(id){currentSong=id;$('.song-card').forEach(c=>c.classList.toggle('selected',c.dataset.song===id));$('[data-play-song]').forEach(b=>{b.className='song-play '+(b.dataset.playSong===id?'primary-btn':'secondary-btn')});}
  $$('[data-play-song]').forEach(b=>b.addEventListener('click',()=>{selectSong(b.dataset.playSong);startGame()}));
  $('#againBtn').addEventListener('click',()=>{showView('songs');startGame()});
  $('#soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('#soundToggle').innerHTML=`♫ <span>${soundOn?'Sound on':'Sound off'}</span>`;if(masterGain)masterGain.gain.value=soundOn?0.22:0;if(game&&game.audio)game.audio.volume=soundOn?0.9:0;});
  $('#sfxSetting').checked=state.sfx;$('#sfxSetting').addEventListener('change',e=>{state.sfx=e.target.checked;save();});
  $('#motionSetting').checked=state.reducedMotion;$('#motionSetting').addEventListener('change',e=>{state.reducedMotion=e.target.checked;document.body.classList.toggle('reduce-motion',state.reducedMotion);save();});
  function audioInit(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();masterGain=audioCtx.createGain();masterGain.gain.value=soundOn?0.22:0;masterGain.connect(audioCtx.destination);}if(audioCtx.state==='suspended')audioCtx.resume();}
  function tone(freq,dur=.11,wave='sine',vol=.12){if(!audioCtx||!state.sfx||!soundOn)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(0.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(vol,audioCtx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g);g.connect(masterGain);o.start();o.stop(audioCtx.currentTime+dur+.02);}
  function startGame(){
    stopGame(); const s=songData[currentSong];
    const audio=new Audio(s.file); audio.preload='auto'; audio.volume=soundOn?0.9:0;
    game={running:false,paused:false,start:0,elapsed:0,duration:30,score:0,combo:0,maxCombo:0,hits:0,misses:0,total:0,notes:[],next:0,noteIndex:0,audio,chart:s.chart||[]};
    const board=$('#rhythmBoard'); $$('.note',board).forEach(n=>n.remove());
    $('#score').textContent='000000'; $('#combo').textContent='0'; $('#accuracy').textContent='100%'; $('#songProgress').style.width='0%';
    $('#playingTitle').textContent=s.name.toUpperCase()+' · '+s.artist; $('#feedback').textContent='GET READY!'; $('#countdown').hidden=false;
    showView('game'); let n=3; $('#countdown').textContent=n; const session=game;
    const tick=()=>{if(game!==session)return;if(n>1){n--;$('#countdown').textContent=n;session.countdownTimer=setTimeout(tick,650);}
      else {$('#countdown').hidden=true;session.running=true;session.start=performance.now();session.duration=audio.duration||30;
        audio.play().then(()=>gameLoop()).catch(()=>{feedback('TAP TO START AUDIO');session.running=false;$('#countdown').hidden=false;$('#countdown').textContent='TAP TO PLAY';$('#countdown').onclick=()=>{audio.play().then(()=>{$('#countdown').hidden=true;session.running=true;session.start=performance.now();gameLoop();});};});
      }};
    session.countdownTimer=setTimeout(tick,650);
    audio.addEventListener('ended',()=>{if(game===session)finishGame();});
  }
  function gameLoop(){
    if(!game||!game.running||game.paused)return;
    const now=performance.now(), audioTime=game.audio.currentTime;
    game.elapsed=audioTime; $('#songProgress').style.width=Math.min(100,audioTime/Math.max(1,game.duration)*100)+'%';
    if(game.audio.ended||audioTime>=game.duration){finishGame();return;}
    const travel=1.35;
    while(game.noteIndex<game.chart.length && game.chart[game.noteIndex].time<=audioTime+travel){
      const item=game.chart[game.noteIndex++]; spawnNote(item.lane,item.time,travel);
    }
    const hitY=$('.hit-line').getBoundingClientRect().top;
    game.notes.forEach(note=>{
      const remaining=note.time-audioTime, progress=1-remaining/travel;
      const board=$('.rhythm-board'), top=progress*(board.clientHeight-100)-25;
      note.el.style.top=top+'px';
      if(!note.done && remaining < -0.22){note.done=true;note.el.remove();game.misses++;game.combo=0;feedback('MISS');updateHud();}
    });
    game.notes=game.notes.filter(n=>!n.done);
    requestAnimationFrame(gameLoop);
  }
  function spawnNote(lane,targetTime,travel){
    if(!game)return; const el=document.createElement('div');el.className='note';
    const laneEl=$$('.lane')[lane];laneEl.appendChild(el);el.style.top='-28px';
    game.notes.push({lane,el,time:targetTime,done:false});
  }
  function hitLane(lane){if(!game||!game.running||game.paused)return;const h=$('.hit-line').getBoundingClientRect().top;let best=null,dist=Infinity;game.notes.forEach(n=>{if(n.lane!==lane||n.done)return;const r=n.el.getBoundingClientRect();const d=Math.abs((r.top+r.height/2)-h);if(d<dist){dist=d;best=n;}});if(best&&dist<90){best.done=true;best.el.remove();game.hits++;game.total++;let pts,txt;if(dist<28){pts=100;txt='PERFECT!';game.combo++;}else if(dist<60){pts=65;txt='GREAT!';game.combo++;}else{pts=30;txt='GOOD!';game.combo++;}game.score+=pts+Math.min(game.combo,30)*2;game.maxCombo=Math.max(game.maxCombo,game.combo);feedback(txt);tone([659,784,988][Math.min(2,Math.floor(dist/30))],.08,'sine',.08);}else{game.misses++;game.combo=0;feedback('MISS');tone(180,.08,'triangle',.03);}updateHud();}
  function feedback(txt){$('#feedback').textContent=txt;$('#feedback').style.color=txt==='MISS'?'#ff8ab7':txt==='PERFECT!'?'#ffe45c':'#8eeeff';}
  function updateHud(){if(!game)return;$('#score').textContent=String(game.score).padStart(6,'0');$('#combo').textContent=game.combo;const attempts=game.hits+game.misses;$('#accuracy').textContent=(attempts?Math.round(game.hits/attempts*100):100)+'%';}
  document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;const keys={ArrowLeft:0,ArrowDown:1,ArrowUp:2,ArrowRight:3};if(e.key in keys){e.preventDefault();hitLane(keys[e.key]);}if(e.key==='Escape'&&game)togglePause();});
  $$('[data-lane]').forEach(b=>{b.addEventListener('click',e=>{e.preventDefault();hitLane(Number(b.dataset.lane));});b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hitLane(Number(b.dataset.lane));}});});
  let pauseTime=0;function togglePause(){if(!game)return;if(!game.paused){game.paused=true;game.running=false;pauseTime=performance.now();game.audio.pause();$('#pauseBtn').textContent='▶ Resume';$('#countdown').hidden=false;$('#countdown').textContent='PAUSED';}else{game.paused=false;game.running=true;game.audio.play();$('#countdown').hidden=true;$('#pauseBtn').textContent='Ⅱ Pause';gameLoop();}}
  $('#pauseBtn').addEventListener('click',togglePause);$('#quitGame').addEventListener('click',()=>{stopGame();showView('songs')});
  function stopGame(){if(game){clearTimeout(game.countdownTimer);game.running=false;try{game.audio.pause();game.audio.currentTime=0;}catch(e){}game=null;}clearTimeout(audioTimer);audioTimer=null;$('#countdown').onclick=null;}
  function finishGame(){if(!game)return;game.running=false;clearTimeout(audioTimer);const g=game,score=g.score,acc=Math.round(g.hits/Math.max(1,g.hits+g.misses)*100);state.songsPlayed++;state.totalScore+=score;state.best=Math.max(state.best,score);const justUnlocked=[];cardData.forEach((c,i)=>{if(score>=c.score&&!state.unlocked.includes(i)){state.unlocked.push(i);justUnlocked.push(c.name);}});save();$('#resultSong').textContent=songData[currentSong].name;$('#resultScore').textContent=score.toLocaleString();$('#resultAccuracy').textContent=acc+'%';$('#resultCombo').textContent=g.maxCombo;$('#grade').textContent=acc>=95?'S':acc>=80?'A':acc>=60?'B':'C';$('#unlockMessage').textContent=justUnlocked.length?'✦ New photocard unlocked: '+justUnlocked.join(', ')+'!':state.unlocked.length===6?'♡ You collected every BooBoo card!':'♡ Keep playing to unlock more photocards!';$('#countdown').hidden=true;game=null;showView('results');updateStats();}
  $('#resetProgress').addEventListener('click',()=>{ $('#modalContent').innerHTML='<p class="eyebrow">START FRESH?</p><h2>Reset your score?</h2><p>This clears your scores and song history in this browser. It cannot be undone.</p><button class="primary-btn" id="confirmReset">Yes, reset progress</button> <button class="secondary-btn" id="cancelReset">Keep my progress</button>';showModal();$('#cancelReset').onclick=closeModal;$('#confirmReset').onclick=()=>{state=fresh();save();$('#sfxSetting').checked=true;$('#motionSetting').checked=false;document.body.classList.remove('reduce-motion');closeModal();toast('Fresh start! BooBoo says meow ♡');};});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&game.running)togglePause()});
  if(state.reducedMotion)document.body.classList.add('reduce-motion');$('#soundToggle').innerHTML=`♫ <span>${soundOn?'Sound on':'Sound off'}</span>`;selectSong('magnetic');updateStats();
})();
