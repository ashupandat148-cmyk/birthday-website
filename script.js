// main behavior for the surprise site
(() => {
  // Basic navigation
  function show(step){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const el = document.querySelector(`[data-step="${step}"]`);
    if(el) el.classList.add('active');

    // step-specific triggers
    if(step === 'letter') revealLetter();
    if(step === 'minion') revealMinion();
    if(step === 'memory') revealMemory();
    if(step === 'final') {
      startFinalFireworks();
      try { pauseAll(); console.log('[Audio] Paused on final screen'); } catch(e) { console.warn(e); }
    }
  }

  /* ============================
     Starfield background
  ============================ */
  (function starfield(){
    const c = document.getElementById('stars');
    if(!c) return;
    const ctx = c.getContext('2d');
    function resize(){ c.width=window.innerWidth; c.height=window.innerHeight; }
    resize(); window.addEventListener('resize',resize);
    const stars = Array.from({length:160}, ()=>({
      x: Math.random()*c.width,
      y: Math.random()*c.height,
      r: Math.random()*1.2+0.2,
      alpha: Math.random()*0.9,
      d: Math.random()*0.02+0.002
    }));
    function tick(){
      ctx.clearRect(0,0,c.width,c.height);
      for(let s of stars){
        s.alpha += (Math.random()*0.02-0.01)*s.d;
        if(s.alpha>1) s.alpha=1;
        if(s.alpha<0) s.alpha=0;
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,"+s.alpha+")";
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ============================
     Audio manager
  ============================ */
  const musicControl = document.getElementById('musicControl');
  const musicBtn = document.getElementById('musicBtn');
  const MUSIC_SRC = 'assets/music.mp3';

  const sound = new Howl({
    src: [MUSIC_SRC],
    loop: true,
    volume: 0.56,
    html5: true
  });

  let audioFallback = null;
  let usingFallback = false;
  let howlerSoundId = null;

  function updateMusicUI(playing){
    if(musicControl){
      if(playing){
        musicControl.classList.add('playing');
        musicControl.textContent = '▮▮';
      } else {
        musicControl.classList.remove('playing');
        musicControl.textContent = '♪';
      }
    }
    if(musicBtn){
      musicBtn.textContent = playing ? 'Pause Music' : 'Play Music';
    }
  }

  sound.on('load', ()=>console.log('[Audio] Howler loaded', MUSIC_SRC));
  sound.on('play', id => {
    console.log('[Audio] Howler play. id=', id);
    howlerSoundId = id;
    usingFallback = false;
    updateMusicUI(true);
    console.log('Music started');
  });
  sound.on('pause', ()=>{ updateMusicUI(false); console.log('Music paused'); });
  sound.on('stop', ()=>{ updateMusicUI(false); });
  sound.on('end', ()=>{ updateMusicUI(false); });
  sound.on('loaderror', (id,err)=>{ console.error('[Audio] Howler loaderror', id, err); tryHtmlAudioFallback(err); });
  sound.on('playerror', (id,err)=>{ console.warn('[Audio] Howler playerror', id, err); tryHtmlAudioFallback(err); });

  function tryHtmlAudioFallback(err){
    console.warn('[Audio] Falling back to HTMLAudio:', err);
    if(audioFallback) return;
    try{
      audioFallback = new Audio(MUSIC_SRC);
      audioFallback.loop = true;
      audioFallback.volume = 0.56;
      const p = audioFallback.play();
      if(p && p.catch){
        p.catch((e) => { console.error('[Audio] HTMLAudio play failed:', e); });
      } else {
        usingFallback = true;
        updateMusicUI(true);
        console.log('Using HTMLAudio fallback');
      }
    } catch(e){
      console.error('[Audio] fallback error:', e);
    }
  }

  function isPlaying(){
    if(usingFallback){
      return audioFallback && !audioFallback.paused && !audioFallback.ended;
    }
    return howlerSoundId !== null && sound.playing(howlerSoundId);
  }

  function playIfNotPlaying(){
    try{
      if(isPlaying()) return;
      howlerSoundId = sound.play();
      usingFallback = false;
    } catch(e){
      console.warn('[Audio] error:', e);
      tryHtmlAudioFallback(e);
    }
  }

  function pauseAll(){
    try{
      if(usingFallback && audioFallback){
        audioFallback.pause();
        console.log('[Audio] HTMLAudio paused');
      } else if(howlerSoundId !== null){
        sound.pause(howlerSoundId);
        console.log('[Audio] Howler paused');
      }
      updateMusicUI(false);
    } catch(e){
      console.warn('[Audio] pauseAll error', e);
    }
  }

  function toggleMusic(){
    try{
      if(isPlaying()){
        pauseAll();
      } else {
        playIfNotPlaying();
      }
    } catch(e){
      console.warn('[Audio] toggle error', e);
    }
  }

  if(musicControl) musicControl.addEventListener('click', e => { e.stopPropagation(); toggleMusic(); });
  if(musicBtn) musicBtn.addEventListener('click', e => { e.stopPropagation(); toggleMusic(); });

  /* ============================
     Buttons and flow
  ============================ */
  const beginBtn = document.getElementById('beginBtn');
  if(beginBtn) beginBtn.addEventListener('click', ()=> {
    try { playIfNotPlaying(); console.log('[Audio] Begin clicked -> music start'); } catch(e){console.warn(e);}
    gsap.to('#welcome', {opacity:0, duration:0.6, onComplete: ()=> show('cake')});
    gsap.from('#cake', {scale:0.92, duration:0.6, ease:"power2.out"});
  });

  const blowBtn = document.getElementById('blowBtn');
  if(blowBtn) blowBtn.addEventListener('click', ()=>{
    console.log('[Candle] Blow button clicked');
    
    // Get all flame circles by their class
    const flames = document.querySelectorAll('.flame-top');
    console.log('[Candle] Found', flames.length, 'flames');
    
    // Animate each flame disappearing with blowing effect
    flames.forEach((flame, index) => {
      gsap.to(flame, {
        opacity: 0,
        r: 1,
        cy: '-=15', // Move upward as if blown
        duration: 0.6,
        delay: index * 0.1, // Stagger the flames
        ease: 'power2.in',
        onComplete: ()=> {
          flame.setAttribute('r', '5'); // Reset for replay
          flame.setAttribute('cy', '20'); // Reset cy
          flame.setAttribute('opacity', '1'); // Reset opacity
        }
      });
    });
    
    // Shake the cake as if being blown
    gsap.to('.birthday-cake', {
      y: -8,
      duration: 0.08,
      yoyo: true,
      repeat: 5,
      ease: 'sine.inOut'
    });
    
    // Add smoke effect (opacity flicker)
    gsap.to('circle.flame-top', {
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out'
    });
    
    // Trigger confetti after flames are blown
    setTimeout(()=> {
      console.log('[Candle] Triggering confetti');
      confetti({particleCount:160, spread:120, origin:{y:0.3}});
    }, 500);
    
    // Move to next screen after animation
    setTimeout(()=> {
      console.log('[Candle] Moving to question screen');
      show('question');
    }, 1100);
  });

  const noBtn = document.getElementById('noBtn');
  const questionEl = document.getElementById('questionScreen');
  function moveNo(){
    if(!noBtn || !questionEl) return;
    const rect = questionEl.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const padding = 16;
    const minX = rect.left + padding;
    const maxX = rect.right - btnRect.width - padding;
    const minY = rect.top + padding;
    const maxY = rect.bottom - btnRect.height - padding;
    const nx = Math.random()*(maxX-minX)+minX;
    const ny = Math.random()*(maxY-minY)+minY;
    gsap.to(noBtn, {x: nx - btnRect.left, y: ny - btnRect.top, duration:0.45, ease:'power3.out'});
  }
  if(noBtn){ noBtn.addEventListener('mouseenter', moveNo); noBtn.addEventListener('click', moveNo); }
  const yesBtn = document.getElementById('yesBtn');
  if(yesBtn) yesBtn.addEventListener('click', ()=> show('scratch'));

  /* ============================
     Scratch card
  ============================ */
  (function scratchCardInit(){
    const canvas = document.getElementById('scratchCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    function fit(){ canvas.width = 420; canvas.height = 220; canvas.style.width = '100%'; canvas.style.height = '100%'; }
    fit(); window.addEventListener('resize', fit);

    function resetOverlay(){
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      g.addColorStop(0,'#bdbdbd'); g.addColorStop(0.5,'#8f8f8f'); g.addColorStop(1,'#cfcfcf');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.globalCompositeOperation = 'destination-out';
    }
    resetOverlay();

    let isDown=false;
    function drawPoint(x,y){ ctx.beginPath(); ctx.arc(x,y,22,0,Math.PI*2); ctx.fill(); }
    function onDown(e){
      isDown=true;
      const r = canvas.getBoundingClientRect();
      const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
      const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
      drawPoint(x*(canvas.width/r.width), y*(canvas.height/r.height));
      checkReveal();
    }
    function onMove(e){
      if(!isDown) return;
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
      const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
      drawPoint(x*(canvas.width/r.width), y*(canvas.height/r.height));
      checkReveal();
    }
    function onUp(){ isDown=false; }
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown);
    canvas.addEventListener('touchmove', onMove, {passive:false});
    canvas.addEventListener('touchend', onUp);

    function getClearedPercent(){
      const pixels = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let cleared = 0;
      for(let i=3;i<pixels.length;i+=4){ if(pixels[i] === 0) cleared++; }
      return cleared / (canvas.width*canvas.height);
    }
    const messageEl = document.getElementById('scratchMessage');
    function checkReveal(){
      const p = getClearedPercent();
      if(p > 0.20){
        gsap.to(canvas, {opacity:0, duration:0.6, onComplete: ()=>{
          canvas.style.pointerEvents='none';
          if(messageEl) messageEl.classList.remove('hide');
          gsap.from(messageEl, {scale:0.86, opacity:0, duration:0.6, ease:'back.out(1.4)'});
          setTimeout(()=> show('letter'), 1400);
        }});
      }
    }

    window._resetScratch = resetOverlay;
  })();

  /* ============================
     Letter reveal
  ============================ */
  const letterText = `happy birthday to the cutest girl I have ever met in my life, thank you for being in my life..! You are the cutest thing I could ever get, stay happy stay bindas..! Keep flying..✨💜

Wishing you a sky full of dreams and a heart full of laughter. You make every day brighter just by being you. Keep shining, keep smiling, and keep soaring higher.

With all my love,
— Ashish`;

  function revealLetter(){
    const el = document.getElementById('letterText');
    const nextBtn = document.getElementById('letterNextBtn');
    if(!el) return;
    const paragraphs = letterText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    el.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    if(nextBtn){ gsap.set(nextBtn, {opacity:0, y:6}); nextBtn.style.pointerEvents = 'none'; }
    gsap.set(el, {opacity:0, y:8, scale:0.995});
    gsap.to(el, {opacity:1, y:0, scale:1, duration:0.85, ease:'power3.out', onComplete: ()=>{
      if(nextBtn){ gsap.to(nextBtn, {opacity:1, y:0, duration:0.45, ease:'power2.out', onStart: ()=> { nextBtn.style.pointerEvents = 'auto'; }}); }
    }});
  }

  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
  const letterNextBtn = document.getElementById('letterNextBtn');
  if(letterNextBtn) letterNextBtn.addEventListener('click', ()=> show('gift'));

  /* ============================
     Memory section - Single image reveal
  ============================ */
  const balloonContainer = document.getElementById('balloonContainer');
  const memoryImageWrapper = document.getElementById('memoryImageWrapper');
  const memoryNextBtn = document.getElementById('memoryNextBtn');
  let balloonClicked = false;

  function revealMemory(){
    balloonClicked = false;
    if(memoryNextBtn){
      gsap.set(memoryNextBtn, {opacity:0, y:6});
      memoryNextBtn.style.pointerEvents = 'none';
    }
    memoryImageWrapper.classList.add('hide');
    if(balloonContainer){
      gsap.set(balloonContainer, {opacity:1});
      balloonContainer.style.pointerEvents = 'auto';
    }
  }

  if(balloonContainer){
    balloonContainer.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(balloonClicked) return;
      balloonClicked = true;
      console.log('[Memory] Balloon clicked - revealing memory image');

      gsap.to('.floating-balloon', {scale:0, opacity:0, duration:0.4, ease:'back.in'});
      
      confetti({particleCount:80, spread:90, origin:{y:0.4}});

      setTimeout(()=>{
        gsap.to(balloonContainer, {opacity:0, duration:0.4, onComplete: ()=>{
          balloonContainer.style.pointerEvents = 'none';
        }});

        memoryImageWrapper.classList.remove('hide');

        setTimeout(()=>{
          if(memoryNextBtn){
            gsap.to(memoryNextBtn, {opacity:1, y:0, duration:0.45, ease:'power2.out', onStart: ()=>{
              memoryNextBtn.style.pointerEvents = 'auto';
            }});
          }
        }, 900);

      }, 400);
    });
  }

  if(memoryNextBtn){
    memoryNextBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      console.log('[Memory] Next clicked - proceeding to minion');
      memoryNextBtn.style.pointerEvents = 'none';
      show('minion');
    });
  }

  /* ============================
     Minion reveal
  ============================ */
  const minionImg = document.getElementById('minionImg');
  const minionNextBtn = document.getElementById('minionNextBtn');
  function revealMinion(){
    const min = document.getElementById('minion');
    const caption = document.getElementById('minionCaption');
    if(caption) caption.style.opacity = 0.95;

    if(minionImg){
      minionImg.style.display = 'block';
      gsap.set(minionImg, {opacity:0, scale:0.95});
    }

    if(min){
      gsap.fromTo(min, {y:-10, rotation: -2}, {y:0, rotation:0, duration:0.8, ease:'sine.out'});
      gsap.to(min, {y:-8, duration:1.2, yoyo:true, repeat:-1, ease:'sine.inOut'});
      gsap.to(min, {rotation:6, duration:1.8, yoyo:true, repeat:-1, ease:'sine.inOut'});
    }

    if(minionNextBtn){
      gsap.set(minionNextBtn, {opacity:0, y:6});
      minionNextBtn.style.pointerEvents = 'none';
    }
  }

  /* ============================
     Gift sequences
  ============================ */
  const giftBox = document.getElementById('giftBox');
  const giftLid = document.getElementById('giftLid');
  const giftReveal = document.getElementById('giftReveal');
  const giftSticker = document.getElementById('giftSticker');
  const openGiftBtn2 = document.getElementById('openGiftBtn2');
  const openGiftBtn = document.getElementById('openGiftBtn');
  const skipGiftBtn = document.getElementById('skipGiftBtn');
  const teddyContainer = document.getElementById('teddyContainer');
  const teddyMessage = document.getElementById('teddyMessage');
  const teddyNextBtn = document.getElementById('teddyNextBtn');
  let giftOpened = false;
  let secondGiftOpened = false;

  function createTeddySVG(){
    if(!teddyContainer) return;
    teddyContainer.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox','0 0 240 240');
    svg.classList.add('teddy-svg');
    svg.innerHTML = `
      <defs>
        <linearGradient id="tdg" x1="0" x2="1">
          <stop offset="0" stop-color="#ffd9b3"/><stop offset="1" stop-color="#ffbfa1"/>
        </linearGradient>
      </defs>
      <g transform="translate(120,120)">
        <g id="teddyBody">
          <ellipse cx="0" cy="40" rx="50" ry="60" fill="url(#tdg)" stroke="#a36a3f" stroke-width="2"/>
        </g>
        <g id="teddyHead" transform="translate(0,-40)">
          <circle cx="0" cy="0" r="42" fill="url(#tdg)" stroke="#a36a3f" stroke-width="2"/>
          <circle cx="-18" cy="-32" r="16" fill="url(#tdg)" stroke="#a36a3f" stroke-width="2"/>
          <circle cx="18" cy="-32" r="16" fill="url(#tdg)" stroke="#a36a3f" stroke-width="2"/>
          <ellipse cx="-10" cy="-6" rx="6" ry="8" fill="#3b2a2a"/>
          <ellipse cx="10" cy="-6" rx="6" ry="8" fill="#3b2a2a"/>
          <circle cx="0" cy="8" r="7" fill="#3b2a2a"/>
          <path d="M -10 14 Q 0 26 10 14" fill="none" stroke="#6b3b3b" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g id="teddyArms" transform="translate(0,0)">
          <ellipse cx="-58" cy="0" rx="14" ry="20" fill="url(#tdg)" stroke="#a36a3f" stroke-width="2"/>
          <ellipse cx="58" cy="0" rx="14" ry="20" fill="url(#tdg)" stroke="#a36a3f" stroke-width="2"/>
        </g>
        <g id="heart" transform="translate(0,28) scale(0.9)">
          <path d="M 0 -4 C -18 -30 -60 -10 -18 24 C 0 40 18 24 18 24 C 60 -10 18 -30 0 -4 Z"
            fill="#ff6c9b" stroke="#c23a6a" stroke-width="2"/>
        </g>
      </g>
    `;
    teddyContainer.appendChild(svg);
  }

  function spawnFloatingHearts(count=10){
    for(let i=0;i<count;i++){
      const h = document.createElement('div');
      h.className = 'heart';
      const size = 14 + Math.random()*28;
      h.style.width = h.style.height = size + 'px';
      const left = (window.innerWidth/2) + (Math.random()*360 - 180);
      const top = (window.innerHeight/2) + (Math.random()*160 - 80);
      h.style.left = left + 'px';
      h.style.top = top + 'px';
      h.style.background = `radial-gradient(circle at 35% 30%, #fff6, #fff0), linear-gradient(180deg, #ff99c6, #ff5fa0)`;
      h.style.borderRadius = '50%';
      h.style.opacity = '0.95';
      h.style.zIndex = 9998;
      document.body.appendChild(h);
      gsap.fromTo(h, {y:0, scale:0.6, rotation: Math.random()*30-15, opacity:0}, {
        y: -160 - Math.random()*160,
        x: (Math.random()*120-60),
        opacity:1,
        scale:1,
        duration: 1.6 + Math.random(),
        ease: 'power2.out',
        onComplete: ()=> gsap.to(h, {opacity:0, duration:0.6, onComplete: ()=> h.remove()})
      });
    }
  }

  function openGiftSequence_First(){
    if(giftOpened) return;
    giftOpened = true;

    if(!giftLid || !giftBox || !giftReveal){
      console.error('[Gift] missing elements');
      show('final');
      return;
    }

    gsap.to(giftLid, {rotationX: -120, transformOrigin: "center bottom", duration:0.8, ease:'back.out(1.4)'});
    gsap.to(giftBox, {scale:1.04, duration:0.6, ease:'power2.out'});

    setTimeout(()=> confetti({particleCount:220, spread:160, origin:{y:0.45}}), 420);
    setTimeout(()=> spawnFloatingHearts(14), 520);

    setTimeout(()=> {
      try {
        createTeddySVG();
        const tcont = teddyContainer;
        const tmsg = teddyMessage;
        if(tcont && tmsg){
          tcont.classList.remove('hide');
          tmsg.textContent = "Happy Birthday, Miss Captain 🤍🤍";
          tmsg.style.opacity = 0;

          gsap.to(giftReveal, {opacity:1, duration:0.6, y:0, ease:'power2.out'});
          if(giftSticker) { gsap.fromTo(giftSticker, {scale:0.6, rotation:-20, opacity:0}, {scale:1, rotation:0, opacity:1, duration:0.8, ease:'elastic.out(1,0.6)'}); }
          gsap.fromTo(tcont, {scale:0.6, opacity:0, y:12}, {scale:1, opacity:1, y:0, duration:0.9, ease:'elastic.out(1,0.6)'});
          gsap.to(tmsg, {opacity:1, y:0, duration:0.8, ease:'power2.out', delay:0.2});

          const tNext = document.getElementById('teddyNextBtn');
          if(tNext){
            gsap.set(tNext, {opacity:1, y:0});
            tNext.style.pointerEvents = 'auto';
            console.log('[Flow] Teddy Next shown');
          }
        }
      } catch(err){
        console.error('[Gift] error', err);
      }
    }, 640);
  }

  function openGiftSequence_SecondOnMinion(){
    if(secondGiftOpened) return;
    secondGiftOpened = true;

    const minionScreen = document.getElementById('minionScreen');
    if(!minionScreen){
      console.error('[Minion Gift] not found');
      show('final');
      return;
    }

    const temp = document.createElement('div');
    temp.className = 'temp-gift';
    temp.style.position = 'absolute';
    temp.style.width = '140px';
    temp.style.height = '110px';
    temp.style.left = '50%';
    temp.style.top = '58%';
    temp.style.transform = 'translate(-50%,-50%)';
    temp.style.zIndex = 9999;
    temp.innerHTML = `<div style="width:100%;height:100%;border-radius:8px; background:linear-gradient(180deg,#ff6ec7,#d44fb0); display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800; position:relative;">
      <div style="position:absolute;left:0;right:0;top:0;height:38px;background:linear-gradient(180deg,#ffd34f,#ffb84f);border-radius:8px 8px 0 0; transform-origin:center bottom;" id="tempGiftLid"></div>
      <div style="position:relative; z-index:2;">TO YOU</div>
    </div>`;
    document.body.appendChild(temp);

    gsap.fromTo(temp, {scale:0.6, opacity:0}, {scale:1, opacity:1, duration:0.6, ease:'back.out(1.2)'});

    setTimeout(()=> {
      const lid = document.getElementById('tempGiftLid');
      if(lid){ gsap.to(lid, {rotationX: -120, transformOrigin: 'center bottom', duration:0.7, ease:'back.out(1.4)'}); }
      spawnFloatingHearts(16);
      confetti({particleCount:160, spread:120, origin:{y:0.45}});
    }, 300);

    setTimeout(()=> {
      temp.remove();

      if(minionImg){
        gsap.fromTo(minionImg, {scale:0.6, opacity:0}, {scale:1, opacity:1, duration:0.9, ease:'elastic.out(1,0.6)'});
      }

      const caption = document.getElementById('minionCaption');
      if(caption){
        caption.textContent = 'This is for you ❤️🎁';
        gsap.fromTo(caption, {y:8, opacity:0}, {y:0, opacity:1, duration:0.6, ease:'power2.out'});
      }

      setTimeout(()=> { confetti({particleCount:120, spread:100, origin:{y:0.45}}); spawnFloatingHearts(10); }, 220);

      if(minionNextBtn){
        gsap.to(minionNextBtn, {opacity:1, y:0, duration:0.45, ease:'power2.out', onStart: ()=> { minionNextBtn.style.pointerEvents = 'auto'; }});
      }

    }, 1000);
  }

  if(openGiftBtn2){
    openGiftBtn2.addEventListener('click', (e)=>{
      e.stopPropagation();
      console.log('[Click] First Open Gift');
      openGiftSequence_First();
    });
  }

  if(openGiftBtn){
    openGiftBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      console.log('[Click] Second Open Gift');
      openGiftSequence_SecondOnMinion();
    });
  }

  if(giftBox){
    giftBox.addEventListener('click', (e)=>{
      e.stopPropagation();
      console.log('[Click] Gift box');
      openGiftSequence_First();
    });
  }

  if(skipGiftBtn){
    skipGiftBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      show('minion');
    });
  }

  const tNextButton = document.getElementById('teddyNextBtn');
  if(tNextButton){
    tNextButton.addEventListener('click', (e)=>{
      e.stopPropagation();
      console.log('[Click] Teddy Next');
      tNextButton.style.pointerEvents = 'none';
      show('memory');
    });
  }

  if(minionNextBtn){
    minionNextBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      console.log('[Click] Minion Next');
      minionNextBtn.style.pointerEvents = 'none';
      gsap.to('#minionScreen', {opacity:0, duration:0.45, onComplete: ()=> {
        gsap.set('#minionScreen', {opacity:''});
        show('final');
      }});
    });
  }

  /* ============================
     Final fireworks
  ============================ */
  function startFinalFireworks(){
    function burst(){
      confetti({
        particleCount:120,
        spread:150,
        origin:{x: Math.random()*0.8 + 0.1, y: Math.random()*0.2 + 0.05},
        ticks: 200
      });
    }
    let bursts=0;
    const iv = setInterval(()=>{ burst(); bursts++; if(bursts>7) clearInterval(iv); }, 700);
  }

  /* ============================
     Replay
  ============================ */
  const replayBtn = document.getElementById('replayBtn');
  if(replayBtn) replayBtn.addEventListener('click', ()=>{
    const scratchCanvas = document.getElementById('scratchCanvas');
    if(scratchCanvas){ scratchCanvas.style.opacity=1; scratchCanvas.style.pointerEvents='auto'; window._resetScratch && window._resetScratch(); }
    const scratchMessage = document.getElementById('scratchMessage');
    if(scratchMessage) scratchMessage.classList.add('hide');
    
    // Reset candle flames for replay
    const flames = document.querySelectorAll('.flame-top');
    flames.forEach(flame => {
      gsap.set(flame, {opacity:1, r:5, cy:20});
    });
    
    gsap.set('.birthday-cake', {y:0});
    if(giftLid) gsap.set(giftLid, {rotationX:0});
    if(giftBox) gsap.set(giftBox, {scale:1});
    if(giftReveal) giftReveal.style.opacity = 0;
    const tcont = document.getElementById('teddyContainer');
    const tmsg = document.getElementById('teddyMessage');
    if(tcont){ tcont.classList.add('hide'); tcont.innerHTML = ''; }
    if(tmsg) tmsg.textContent = '';
    const nextBtn = document.getElementById('letterNextBtn');
    if(nextBtn){ gsap.set(nextBtn, {opacity:0, y:6}); nextBtn.style.pointerEvents = 'none'; }
    try { if(isPlaying()) { pauseAll(); console.log('Music paused on replay'); } } catch(e){ console.warn(e); }
    giftOpened = false;
    secondGiftOpened = false;
    balloonClicked = false;
    if(minionImg){
      gsap.set(minionImg, {scale:0.95, opacity:0});
      minionImg.style.display = 'block';
    }
    if(minionNextBtn){
      gsap.set(minionNextBtn, {opacity:0, y:6});
      minionNextBtn.style.pointerEvents = 'none';
    }
    if(memoryNextBtn){
      gsap.set(memoryNextBtn, {opacity:0, y:6});
      memoryNextBtn.style.pointerEvents = 'none';
    }
    if(balloonContainer){
      gsap.set(balloonContainer, {opacity:1});
      balloonContainer.style.pointerEvents = 'auto';
    }
    if(memoryImageWrapper){
      memoryImageWrapper.classList.add('hide');
    }
    show('welcome');
    window.scrollTo({top:0,behavior:'smooth'});
  });

  window._showStep = show;
  window._audioDebug = { isPlaying: () => isPlaying(), usingFallback: () => usingFallback };

  /* ============================
     Minion image verification
  ============================ */
  (function ensureMinionImage(){
    const img = document.getElementById('minionImg');
    if(!img){
      console.error('[Minion] not found');
      return;
    }

    const REQUIRED_SRC = 'assets/minion.png';
    if(!img.getAttribute('src') || img.getAttribute('src') !== REQUIRED_SRC){
      img.setAttribute('src', REQUIRED_SRC);
    }

    img.style.display = 'block';
    gsap.set(img, {opacity:0, scale:0.95});

    img.addEventListener('load', function onLoad(){
      console.log('[Minion] loaded');
      img.removeEventListener('load', onLoad);
    });

    img.addEventListener('error', function onError(event){
      console.error('[Minion] failed to load:', img.src);
      img.removeEventListener('error', onError);
    });

    const current = img.src;
    img.src = '';
    setTimeout(()=> { img.src = REQUIRED_SRC; }, 10);
  })();

})();