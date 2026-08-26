// Navatiwat International School — shared site behaviour
// Used across all pages; each block checks for its elements before running.
// Works with mouse AND touch throughout.

  document.querySelectorAll('.utab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.utab').forEach(t=>t.classList.remove('on'));
      document.querySelectorAll('.upanel').forEach(p=>p.classList.remove('on'));
      tab.classList.add('on');
      document.getElementById(tab.dataset.tab).classList.add('on');
    });
  });

  /* ---- swipe left/right between uniform tabs on touch devices ---- */
  (function(){
    const tabs = Array.from(document.querySelectorAll('.utab'));
    const panelWrap = document.querySelector('.uniform-layout > div:last-child');
    if(!tabs.length || !panelWrap) return;
    let startX = 0, startY = 0, tracking = false;
    panelWrap.addEventListener('touchstart', (e)=>{
      if(e.target.closest('.utab')) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, {passive:true});
    panelWrap.addEventListener('touchend', (e)=>{
      if(!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if(Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      const activeIdx = tabs.findIndex(t=>t.classList.contains('on'));
      let nextIdx = dx < 0 ? activeIdx+1 : activeIdx-1;
      if(nextIdx < 0) nextIdx = tabs.length-1;
      if(nextIdx >= tabs.length) nextIdx = 0;
      tabs[nextIdx].click();
    }, {passive:true});
  })();

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); } });
  }, {threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

  /* ---- mobile hamburger menu ---- */
  const navToggle = document.querySelector('.navtoggle');
  const navLinksEl = document.querySelector('.navlinks');
  if(navToggle && navLinksEl){
    navToggle.addEventListener('click', ()=>{
      navLinksEl.classList.toggle('open');
      navToggle.classList.toggle('open');
    });
    navLinksEl.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', ()=> {
        navLinksEl.classList.remove('open');
        navToggle.classList.remove('open');
      });
    });
    // tapping outside the open menu closes it
    document.addEventListener('click', (e)=>{
      if(!navLinksEl.classList.contains('open')) return;
      if(navLinksEl.contains(e.target) || navToggle.contains(e.target)) return;
      navLinksEl.classList.remove('open');
      navToggle.classList.remove('open');
    });
  }

  /* ---- highlight current page in the nav (multi-page site) ---- */
  (function(){
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navlinks a').forEach(a=>{
      const href = a.getAttribute('href');
      if(href === current){ a.classList.add('active'); }
    });
  })();

  /* ---- scroll progress bar (top of viewport) ---- */
  (function(){
    const bar = document.getElementById('scrollProgressBar');
    if(!bar) return;
    function update(){
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (scrollTop/max)*100 : 0;
      bar.style.width = pct + '%';
    }
    document.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    update();
  })();

  /* ---- back-to-top button ---- */
  (function(){
    const btn = document.getElementById('backToTop');
    if(!btn) return;
    function toggle(){
      if(window.scrollY > 480){ btn.classList.add('show'); }
      else{ btn.classList.remove('show'); }
    }
    document.addEventListener('scroll', toggle, {passive:true});
    btn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
    toggle();
  })();

  /* ---- toast notifications (used by the copy-to-clipboard helper) ---- */
  function showToast(message){
    const holder = document.getElementById('toastContainer');
    if(!holder) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    holder.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=>{
      t.classList.remove('show');
      setTimeout(()=> t.remove(), 300);
    }, 2200);
  }

  /* ---- auto-add a "copy" chip next to any Discord invite text ---- */
  (function(){
    const INVITE = 'discord.gg/svNHAwzr2X';
    document.querySelectorAll('p, span').forEach(el=>{
      if(el.dataset.copyEnhanced) return;
      if(el.children.length) return; // only plain text nodes, avoid double-wrapping
      if(!el.textContent.includes(INVITE)) return;
      el.dataset.copyEnhanced = '1';
      el.classList.add('copy-line');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.title = 'คัดลอกลิงก์คำเชิญ';
      btn.innerHTML = '📋';
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const text = 'https://' + INVITE;
        const done = ()=>{ btn.classList.add('copied'); showToast('คัดลอกลิงก์ Discord แล้ว'); setTimeout(()=>btn.classList.remove('copied'), 1200); };
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          done();
        }
      });
      el.appendChild(btn);
    });
  })();

  /* ---- lightbox: click to enlarge key illustration images ---- */
  (function(){
    const selectors = '.flower-card img, .uniform-img-wrap img, .hero-seal img';
    const targets = document.querySelectorAll(selectors);
    if(!targets.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<button class="lightbox-close" aria-label="ปิด">&times;</button><img class="lightbox-img" alt="">';
    document.body.appendChild(overlay);
    const bigImg = overlay.querySelector('.lightbox-img');

    function open(src, alt){
      bigImg.src = src;
      bigImg.alt = alt || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close(){
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
    overlay.querySelector('.lightbox-close').addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });

    targets.forEach(img=>{
      img.classList.add('zoomable');
      img.addEventListener('click', ()=> open(img.currentSrc || img.src, img.alt));
    });
  })();

  /* ---- ship's wheel <-> IB subject group sync (hover + click/tap) ---- */
  const groupItems = document.querySelectorAll('.group-item');
  const spokes = document.querySelectorAll('.wheel-spoke');
  const wheelLabels = document.querySelectorAll('.wheel-label');
  function highlightSpoke(n){
    spokes.forEach(s=>s.classList.toggle('hl', s.dataset.spoke===n));
    wheelLabels.forEach(l=>l.classList.toggle('hl', l.dataset.spoke===n));
    groupItems.forEach(g=>g.classList.toggle('active', g.dataset.spoke===n));
  }
  groupItems.forEach(item=>{
    item.addEventListener('mouseenter', ()=>highlightSpoke(item.dataset.spoke));
    item.addEventListener('mouseleave', ()=>highlightSpoke(null));
    item.addEventListener('click', ()=>highlightSpoke(item.dataset.spoke));
  });
  // clicking/tapping a spoke or its label on the wheel also highlights
  // the matching subject group and scrolls it into view — useful on
  // touch devices where hover doesn't exist.
  document.querySelectorAll('.wheel-spoke, .wheel-label').forEach(el=>{
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>{
      const n = el.dataset.spoke;
      highlightSpoke(n);
      const match = document.querySelector('.group-item[data-spoke="'+n+'"]');
      if(match) match.scrollIntoView({behavior:'smooth', block:'center'});
    });
  });

  /* ---- gentle tilt on symbol / track cards — mouse AND touch-drag ---- */
  document.querySelectorAll('.symbol-card, .track-card').forEach(card=>{
    function tiltFromPoint(clientX, clientY){
      const r = card.getBoundingClientRect();
      const x = (clientX - r.left)/r.width - 0.5;
      const y = (clientY - r.top)/r.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg) translateY(-3px)`;
    }
    card.addEventListener('mousemove', (e)=> tiltFromPoint(e.clientX, e.clientY));
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
    card.addEventListener('touchstart', (e)=>{
      if(e.touches[0]) tiltFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive:true});
    card.addEventListener('touchmove', (e)=>{
      if(e.touches[0]) tiltFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive:true});
    card.addEventListener('touchend', ()=>{ card.style.transform=''; });
  });

  /* ---- hero seal subtle parallax follow (mouse + touch) ---- */
  const heroSeal = document.querySelector('.hero-seal');
  const heroEl = document.querySelector('.hero');
  if(heroSeal && heroEl){
    function parallaxFromPoint(clientX, clientY){
      const r = heroEl.getBoundingClientRect();
      const x = (clientX - r.left)/r.width - 0.5;
      const y = (clientY - r.top)/r.height - 0.5;
      heroSeal.style.transform = `translate(${(x*14).toFixed(1)}px, ${(y*14).toFixed(1)}px)`;
    }
    heroEl.addEventListener('mousemove', (e)=> parallaxFromPoint(e.clientX, e.clientY));
    heroEl.addEventListener('mouseleave', ()=>{ heroSeal.style.transform=''; });
    heroEl.addEventListener('touchmove', (e)=>{
      if(e.touches[0]) parallaxFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive:true});
    heroEl.addEventListener('touchend', ()=>{ heroSeal.style.transform=''; });
  }

  /* ---- marquee: hover pauses on desktop, tap toggles pause on touch ---- */
  (function(){
    const marquee = document.querySelector('.marquee');
    if(!marquee) return;
    marquee.addEventListener('click', ()=> marquee.classList.toggle('tap-paused'));
  })();

  /* ---- rules page: per-card accordion + expand/collapse-all ---- */
  (function(){
    const toggles = document.querySelectorAll('.rule-toggle');
    if(!toggles.length) return;
    toggles.forEach(h=>{
      h.addEventListener('click', ()=>{
        h.closest('.rule-card').classList.toggle('collapsed');
        syncToggleAllLabel();
      });
    });
    const toggleAllBtn = document.getElementById('rulesToggleAll');
    function syncToggleAllLabel(){
      if(!toggleAllBtn) return;
      const cards = document.querySelectorAll('.rule-card');
      const allCollapsed = Array.from(cards).every(c=>c.classList.contains('collapsed'));
      const label = toggleAllBtn.querySelector('.label') || toggleAllBtn;
      toggleAllBtn.dataset.state = allCollapsed ? 'collapsed' : 'expanded';
      toggleAllBtn.childNodes[toggleAllBtn.childNodes.length-1].textContent = allCollapsed ? ' ขยายทั้งหมด' : ' ย่อทั้งหมด';
    }
    if(toggleAllBtn){
      toggleAllBtn.addEventListener('click', ()=>{
        const cards = document.querySelectorAll('.rule-card');
        const allCollapsed = Array.from(cards).every(c=>c.classList.contains('collapsed'));
        cards.forEach(c=>c.classList.toggle('collapsed', !allCollapsed));
        syncToggleAllLabel();
      });
    }
  })();

  /* ---- mascot pills: tap to wiggle (symbols page) ---- */
  document.querySelectorAll('.mascot-pill').forEach(pill=>{
    pill.style.cursor = 'pointer';
    pill.addEventListener('click', ()=>{
      pill.classList.remove('bounce');
      void pill.offsetWidth; // restart animation
      pill.classList.add('bounce');
    });
  });

  /* ---- drifting amaranth petals in the symbols section ---- */
  const petalField = document.getElementById('petalField');
  if(petalField){
    function spawnPetal(){
      const p = document.createElement('div');
      p.className='petal';
      p.style.left = Math.random()*100+'%';
      p.style.setProperty('--drift', (Math.random()*80-40)+'px');
      p.style.animationDuration = (7+Math.random()*6)+'s';
      p.style.width = p.style.height = (7+Math.random()*7)+'px';
      p.style.background = Math.random()>0.5 ? '#C23B7A' : '#F0C94B';
      petalField.appendChild(p);
      setTimeout(()=>p.remove(), 14000);
    }
    for(let i=0;i<6;i++) setTimeout(spawnPetal, i*900);
    setInterval(spawnPetal, 1400);
  }

function showToast(message) {
  var holder = document.getElementById('toastContainer');
  if (!holder) return;
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  holder.appendChild(t);
  requestAnimationFrame(function() { t.classList.add('show'); });
  setTimeout(function() {
    t.classList.remove('show');
    setTimeout(function() { t.remove(); }, 300);
  }, 2200);
}
/* ---------- 14. MUSIC PLAYER (เล่นต่อเนื่องทุกหน้า - ใช้ localStorage) ---------- */
(function() {
  // ✅ ไฟล์เพลงอยู่ที่ assets/NAV-School-Anthem.mp3
  var MUSIC_URL = 'assets/NAV-School-Anthem.mp3';
  
  // ✅ ใช้ Audio ที่แชร์กันทั้งเว็บ (ถ้ามีอยู่แล้วจากหน้าเดิม ก็ใช้ตัวเดิม)
  if (!window._navAudio) {
    window._navAudio = new Audio();
    window._navAudio.loop = true;
    window._navAudio.volume = 0.3;
    window._navAudio.preload = 'auto';
    window._navAudio.src = MUSIC_URL;
    window._navAudio.load();
  }
  
  var audio = window._navAudio;
  
  // สร้างปุ่ม (จะสร้างใหม่ทุกหน้า แต่สถานะเพลงจะจำได้)
  var btn = document.createElement('button');
  btn.className = 'music-btn';
  document.body.appendChild(btn);
  
  // CSS
  var style = document.createElement('style');
  style.textContent = `
    .music-btn {
      position: fixed;
      right: 16px;
      bottom: 70px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #1E2A4A;
      color: #F7DE87;
      border: 2px solid #F0C94B;
      font-size: 1.4rem;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      -webkit-tap-highlight-color: transparent;
    }
    .music-btn.playing { background: #F0C94B; color: #1E2A4A; }
    .music-btn.error { background: #B23A3A; color: #fff; }
  `;
  document.head.appendChild(style);
  
  // สถานะ
  var isPlaying = false;
  
  // ฟังก์ชันอัปเดต UI
  function updateBtnUI() {
    if (isPlaying) {
      btn.classList.add('playing');
      btn.innerHTML = '⏸️';
    } else {
      btn.classList.remove('playing');
      btn.innerHTML = '🎵';
    }
  }
  
  // ฟังก์ชันเริ่มเล่น
  function startMusic() {
    audio.play().then(function() {
      isPlaying = true;
      localStorage.setItem('navMusicPlaying', 'true');
      updateBtnUI();
    }).catch(function(err) {
      console.error('Music Error:', err);
      btn.classList.add('error');
      btn.innerHTML = '❌';
      localStorage.removeItem('navMusicPlaying');
      setTimeout(function() {
        btn.classList.remove('error');
        updateBtnUI();
      }, 2000);
    });
  }
  
  // ฟังก์ชันหยุด
  function stopMusic() {
    audio.pause();
    isPlaying = false;
    localStorage.removeItem('navMusicPlaying');
    updateBtnUI();
  }
  
  // ฟังก์ชัน toggle
  function toggleMusic() {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }
  
  btn.addEventListener('click', toggleMusic);
  
  // ✅ ตรวจสอบ localStorage: ถ้าเคยเปิดเพลงไว้ ให้เล่นต่อทันที
  var shouldAutoPlay = localStorage.getItem('navMusicPlaying') === 'true';
  
  if (shouldAutoPlay) {
    isPlaying = true;
    // ลองเล่นต่อ
    audio.play().then(function() {
      updateBtnUI();
    }).catch(function() {
      // ถ้าเล่นไม่ได้ (เช่น เบราว์เซอร์บล็อก) ให้อัปเดต UI
      isPlaying = false;
      localStorage.removeItem('navMusicPlaying');
      updateBtnUI();
    });
  } else {
    updateBtnUI();
  }
  
  // แสดงข้อความแนะนำ (เฉพาะครั้งแรก)
  if (!localStorage.getItem('navMusicHintShown')) {
    setTimeout(function() {
      showToast('🎵 กดปุ่มเพลงเพื่อเริ่มฟัง');
      localStorage.setItem('navMusicHintShown', 'true');
    }, 2000);
  }
  
  // ✅ ฟัง event เมื่อเพลงหยุดโดยไม่ตั้งใจ (เช่น เบราว์เซอร์ pause)
  audio.addEventListener('pause', function() {
    if (!audio.ended) {
      // ถ้าไม่ใช่การหยุดโดยผู้ใช้ ให้อัปเดต UI
      if (!btn.classList.contains('playing')) return;
      isPlaying = false;
      localStorage.removeItem('navMusicPlaying');
      updateBtnUI();
    }
  });
  
})();

// data tab //
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.utab');
  const panels = document.querySelectorAll('.upanel');
  const mainImage = document.getElementById('uniform-img');

  // จับคู่ data-tab กับชื่อไฟล์รูปภาพ
  const imageMap = {
    'senior-girl': 'assets/uniform.png',
    'senior-boy': 'assets/uniform.png',
    'junior-girl': 'assets/Middleschooler.jpg',
    'junior-boy': 'assets/Middleschooler.jpg',
    'pe-uniform': 'assets/activities.jpg',
    'event-outfit': 'assets/events.jpg'
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // 1. เปลี่ยน Active Class ของ แท็บ และ แผงเนื้อหา
      tabs.forEach(t => t.classList.remove('on'));
      panels.forEach(p => p.classList.remove('on'));

      tab.classList.add('on');
      document.getElementById(targetTab)?.classList.add('on');

      // 2. เปลี่ยนรูปภาพตามแท็บที่กด
      if (imageMap[targetTab] && mainImage) {
        mainImage.src = imageMap[targetTab];
      }
    });
  });
});
