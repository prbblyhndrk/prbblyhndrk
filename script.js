// script.js – final, bereinigt
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

    Array.prototype.slice.call(menu.querySelectorAll('a')).forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }, {passive:true});
      a.addEventListener('touchstart', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }, {passive:true});
    });
  }

  // wire known menu buttons
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
    if(!grid) return;
    try{
      var res = await fetch(txtFile + '?v=' + Date.now());
      if(!res.ok) throw new Error('File not found: '+txtFile);
      var txt = await res.text();
      var lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
      grid.innerHTML = '';
      lines.forEach(function(name){
        const div = document.createElement('div');
        div.className = 'card';

        let media;
        if (name.toLowerCase().endsWith('.mp4')) {
          media = document.createElement('video');
          media.src = safeUrl(name);
          media.muted = true;
          media.loop = true;
          media.preload = 'metadata';
          media.playsInline = true;
          media.autoplay = false;

          const playIcon = document.createElement('div');
          playIcon.className = 'play-overlay';
          playIcon.textContent = '▶';

          media.addEventListener('mouseenter', ()=>media.play());
          media.addEventListener('mouseleave', ()=>media.pause());

          div.appendChild(media);
          div.appendChild(playIcon);
        } else {
          media = document.createElement('img');
          media.src = safeUrl(name);
          media.alt = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g,' ');
          div.appendChild(media);
        }

        // On justart: no download button
        if (!window.location.href.includes('justart')) {
          // Mobile vs Desktop: mobile opens in new tab to allow save-to-photos
          const a = document.createElement('a');
          a.className = 'download-btn';
          a.href = safeUrl(name);
          a.textContent = 'download';
          // On desktop force download attribute
          if(!/Mobi|Android/i.test(navigator.userAgent)){
            a.download = name;
          } else {
            a.target = '_blank';
          }
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
    const slider = document.getElementById('filmTrack');
    if(!slider) return;

    try {
      const res = await fetch('images-phone.txt?v=' + Date.now());
      if(!res.ok) throw new Error('File not found: images-phone.txt');
      const txt = await res.text();
      const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);

      slider.innerHTML = '';
      lines.forEach(name => {
        const item = document.createElement('div');
        item.className = 'film-item';
        const img = document.createElement('img');
        img.src = safeUrl(name);
        img.alt = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g,' ');
        img.onload = () => img.classList.add('loaded');
        item.appendChild(img);
        slider.appendChild(item);
      });
    } catch(err) {
      console.error('Fehler beim Laden der Slider-Bilder:', err);
    }
  }

  // ---------- Film scroller ----------
  function initFilmScroller(){
    var track = document.getElementById('filmTrack');
    if(!track) return;

    try { track.style.transform = ''; } catch(e){}

    var imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
    var pending = imgs.length;

    if(pending > 0){
      // wait until images loaded (loaded class)
      var checkLoaded = setInterval(function(){
        var loaded = track.querySelectorAll('img.loaded').length;
        if(loaded >= pending){
          clearInterval(checkLoaded);
          doInit();
        }
      }, 100);
    } else {
      setTimeout(doInit, 10);
    }

    function doInit(){
      var children = Array.prototype.slice.call(track.children || []);
      if(children.length === 0) return;

      // Duplicate originals for seamless loop
      var originals = children.slice(0);
      originals.forEach(function(c){ track.appendChild(c.cloneNode(true)); });

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

      var heartbeat = setInterval(function(){
        var now = performance.now();
        if(now - lastRaf > 300 && playing && totalWidth>0){
          var dt = Math.min(now - lastRaf, 500);
          pos += speed * dt;
          if(pos >= totalWidth) pos = pos - totalWidth;
          track.style.transform = 'translateX(' + (-pos) + 'px)';
          lastRaf = now;
        }
      }, 200);

      // hover overlay and pause
      track.querySelectorAll('.film-item').forEach(function(item){
        var img = item.querySelector('img, video');
        if(!img) return;
        if(item._hoverAttached) return;
        item._hoverAttached = true;

        var overlay = item.querySelector('.download-overlay');
        if(!overlay){
          overlay = document.createElement('div');
          overlay.className = 'download-overlay';
          overlay.textContent = (location.pathname === '/' || location.pathname.endsWith('index.html')) ? 'check menu for more' : 'download';
          item.appendChild(overlay);
        }

        item.addEventListener('mouseenter', function(){ playing=false; overlay.classList.add('visible'); }, {passive:true});
        item.addEventListener('mouseleave', function(){ playing=true; overlay.classList.remove('visible'); }, {passive:true});
        item.addEventListener('touchstart', function(){ playing=false; overlay.classList.add('visible'); }, {passive:true});
        item.addEventListener('touchend', function(){ setTimeout(function(){ playing=true; overlay.classList.remove('visible'); }, 300); }, {passive:true});

        if(! (location.pathname === '/' || location.pathname.endsWith('index.html')) ){
          item.addEventListener('click', function(e){
            e.preventDefault();
            var raw = item.querySelector('img') ? (item.querySelector('img').getAttribute('src') || '') : '';
            if(!raw) return;
            var a = document.createElement('a');
            a.href = safeUrl(raw);
            if(!/Mobi|Android/i.test(navigator.userAgent)){
              a.download = decodeURIComponent(a.href.split('/').pop());
            } else {
              a.target = '_blank';
            }
            document.body.appendChild(a); a.click(); a.remove();
          }, {passive:false});
        }
      });

      window.addEventListener('beforeunload', function(){ clearInterval(heartbeat); });
    } // doInit
  } // initFilmScroller

  // ---------- call loaders on DOM ready ----------
  document.addEventListener('DOMContentLoaded', async function(){
    await loadSliderImages();
    initFilmScroller();
    loadListToGrid('images-phone.txt', 'phoneGrid');
    loadListToGrid('images-desktop.txt', 'desktopGrid');
    loadListToGrid('images-justart.txt', 'justartGrid');
  });

})(); // main end
