// main behavior for the surprise site
(() => {
  // Basic navigation
  function show(step){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const el = document.querySelector(`[data-step="${step}"]`);
    if(el) el.classList.add('active');

    // step-specific triggers
    if(step === 'letter') typeLetter();
    if(step === 'memory') animatePolaroids();
    if(step === 'final') startFinalFireworks();
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
     Music (Howler)
     - will NOT autoplay on load
     - will start after a user interaction (Begin or Open Gift)
  ============================ */
  const musicControl = document.getElementById('musicControl');
  const musicBtn = document.getElementById('musicBtn'); // older control
  const sound = new Howl({
    src: ['assets/music.mp3'],
    loop: true,
    volume: 0.5,
    html5: true // use html5 audio to improve mobile compatibility
  });

  function updateMusicUI(playing){
    if(musicControl){
      if(playing) musicControl.classList.add('playing'), musicControl.textContent = '▮▮';
      else musicControl.classList.remove('playing'), musicControl.textContent = '♪';
    }
    if(musicBtn){
      musicBtn.textContent = playing ? 'Pause Music' : 'Play Music';
    }
  }

  function playSoundIfNotPlaying(){
    try{
      if(!sound.playing()){
        sound.play();
        updateMusicUI(true);
      }
    }catch(e){
      // some browsers may throw if permission not granted; ignore silently
      console.warn('Music play blocked or failed', e);
    }
  }
  function toggleMusic(){
    try{
      if(sound.playing()){
        sound.pause();
        updateMusicUI(false);
      } else {
        sound.play();
        updateMusicUI(true);
      }
    } catch(e){
      console.warn('toggleMusic error', e);
    }
  }

  // wire music UI
  if(musicControl) musicControl.addEventListener('click', (e)=>{
    e.stopPropagation();
    toggleMusic();
  });
  if(musicBtn) musicBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    // older control also toggles
    if(sound.playing()) sound.pause(), updateMusicUI(false);
    else sound.play(), updateMusicUI(true);
  });

  /* ============================
     Wire up buttons and flow
  ============================ */
  const beginBtn = document.getElementById('beginBtn');
  if(beginBtn) beginBtn.addEventListener('click', ()=> {
    // start music now that user interacted
    playSoundIfNotPlaying();

    gsap.to('#welcome', {opacity:0, duration:0.6, onComplete: ()=> show('cake')});
    gsap.from('#cake', {scale:0.92, duration:0.6, ease:"power2.out"});
  });

  /* Cake flames */
  const flames = document.querySelectorAll('.flame');
  function flicker(){
    flames.forEach((f)=>{
      gsap.to(f, {yPercent: (Math.random()*20-10), scale: 0.9+Math.random()*0.25, rotation: Math.random()*6-3, duration: 0.12+Math.random()*0.2, ease:'sine.inOut'});
    });
  }
  if(flames.length) setInterval(flicker, 140);

  const blowBtn = document.getElementById('blowBtn');
  if(blowBtn) blowBtn.addEventListener('click', ()=>{
    gsap.to('.flame',{scale:0.2, opacity:0, duration:0.9, ease:'expo.inOut'});
    gsap.to('.cake', {y:-8, duration:0.08, yoyo:true, repeat:5, ease:'sine.inOut'});
    setTimeout(()=> confetti({particleCount:160, spread:120, origin:{y:0.3}}), 500);
    setTimeout(()=> show('question'), 1100);
  });

  /* Question screen (evasive No) */
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
  if(noBtn){
    noBtn.addEventListener('mouseenter', moveNo);
    noBtn.addEventListener('click', moveNo);
  }
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
    function drawPoint(x,y){
      ctx.beginPath();
      ctx.arc(x,y,22,0,Math.PI*2);
      ctx.fill();
    }
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
      for(let i=3;i<pixels.length;i+=4){
        if(pixels[i] === 0) cleared++;
      }
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

    // expose reset for replay
    window._resetScratch = resetOverlay;
  })();

  /* ============================
     Letter typing (custom message) — now waits for Next button
     + improved finishing animation so text 'pops' smoothly
  ============================ */
  const letterText = `happy birthday to the cutest girl I have ever met in my life, thank you for being in my life..! You are the cutest thing I could ever get, stay happy stay bindas..! Keep flying..✨💜

Wishing you a sky full of dreams and a heart full of laughter. You make every day brighter just by being you. Keep shining, keep smiling, and keep soaring higher.

With all my love,
— Ashish`;

  function typeLetter(){
    const el = document.getElementById('letterText');
    const nextBtn = document.getElementById('letterNextBtn');
    if(!el) return;
    // reset next button state
    if(nextBtn){
      gsap.set(nextBtn, {opacity:0, y:6});
      nextBtn.style.pointerEvents = 'none';
    }
    // clear and prepare
    el.textContent = '';
    el.style.opacity = 0.98;
    let i=0;
    const speed = 18;

    // more robust typing: batch by character but avoid heavy layout thrash
    function step(){
      if(i<=letterText.length){
        // gradually reveal
        el.textContent = letterText.slice(0,i);
        i++;
        setTimeout(step, speed);
      } else {
        // typing finished — animate the whole block so it "pops" cleanly
        const tl = gsap.timeline();
        tl.fromTo(el, {scale:0.985, filter:'drop-shadow(0 0 0 rgba(0,0,0,0))', opacity:0.96},
                         {scale:1, filter:'drop-shadow(0 16px 40px rgba(138,79,255,0.08))', opacity:1, duration:0.7, ease:'back.out(1.2)'});
        // subtle glow on paper while text is displayed
        tl.to('.paper::before', {duration:0.8}, 0);

        // animate next button in
        if(nextBtn){
          gsap.to(nextBtn, {opacity:1, y:0, duration:0.45, ease:'power2.out', onStart: ()=> { nextBtn.style.pointerEvents = 'auto'; }});
        }
        // also animate the greeting a little
        gsap.fromTo('#letterGreet', {y:-6, opacity:0.92}, {y:0, opacity:1, duration:0.6, ease:'power2.out'});
      }
    }
    step();
  }

  // Next button listener to proceed to gift
  const letterNextBtn = document.getElementById('letterNextBtn');
  if(letterNextBtn) letterNextBtn.addEventListener('click', ()=> {
    show('gift');
  });

  /* ============================
     Memory polaroids
  ============================ */
  const photos = [
    'assets/photo1.jpg','assets/photo2.jpg','assets/photo3.jpg',
    'assets/photo4.jpg','assets/photo5.jpg','assets/photo6.jpg'
  ];
  const grid = document.getElementById('memoryGrid');
  function populatePolaroids(){
    if(!grid) return;
    grid.innerHTML = '';
    photos.forEach((p,i)=>{
      const card = document.createElement('div');
      card.className='polaroid';
      card.innerHTML = `<img src="${p}" alt="memory ${i+1}"><div class="cap">Memory ${i+1}</div>`;
      card.style.transform = `rotate(${(Math.random()*6-3).toFixed(2)}deg) translateY(30px) scale(0.92)`;
      card.style.opacity = 0;
      card.addEventListener('click', ()=> {
        gsap.to(card, {scale:1.08, rotate:0, duration:0.28, yoyo:true, repeat:1, ease:'power1.inOut'});
      });
      grid.appendChild(card);
    });
  }
  populatePolaroids();

  function animatePolaroids(){
    const nodes = document.querySelectorAll('.polaroid');
    if(!nodes.length) return;
    gsap.to(nodes, {y:0, opacity:1, scale:1, stagger:0.08, duration:0.7, ease:'back.out(1.4)'});
    // auto-advance to minion after a short pause (optional)
    setTimeout(()=> show('minion'), 3600);
  }

  /* ============================
     Minion reveal (from memory -> minion)
  ============================ */
  const openGiftBtn = document.getElementById('openGiftBtn');
  if(openGiftBtn) openGiftBtn.addEventListener('click', ()=>{
    const min = document.getElementById('minion');
    if(min) gsap.fromTo(min, {y:-40, scale:0.6, rotation:-8, opacity:0}, {y:0, scale:1, rotation:0, opacity:1, duration:0.9, ease:'elastic.out(1,0.6)'});
    // starting music on this interaction as well
    playSoundIfNotPlaying();
    setTimeout(()=> show('final'), 1600);
  });

  /* ============================
     Virtual gift animation (sticker + hearts)
  ============================ */
  const giftBox = document.getElementById('giftBox');
  const giftLid = document.getElementById('giftLid');
  const giftReveal = document.getElementById('giftReveal');
  const giftSticker = document.getElementById('giftSticker');
  const openGiftBtn2 = document.getElementById('openGiftBtn2');
  const skipGiftBtn = document.getElementById('skipGiftBtn');

  function spawnHearts(count=8){
    for(let i=0;i<count;i++){
      const h = document.createElement('div');
      h.className='heart';
      const size = 18 + Math.random()*18;
      h.style.width = h.style.height = size + 'px';
      h.style.left = (giftBox.getBoundingClientRect().left + giftBox.offsetWidth/2 - (size/2) + (Math.random()*80-40)) + 'px';
      h.style.top = (giftBox.getBoundingClientRect().top + 10 + (Math.random()*20-10)) + 'px';
      h.style.background = 'linear-gradient(180deg,#ff8bd8,#ff5fa0)';
      h.style.opacity = 0.95;
      h.style.zIndex = 9999;
      document.body.appendChild(h);
      gsap.fromTo(h, {y:0, scale:0.6, opacity:0}, {y:-120 - Math.random()*80, x: (Math.random()*120-60), rotation: (Math.random()*80-40), opacity:1, duration:1.6 + Math.random()*0.6, ease:'power2.out', onComplete: ()=> {
        gsap.to(h, {opacity:0, duration:0.6, onComplete: ()=> h.remove()});
      }});
    }
  }

  function openGiftSequence(){
    // Start music if not playing (user interaction)
    playSoundIfNotPlaying();

    if(!giftLid || !giftBox || !giftReveal) return;
    gsap.to(giftLid, {rotationX: -120, transformOrigin: "center bottom", duration:0.8, ease:'back.out(1.4)'});
    gsap.to(giftBox, {scale:1.04, duration:0.6, ease:'power2.out'});
    setTimeout(()=> spawnHearts(12), 420);
    setTimeout(()=> confetti({particleCount:120, spread:110, origin:{y:0.45}}), 420);
    setTimeout(()=> {
      // reveal message and animate sticker
      gsap.to(giftReveal, {opacity:1, duration:0.6, y:0, ease:'power2.out'});
      if(giftSticker){
        gsap.fromTo(giftSticker, {scale:0.6, rotation:-20, opacity:0}, {scale:1, rotation:0, opacity:1, duration:0.8, ease:'elastic.out(1,0.6)'});
        // sticker subtle bob
        gsap.to(giftSticker, {y:-6, duration:1.6, yoyo:true, repeat:-1, ease:'sine.inOut', delay:0.9});
      }
    }, 640);
    setTimeout(()=> {
      // auto-advance to memory after a short moment
      setTimeout(()=> show('memory'), 1900);
    }, 1400);
  }

  if(openGiftBtn2) openGiftBtn2.addEventListener('click', openGiftSequence);
  if(giftBox) giftBox.addEventListener('click', openGiftSequence);
  if(skipGiftBtn) skipGiftBtn.addEventListener('click', ()=> show('memory'));

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
    // reset scratch overlay
    const scratchCanvas = document.getElementById('scratchCanvas');
    if(scratchCanvas){
      scratchCanvas.style.opacity=1;
      scratchCanvas.style.pointerEvents='auto';
      window._resetScratch && window._resetScratch();
    }
    // hide scratch message
    const scratchMessage = document.getElementById('scratchMessage');
    if(scratchMessage) scratchMessage.classList.add('hide');
    // reset flames
    gsap.set('.flame',{opacity:1, scale:1, yPercent:0});
    // reset gift visuals
    if(giftLid) gsap.set(giftLid, {rotationX:0});
    if(giftBox) gsap.set(giftBox, {scale:1});
    if(giftReveal) giftReveal.style.opacity = 0;
    if(giftSticker) { gsap.set(giftSticker, {scale:0.8, rotation:0, opacity:0}); gsap.killTweensOf(giftSticker); }
    // reset letter next button
    const nextBtn = document.getElementById('letterNextBtn');
    if(nextBtn){
      gsap.set(nextBtn, {opacity:0, y:6});
      nextBtn.style.pointerEvents = 'none';
    }
    // go back to welcome
    show('welcome');
    window.scrollTo({top:0,behavior:'smooth'});
  });

  // Export show to global for debug if needed
  window._showStep = show;
})();