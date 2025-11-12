// script.js - erweitert: auto-load für phone/desktop/justart lists + menu/touch fixes + scroller
(function(){
  function safeUrl(name){ return encodeURI(name || ''); }

  // wire menu (click + touch)
  function wireMenu(btnId, menuId){
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if(!btn || !menu) return;
    function toggle(e){
      if(e && e.type === 'touchstart') e.preventDefault();
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
    }
    btn.addEventListener('click', toggle, {passive:true});
    btn.addEventListener('touchstart', toggle, {passive:false});
    // close on link interaction
    Array.prototype.slice.call(menu.querySelectorAll('a')).forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }, {passive:true});
      a.addEventListener('touchstart', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }, {passive:true});
    });
  }

  // wire the known menu buttons
  ['menuBtn','menuBtnHu','menuBtnImp','menuBtnSocial','menuBtnPhone','menuBtnDesktop','menuBtnJust'].forEach(function(id){
    var map = {
      'menuBtn':'sideMenu',
      'menuBtnHu':'sideMenuHu',
      'menuBtnImp':'sideMenuImp',
      'menuBtnSocial':'sideMenuSocial',
      'menuBtnPhone':'sideMenuPhone',
      'menuBtnDesktop':'sideMenuDesktop',
      'menuBtnJust':'sideMenuJust' 
    };
    wireMenu(id, map[id]);
  });

// ---------- Auto-load lists for category pages ----------
async function loadListToGrid(txtFile, gridId){
  var grid = document.getElementById(gridId);
  if(!grid) return; // not on this page
  try{
    var res = await fetch(txtFile + '?v=' + Date.now());
    if(!res.ok) throw new Error('File not found: '+txtFile);
    var txt = await res.text();
    var lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
    // clear existing content
    grid.innerHTML = '';
    lines.forEach(function(name){
      const div = document.createElement('div');
      div.className = 'card';

      let media;
      if (name.toLowerCase().endsWith('.mp4')) {
        // VIDEO-Element
        media = document.createElement('video');
        media.src = safeUrl(name);
        media.muted = true;
        media.loop = true;
        media.preload = 'metadata';
        media.playsInline = true;
        media.autoplay = false;

        // Play-Overlay
        const playIcon = document.createElement('div');
        playIcon.className = 'play-overlay';
        playIcon.textContent = '▶';

        // Hover-Steuerung
        media.addEventListener('mouseenter', () => media.play());
        media.addEventListener('mouseleave', () => media.pause());

        div.appendChild(media);
        div.appendChild(playIcon);
      } else {
        // BILD-Element
        media = document.createElement('img');
        media.src = safeUrl(name);
        media.alt = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g,' ');
        div.appendChild(media);
      }

      // Download-Button nur, wenn es NICHT Just-Art ist
      if (!window.location.href.includes('justart')) {
        const a = document.createElement('a');
        a.className = 'download-btn';
        a.href = safeUrl(name);
        a.download = name;
        a.textContent = 'Download';
        div.appendChild(a);
      }

      grid.appendChild(div);
    });
  } catch(err){
    console.error('Fehler beim Laden von', txtFile, err);
    var p = document.createElement('p');
    p.textContent = 'Fehler beim Laden der Bildliste.';
    grid.appendChild(p);
  }
}

  // ---------- Auto-load slider images on homepage ----------
async function loadSliderImages(){
  const slider = document.querySelector('.image-slider');
  if(!slider) return; // nur auf der Startseite

  try {
    const res = await fetch('images-phone.txt?v=' + Date.now());
    if(!res.ok) throw new Error('File not found: images-phone.txt');
    const txt = await res.text();
    const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);

    slider.innerHTML = ''; // leeren
    lines.forEach(name => {
      const img = document.createElement('img');
      img.src = safeUrl(name);
      img.alt = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g,' ');
      slider.appendChild(img);
    });
  } catch(err) {
    console.error('Fehler beim Laden der Slider-Bilder:', err);
  }
}
// ---------- call loaders on DOM ready ----------
document.addEventListener('DOMContentLoaded', async function(){
  await loadSliderImages(); // erst die Bilder für den Slider laden
  initFilmScroller();       // dann den Scroller starten
  loadListToGrid('images-phone.txt', 'phoneGrid');
  loadListToGrid('images-desktop.txt', 'desktopGrid');
  loadListToGrid('images-justart.txt', 'justartGrid');
});

  // ---------- Film scroller for homepage ----------
  // ---------- Film scroller (aufrufbar) ----------
