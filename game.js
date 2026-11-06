(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const SAVE_KEY = 'myIdolBooBoo_v1';
  const songData = {
    magnetic: {name:'Magnetic', artist:'ILLIT', group:'sister', difficulty:'EASY', file:'assets/audio/magnetic.mp3', chart:window.BOOBOO_CHARTS.magnetic, cover:'assets/covers/magnetic.webp', image:'assets/booboo-idol.png'},
    era404: {name:'404 (New Era)', artist:'KiiiKiii', group:'sister', difficulty:'MEDIUM', file:'assets/audio/404-new-era.mp3', chart:window.BOOBOO_CHARTS.era404, cover:'assets/covers/404.webp', image:'assets/booboo-idol.png'},
    ticktack: {name:'Tick-Tack', artist:'ILLIT', group:'sister', difficulty:'HARD', file:'assets/audio/tick-tack.mp3', chart:window.BOOBOO_CHARTS.ticktack, cover:'assets/covers/tick-tack.webp', image:'assets/booboo-idol.png'},
    paranoid: {name:'Paranoid', artist:'Black Sabbath', group:'brother', difficulty:'HARD', file:'assets/audio/black_sabbath_paranoid.mp3', chart:window.BOOBOO_CHARTS.paranoid, cover:'assets/covers/paranoid.jpg', image:'assets/paranoid-rock.png'},
    yourUnderArrest: {name:'Your Under Arrest', artist:'ILLIT', group:'sister', difficulty:'MEDIUM', file:'assets/audio/Your Under Arrest - Illit.mp3', chart:window.BOOBOO_CHARTS.yourUnderArrest, coverText:'YOUR UNDER ARREST', coverClass:'cover-illit'},
    superInLove: {name:'Super in Love', artist:'ILLIT', group:'sister', difficulty:'EASY', file:'assets/audio/Super in Love- Illit.mp3', chart:window.BOOBOO_CHARTS.superInLove, coverText:'SUPER IN LOVE', coverClass:'cover-illit'},
    looksCanKill: {name:'Looks Can Kill', artist:'IVE', group:'sister', difficulty:'HARD', file:'assets/audio/Looks Can Kill - IVE.mp3', chart:window.BOOBOO_CHARTS.looksCanKill, coverText:'LOOKS CAN KILL', coverClass:'cover-ive'},
    bangBang: {name:'Bang Bang', artist:'IVE', group:'sister', difficulty:'MEDIUM', file:'assets/audio/Bang Bang- IVE.mp3', chart:window.BOOBOO_CHARTS.bangBang, coverText:'BANG BANG', coverClass:'cover-ive'},
    sugarHoneyIcedTea: {name:'Sugar Honey Iced Tea', artist:'BABYMONSTER', group:'sister', difficulty:'EASY', file:'assets/audio/Sugar Honey Iced Tea - Babymonster.mp3', chart:window.BOOBOO_CHARTS.sugarHoneyIcedTea, coverText:'SUGAR HONEY ICED TEA', coverClass:'cover-bm'},
    choom: {name:'CHOOM', artist:'BABYMONSTER', group:'sister', difficulty:'MEDIUM', file:'assets/audio/CHOOM- Babymonster.mp3', chart:window.BOOBOO_CHARTS.choom, coverText:'CHOOM', coverClass:'cover-bm'},
    topGun: {name:'Top Gun Theme', artist:'Harold Faltermeyer', group:'brother', difficulty:'MEDIUM', file:'assets/audio/Top Gun Theme.mp3', chart:window.BOOBOO_CHARTS.topGun, coverText:'TOP GUN', coverClass:'cover-brother'},
    verityMinecraft: {name:'Verity Minecraft', artist:'Verity', group:'brother', difficulty:'EASY', file:'assets/audio/Verity Minecraft.mp3', chart:window.BOOBOO_CHARTS.verityMinecraft, coverText:'VERITY MINECRAFT', coverClass:'cover-brother'}
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
  function renderSongShelf(section,difficulty){
    const shelf=$(section==='sister'?'#sisterSongShelf':'#brotherSongShelf');
    const matches=Object.entries(songData).filter(([id,s])=>s.group===section&&s.difficulty===difficulty);
    shelf.hidden=false;
    shelf.innerHTML='<div class="shelf-top"><button class="back-link shelf-back" data-back-shelf="'+section+'">← Difficulties</button><h3>'+difficulty+' SONGS</h3><span>'+matches.length+' TRACKS</span></div><div class="song-grid album-grid">'+matches.map(([id,s])=>{
      const cover=s.cover?'<img class="song-cover-image" src="'+s.cover+'" alt="'+s.name+' cover art">':'<div class="cover-placeholder '+(s.coverClass||'')+'"><span>✦</span><strong>'+s.coverText+'</strong><i>MY IDOL, BOOBOO</i></div>';
      return '<article class="song-card album-card '+(currentSong===id?'selected':'')+'" data-song="'+id+'"><div class="song-cover album-cover">'+cover+'</div><div class="song-info"><div><h3>'+s.name+'</h3><p>'+s.artist+'</p></div><span class="song-bpm">'+s.difficulty+'</span></div><button class="song-play '+(currentSong===id?'primary-btn':'secondary-btn')+'" data-play-song="'+id+'">▶ PLAY SONG</button></article>';
    }).join('')+'</div>';
  }
  function selectSong(id){currentSong=id;$$('.song-card').forEach(c=>c.classList.toggle('selected',c.dataset.song===id));$$('[data-play-song]').forEach(b=>{b.className='song-play '+(b.dataset.playSong===id?'primary-btn':'secondary-btn')});}
  document.addEventListener('click',e=>{
    const difficulty=e.target.closest('[data-difficulty]');
    if(difficulty){const section=difficulty.dataset.section;$$('[data-difficulty][data-section="'+section+'"]').forEach(b=>b.classList.toggle('active',b===difficulty));$(section==='sister'?'#sisterSongShelf':'#brotherSongShelf').hidden=true;renderSongShelf(section,difficulty.dataset.difficulty);return;}
    const back=e.target.closest('[data-back-shelf]');
    if(back){$(back.dataset.backShelf==='sister'?'#sisterSongShelf':'#brotherSongShelf').hidden=true;$$('[data-difficulty][data-section="'+back.dataset.backShelf+'"]').forEach(b=>b.classList.remove('active'));return;}
    const play=e.target.closest('[data-play-song]');
    if(play){selectSong(play.dataset.playSong);startGame();return;}
    const card=e.target.closest('.song-card');
    if(card)selectSong(card.dataset.song);
  });
  $('#againBtn').addEventListener('click',()=>{showView('songs');startGame()});
  $('#soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('#soundToggle').innerHTML=`♫ <span>${soundOn?'Sound on':'Sound off'}</span>`;if(masterGain)masterGain.gain.value=soundOn?0.22:0;if(game&&game.audio)game.audio.volume=soundOn?0.9:0;});
  $('#sfxSetting').checked=state.sfx;$('#sfxSetting').addEventListener('change',e=>{state.sfx=e.target.checked;save();});
  $('#motionSetting').checked=state.reducedMotion;$('#motionSetting').addEventListener('change',e=>{state.reducedMotion=e.target.checked;document.body.classList.toggle('reduce-motion',state.reducedMotion);save();});
  function audioInit(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();masterGain=audioCtx.createGain();masterGain.gain.value=soundOn?0.22:0;masterGain.connect(audioCtx.destination);}if(audioCtx.state==='suspended')audioCtx.resume();}
  function tone(freq,dur=.11,wave='sine',vol=.12){if(!audioCtx||!state.sfx||!soundOn)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.value=freq;g.gain.setValueAtTime(0.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(vol,audioCtx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g);g.connect(masterGain);o.start();o.stop(audioCtx.currentTime+dur+.02);}
  function startGame(){
    stopGame(); const s=songData[currentSong];
    const audio=new Audio(s.file); audio.preload='auto'; audio.volume=soundOn?0.9:0;
    game={running:false,paused:false,start:0,elapsed:0,duration:30,score:0,combo:0,maxCombo:0,hits:0,misses:0,total:0,notes:[],next:0,noteIndex:0,audio,chart:s.chart||[],danceStep:0,lastDanceTime:-10};
    const board=$('#rhythmBoard'); $$('.note',board).forEach(n=>n.remove());
    $('#score').textContent='000000'; $('#combo').textContent='0'; $('#accuracy').textContent='100%'; $('#songProgress').style.width='0%';
    $('#playingTitle').textContent=s.name.toUpperCase()+' · '+s.artist; $('.stage-booboo').src=s.image||'assets/booboo-idol.png'; $('.stage-booboo').alt='BooBoo performing '+s.name; $('.idol-photo-small').src=s.image||'assets/booboo-idol.png'; $('#feedback').textContent='GET READY!'; $('#countdown').hidden=false;
    showView('game'); let n=3; $('#countdown').textContent=n; const session=game;
    const showAudioFailure=()=>{if(game!==session)return;session.running=false;$('#countdown').hidden=false;$('#countdown').textContent='AUDIO COULD NOT LOAD';$('#countdown').onclick=null;feedback('CHECK AUDIO FILE / CONNECTION');};
    const beginPlayback=async()=>{
      if(game!==session)return;
      try{
        await audio.play();
        if(game!==session)return;
        $('#countdown').hidden=true;$('#countdown').onclick=null;
        session.running=true;session.paused=false;session.start=performance.now();
        if(Number.isFinite(audio.duration)&&audio.duration>0)session.duration=audio.duration;
        else session.duration=30;
        gameLoop();
      }catch(err){
        if(game!==session)return;
        session.running=false;$('#countdown').hidden=false;
        $('#countdown').textContent='CAN’T PLAY AUDIO — TAP TO RETRY';
        feedback('CHECK THE MP3 FILE');
      }
    };
    const tick=()=>{if(game!==session)return;if(n>1){n--;$('#countdown').textContent=n;session.countdownTimer=setTimeout(tick,650);}
      else {session.running=false;$('#countdown').hidden=false;$('#countdown').textContent='TAP TO PLAY';$('#countdown').onclick=beginPlayback;}
    };
    session.countdownTimer=setTimeout(tick,650);
    audio.addEventListener('error',showAudioFailure);
    audio.addEventListener('loadedmetadata',()=>{if(game===session&&Number.isFinite(audio.duration)&&audio.duration>0)session.duration=audio.duration;});
    audio.addEventListener('ended',()=>{if(game===session)finishGame();});
  }
  function gameLoop(){
    if(!game||!game.running||game.paused)return;
    const audioTime=game.audio.currentTime;
    game.elapsed=audioTime; $('#songProgress').style.width=Math.min(100,audioTime/Math.max(1,game.duration)*100)+'%';
    if(game.audio.ended||audioTime>=game.duration){finishGame();return;}
    const travel=1.65;
    while(game.noteIndex<game.chart.length && game.chart[game.noteIndex].time<=audioTime+travel){
      const item=game.chart[game.noteIndex++]; spawnNote(item.lane,item.time,travel);
    }
    let danceOnBeat=false;
    game.notes.forEach(note=>{
      const remaining=note.time-audioTime, progress=1-remaining/travel;
      const board=$('.rhythm-board'), top=progress*(board.clientHeight-100)-25;
      note.el.style.top=top+'px';
      if(!note.danced && remaining<=0.045 && remaining>=-0.075){note.danced=true;danceOnBeat=true;}
      if(!note.done && remaining < -0.30){note.done=true;note.el.remove();game.misses++;game.combo=0;feedback('MISS');updateHud();}
    });
    if(danceOnBeat && audioTime-game.lastDanceTime>=0.46){game.lastDanceTime=audioTime;danceBooBoo();}
    game.notes=game.notes.filter(n=>!n.done);
    requestAnimationFrame(gameLoop);
  }
  function danceBooBoo(){
    const idol=$('.stage-booboo');
    if(!idol||document.body.classList.contains('reduce-motion'))return;
    const moves=['dance-groove','dance-bounce','dance-twirl','dance-sway'];
    idol.classList.remove(...moves);
    game.danceStep=(game.danceStep+1)%moves.length;
    const move=moves[game.danceStep];
    void idol.offsetWidth;
    idol.classList.add(move);
  }
  function spawnNote(lane,targetTime,travel){
    if(!game)return; const el=document.createElement('div');el.className='note';
    const laneEl=$$('.lane')[lane];laneEl.appendChild(el);el.style.top='-28px';
    game.notes.push({lane,el,time:targetTime,done:false,danced:false});
  }
  function hitLane(lane){if(!game||!game.running||game.paused)return;const h=$('.hit-line').getBoundingClientRect().top;let best=null,dist=Infinity;game.notes.forEach(n=>{if(n.lane!==lane||n.done)return;const r=n.el.getBoundingClientRect();const d=Math.abs((r.top+r.height/2)-h);if(d<dist){dist=d;best=n;}});if(best&&dist<108){best.done=true;best.el.remove();game.hits++;game.total++;let pts,txt;if(dist<36){pts=100;txt='PERFECT!';game.combo++;}else if(dist<76){pts=65;txt='GREAT!';game.combo++;}else{pts=30;txt='GOOD!';game.combo++;}game.score+=pts+Math.min(game.combo,30)*2;game.maxCombo=Math.max(game.maxCombo,game.combo);feedback(txt);tone([659,784,988][Math.min(2,Math.floor(dist/30))],.08,'sine',.08);}else{game.misses++;game.combo=0;feedback('MISS');tone(180,.08,'triangle',.03);}updateHud();}
  function feedback(txt){$('#feedback').textContent=txt;$('#feedback').style.color=txt==='MISS'?'#ff8ab7':txt==='PERFECT!'?'#ffe45c':'#8eeeff';}
  function updateHud(){if(!game)return;$('#score').textContent=String(game.score).padStart(6,'0');$('#combo').textContent=game.combo;const attempts=game.hits+game.misses;$('#accuracy').textContent=(attempts?Math.round(game.hits/attempts*100):100)+'%';}
  document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;const keys={ArrowLeft:0,ArrowDown:1,ArrowUp:2,ArrowRight:3};if(e.key in keys){e.preventDefault();hitLane(keys[e.key]);}if(e.key==='Escape'&&game)togglePause();});
  $$('[data-lane]').forEach(b=>{b.addEventListener('click',e=>{e.preventDefault();hitLane(Number(b.dataset.lane));});b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hitLane(Number(b.dataset.lane));}});});
  let pauseTime=0;function togglePause(){if(!game)return;if(!game.paused){game.paused=true;game.running=false;pauseTime=performance.now();game.audio.pause();$('#pauseBtn').textContent='▶ Resume';$('#countdown').hidden=false;$('#countdown').textContent='PAUSED';}else{game.paused=false;game.running=true;game.audio.play();$('#countdown').hidden=true;$('#pauseBtn').textContent='Ⅱ Pause';gameLoop();}}
  $('#pauseBtn').addEventListener('click',togglePause);$('#quitGame').addEventListener('click',()=>{stopGame();showView('songs')});
  function stopGame(){if(game){clearTimeout(game.countdownTimer);game.running=false;try{game.audio.pause();game.audio.currentTime=0;}catch(e){}game=null;}clearTimeout(audioTimer);audioTimer=null;$('#countdown').onclick=null;}
  function finishGame(){if(!game)return;game.running=false;clearTimeout(audioTimer);const g=game,score=g.score,acc=Math.round(g.hits/Math.max(1,g.hits+g.misses)*100);state.songsPlayed++;state.totalScore+=score;state.best=Math.max(state.best,score);save();$('#resultSong').textContent=songData[currentSong].name+' · '+songData[currentSong].artist;$('#resultScore').textContent=score.toLocaleString();$('#resultAccuracy').textContent=acc+'%';$('#resultCombo').textContent=g.maxCombo;$('#grade').textContent=acc>=95?'S':acc>=80?'A':acc>=60?'B':'C';$('#unlockMessage').textContent='♡ BooBoo says: iconic performance. Run it back!';$('#countdown').hidden=true;game=null;showView('results');updateStats();}
  $('#resetProgress').addEventListener('click',()=>{ $('#modalContent').innerHTML='<p class="eyebrow">START FRESH?</p><h2>Reset your score?</h2><p>This clears your scores and song history in this browser. It cannot be undone.</p><button class="primary-btn" id="confirmReset">Yes, reset progress</button> <button class="secondary-btn" id="cancelReset">Keep my progress</button>';showModal();$('#cancelReset').onclick=closeModal;$('#confirmReset').onclick=()=>{state=fresh();save();$('#sfxSetting').checked=true;$('#motionSetting').checked=false;document.body.classList.remove('reduce-motion');closeModal();toast('Fresh start! BooBoo says meow ♡');};});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&game.running)togglePause()});
  if(state.reducedMotion)document.body.classList.add('reduce-motion');$('#soundToggle').innerHTML=`♫ <span>${soundOn?'Sound on':'Sound off'}</span>`;selectSong('magnetic');updateStats();
})();
