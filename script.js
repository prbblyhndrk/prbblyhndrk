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
  ['menuBtn','menuBtnHu','menuBtnImp','menuBtnSocial','menuBtnPhone','menuBtnDesktop'].forEach(function(id){
    var map = {
      'menuBtn':'sideMenu',
      'menuBtnHu':'sideMenuHu',
      'menuBtnImp':'sideMenuImp',
      'menuBtnSocial':'sideMenuSocial',
      'menuBtnPhone':'sideMenuPhone',
      'menuBtnDesktop':'sideMenuDesktop'
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
        var div = document.createElement('div');
        div.className = 'card';
        var img = document.createElement('img');
        img.src = safeUrl(name);
        img.alt = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g,' ');
        var a = document.createElement('a');
        a.className = 'download-btn';
        a.href = safeUrl(name);
        a.download = name;
        a.textContent = 'Download';
        div.appendChild(img);
        div.appendChild(a);
        grid.appendChild(div);
      });
    }catch(err){
      console.error('Fehler beim Laden von', txtFile, err);
      var p = document.createElement('p');
      p.textContent = 'Fehler beim Laden der Bildliste.';
      grid.appendChild(p);
    }
  }

  // call loaders on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    loadListToGrid('images-phone.txt', 'phoneGrid');
    loadListToGrid('images-desktop.txt', 'desktopGrid');
    loadListToGrid('images-justart.txt', 'justartGrid');
  });

  // ---------- Film scroller for homepage ----------
  (function(){
    var track = document.getElementById('filmTrack');
    if(!track) return;

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