function initFilmScroller(){
  var track = document.getElementById('filmTrack');
  if(!track) return;

  // Falls schon initialisiert: versuche vorheriges state zurückzusetzen (safe)
  try { track.style.transform = ''; } catch(e){}

  // Wenn Bilder bereits mit src vorhanden sind, wir initialisieren direkt
  var imgs = Array.prototype.slice.call(track.querySelectorAll('img[data-src]'));
  var pending = imgs.length;

  if(pending > 0){
    // Lade imgs mit data-src
    imgs.forEach(function(img){
      var src = img.getAttribute('data-src');
      img.src = encodeURI(src || '');
      img.style.opacity = 0;
      img.addEventListener('load', function onload(){
        img.removeEventListener('load', onload);
        img.classList.add('loaded');
        img.style.opacity = '';
        pending--;
        if(pending <= 0) setTimeout(doInit, 10);
      }, {passive:true});
      img.addEventListener('error', function onerr(){
        img.removeEventListener('error', onerr);
        pending--;
        if(pending <= 0) setTimeout(doInit, 10);
      }, {passive:true});
    });
  } else {
    // keine data-src images -> init sofort (z. B. wenn loadSliderImages setzte src direkt)
    setTimeout(doInit, 10);
  }

  function doInit(){
    // falls schon Elemente vorhanden (z.B. vorherige Init), entferne doppelte clones
    // (wir vereinfachen: nur nochmal duplizieren wenn nötig)
    var children = Array.prototype.slice.call(track.children || []);
    if(children.length === 0) return; // nichts zu tun
    // Wenn bereits doppelt vorhanden (prüfe anhand Kind-Anzahl), dann entferne spätere doppelte
    // Einfachheitshalber: wenn mehr als 1 Durchlauf vorhanden, trimm auf original*2
    if(children.length > 0){
      // Ensure single set duplication: if children are not duplicated yet, duplicate them
      var half = Math.floor(children.length / 2);
      // naive check: if first and half+1 exist and same nodeName then assume duplicated — skip
      if(children.length < 2 || !children[0].isEqualNode(children[children.length/2 | 0])){
        // duplicate originals (the current set)
        var originals = children.slice(0);
        originals.forEach(function(c){ track.appendChild(c.cloneNode(true)); });
      }
    }

    // measure and start animation
    var totalWidth = 0;
    function calcTotal(){
      totalWidth = 0;
      var kids = track.querySelectorAll('.film-item');
      var half = Math.floor(kids.length / 2) || kids.length;
      for(var i=0;i<half;i++){
        totalWidth += (kids[i].offsetWidth || 280) + 12;
      }
    }
    calcTotal();
    window.addEventListener('resize', calcTotal);

    var speed = 0.04;
    var pos = 0;
    var playing = true;
    var lastRaf = performance.now();

    function step(ts){
      if(!step.last) step.last = ts;
      var dt = ts - step.last;
      step.last = ts;
      lastRaf = ts;
      if(playing && totalWidth > 0){
        pos += speed * dt;
        if(pos >= totalWidth) pos = pos - totalWidth;
        track.style.transform = 'translateX(' + (-pos) + 'px)';
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // heartbeat fallback for throttled rAF
    var heartbeat = setInterval(function(){
      var now = performance.now();
      if(now - lastRaf > 300 && playing && totalWidth > 0){
        var dt = Math.min(now - lastRaf, 500);
        pos += speed * dt;
        if(pos >= totalWidth) pos = pos - totalWidth;
        track.style.transform = 'translateX(' + (-pos) + 'px)';
        lastRaf = now;
      }
    }, 200);

    // hover overlay behaviour (if not already attached)
    track.querySelectorAll('.film-item').forEach(function(item){
      var img = item.querySelector('img, video');
      if(!img) return;
      if(item._hoverAttached) return;
      item._hoverAttached = true;

      var overlay = item.querySelector('.download-overlay');
      if(!overlay){
        overlay = document.createElement('div');
        overlay.className = 'download-overlay';
        overlay.textContent = (location.pathname === '/' || location.pathname.endsWith('index.html')) ? 'check menu for more' : 'click to download';
        item.appendChild(overlay);
      }

      item.addEventListener('mouseenter', function(){ playing=false; overlay.classList.add('visible'); }, {passive:true});
      item.addEventListener('mouseleave', function(){ playing=true; overlay.classList.remove('visible'); }, {passive:true});
      item.addEventListener('touchstart', function(){ playing=false; overlay.classList.add('visible'); }, {passive:true});
      item.addEventListener('touchend', function(){ setTimeout(function(){ playing=true; overlay.classList.remove('visible'); }, 300); }, {passive:true});
    });

    // cleanup hook: if page unload, clear heartbeat
    window.addEventListener('beforeunload', function(){ clearInterval(heartbeat); });
  } // doInit end
} // initFilmScroller end

    // init images from data-src
    var imgs = Array.prototype.slice.call(track.querySelectorAll('img[data-src]'));
    var pending = imgs.length;
    if(pending===0){ init(); } else {
      imgs.forEach(function(img){
        var src = img.getAttribute('data-src');
        img.src = safeUrl(src);
        img.style.opacity = 0;
        img.addEventListener('load', function onl(){
          img.removeEventListener('load', onl);
          img.classList.add('loaded');
          img.style.opacity = '';
          pending--;
          if(pending<=0) setTimeout(init,10);
        }, {passive:true});
        img.addEventListener('error', function one(){
          img.removeEventListener('error', one);
          pending--;
          if(pending<=0) setTimeout(init,10);
        }, {passive:true});
      });
    }

    function init(){
      // duplicate for seamless loop
      var original = Array.prototype.slice.call(track.children);
      original.forEach(function(c){ track.appendChild(c.cloneNode(true)); });

      // measure width of original set
      var totalWidth = 0;
      function calcTotal(){
        totalWidth = 0;
        var kids = track.querySelectorAll('.film-item');
        var half = Math.floor(kids.length/2) || kids.length;
        for(var i=0;i<half;i++){
          totalWidth += (kids[i].offsetWidth || 280) + 12;
        }
      }
      window.addEventListener('resize', calcTotal);
      calcTotal();

      var pos = 0, speed = 0.04, playing = true;
      window._filmPlaying = playing;
      var lastRaf = performance.now();

      function step(ts){
        if(!step.last) step.last = ts;
        var dt = ts - step.last;
        step.last = ts;
        lastRaf = ts;
        if(playing && totalWidth>0){
          pos += speed * dt;
          if(pos >= totalWidth) pos = pos - totalWidth;
          track.style.transform = 'translateX(' + (-pos) + 'px)';
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      // heartbeat fallback
      setInterval(function(){
        var now = performance.now();
        if(now - lastRaf > 300 && playing && totalWidth>0){
          var dt = Math.min(now - lastRaf, 500);
          pos += speed * dt;
          if(pos >= totalWidth) pos = pos - totalWidth;
          track.style.transform = 'translateX(' + (-pos) + 'px)';
          lastRaf = now;
        }
      }, 200);

      var isHome = (location.pathname === '/' || location.pathname.endsWith('index.html'));
      var overlayHome = 'check menu for more';
      var overlayOther = 'click to download';
      track.querySelectorAll('.film-item').forEach(function(item){
        var img = item.querySelector('img');
        if(!img) return;
        var overlay = document.createElement('div');
        overlay.className = 'download-overlay';
        overlay.textContent = isHome ? overlayHome : overlayOther;
        item.appendChild(overlay);

        item.addEventListener('mouseenter', function(){ playing=false; overlay.classList.add('visible'); }, {passive:true});
        item.addEventListener('mouseleave', function(){ playing=true; overlay.classList.remove('visible'); }, {passive:true});
        item.addEventListener('touchstart', function(){ playing=false; overlay.classList.add('visible'); }, {passive:true});
        item.addEventListener('touchend', function(){ setTimeout(function(){ playing=true; overlay.classList.remove('visible'); }, 300); }, {passive:true});

        if(!isHome){
          item.addEventListener('click', function(e){
            e.preventDefault();
            var raw = img.getAttribute('data-src') || img.src;
            var a = document.createElement('a');
            a.href = safeUrl(raw);
            a.download = decodeURIComponent(a.href.split('/').pop());
            document.body.appendChild(a); a.click(); a.remove();
          }, {passive:false});
        }
      });
    } // init end
  })(); // scroller end

})(); // main end
