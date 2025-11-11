// script.js - Edge/touch fixes: touchstart on menu buttons + robust rAF scroller with heartbeat fallback
(function(){
  // ---- utility
  function safeUrl(name){ return encodeURI(name || ''); }

  // ---- menu wiring (click + touchstart to capture touch devices reliably)
  function wireMenu(btnId, menuId){
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if(!btn || !menu) return;

    function toggle(e){
      if(e && e.type === 'touchstart'){ e.preventDefault(); }
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
    }

    btn.addEventListener('click', toggle, {passive:true});
    btn.addEventListener('touchstart', toggle, {passive:false});

    // close menu when a link is clicked/touched
    Array.prototype.slice.call(menu.querySelectorAll('a')).forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }, {passive:true});
      a.addEventListener('touchstart', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); }, {passive:true});
    });
  }

  // expected mappings (keeps backwards compatibility with different IDs)
  wireMenu('menuBtn','sideMenu');
  wireMenu('menuBtnHu','sideMenuHu');
  wireMenu('menuBtnImp','sideMenuImp');
  wireMenu('menuBtnSocial','sideMenuSocial');
  wireMenu('menuBtnPhone','sideMenuPhone');
  wireMenu('menuBtnDesktop','sideMenuDesktop');

  // ---- scroller (seamless loop)
  (function(){
    var track = document.getElementById('filmTrack');
    if(!track) return;

    // prepare images: set src from data-src, track loaded count
    var imgs = Array.prototype.slice.call(track.querySelectorAll('img[data-src]'));
    var pending = imgs.length;
    if(pending === 0){
      // nothing to do
      initScroller();
    } else {
      imgs.forEach(function(img){
        var src = img.getAttribute('data-src');
        img.src = safeUrl(src);
        img.style.opacity = 0;
        img.addEventListener('load', function onload(){
          img.removeEventListener('load', onload);
          img.classList.add('loaded');
          img.style.opacity = '';
          pending--;
          // small debounce: when all loaded init scroller
          if(pending <= 0) setTimeout(initScroller, 10);
        }, {passive:true});
        // also handle error so pending won't hang forever
        img.addEventListener('error', function onerr(){
          img.removeEventListener('error', onerr);
          pending--;
          img.classList.add('loaded'); // avoid stuck
          if(pending <= 0) setTimeout(initScroller, 10);
        }, {passive:true});
      });
    }

    function initScroller(){
      // duplicate original children for smooth loop
      var originalChildren = Array.prototype.slice.call(track.children);
      originalChildren.forEach(function(c){ track.appendChild(c.cloneNode(true)); });

      // ensure track has will-change to hint rendering engines
      track.style.willChange = 'transform';

      // compute total width (measure first half - original set)
      var totalWidth = 0;
      function calcTotal(){
        totalWidth = 0;
        var children = track.querySelectorAll('.film-item');
        var half = Math.floor(children.length / 2) || children.length;
        for(var i=0;i<half;i++){
          // if offsetWidth is 0 (rare), fallback to 280
          var w = children[i].offsetWidth || 280;
          totalWidth += w + 12; // gap fudge (matches CSS)
        }
      }
      // initial calc and on resize
      calcTotal();
      window.addEventListener('resize', function(){ calcTotal(); });

      // animation variables
      var speed = 0.04; // px per ms
      var pos = 0;
      var playing = true;

      // expose playing for dev console / external toggles if needed
      window._filmPlaying = playing;

      // heartbeat fallback: ensure rAF doesn't stall (Edge mobile sometimes throttles)
      var lastRaf = performance.now();
      var rafRunning = false;
      function step(timestamp){
        rafRunning = true;
        if(!step.last) step.last = timestamp;
        var dt = timestamp - step.last;
        step.last = timestamp;
        lastRaf = timestamp;

        if(playing && totalWidth > 0){
          pos += speed * dt;
          if(pos >= totalWidth) pos = pos - totalWidth;
          track.style.transform = 'translateX(' + (-pos) + 'px)';
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      // fallback interval: if rAF didn't run for > 300ms, nudge a step to keep UI alive
      var heartbeat = setInterval(function(){
        var now = performance.now();
        if(now - lastRaf > 300){
          // call a synthetic step to keep things moving
          try{
            if(playing && totalWidth > 0){
              // use a safe small dt
              var dt = Math.min(now - lastRaf, 500);
              pos += speed * dt;
              if(pos >= totalWidth) pos = pos - totalWidth;
              track.style.transform = 'translateX(' + (-pos) + 'px)';
              lastRaf = now;
            }
          }catch(e){
            // swallow
          }
        }
      }, 200);

      // hover + touch pause and overlay logic
      var isHome = (location.pathname === '/' || location.pathname.endsWith('index.html'));
      var overlayHome = 'check menu for more';
      var overlayOther = 'click to download';

      Array.prototype.slice.call(track.querySelectorAll('.film-item')).forEach(function(item){
        var img = item.querySelector('img');
        if(!img) return;

        var overlay = document.createElement('div');
        overlay.className = 'download-overlay';
        overlay.textContent = isHome ? overlayHome : overlayOther;
        item.appendChild(overlay);

        // mouse events
        item.addEventListener('mouseenter', function(){
          playing = false; window._filmPlaying = false; overlay.classList.add('visible');
        }, {passive:true});
        item.addEventListener('mouseleave', function(){
          playing = true; window._filmPlaying = true; overlay.classList.remove('visible');
        }, {passive:true});

        // touch events for mobile (tap to pause/show overlay; tap again handled below)
        item.addEventListener('touchstart', function(e){
          // stop movement and show overlay
          playing = false; window._filmPlaying = false; overlay.classList.add('visible');
        }, {passive:true});
        item.addEventListener('touchend', function(e){
          // small delay: keep paused for a bit so user can press download
          setTimeout(function(){
            playing = true; window._filmPlaying = true; overlay.classList.remove('visible');
          }, 350);
        }, {passive:true});

        // clicks only trigger downloads on non-home pages
        if(!isHome){
          item.addEventListener('click', function(e){
            e.preventDefault();
            var raw = img.getAttribute('data-src') || img.src;
            var url = safeUrl(raw);
            var a = document.createElement('a');
            a.href = url;
            a.download = decodeURIComponent(url.split('/').pop());
            document.body.appendChild(a);
            a.click();
            a.remove();
          }, {passive:false});
          // touch tap also triggers same (for devices that don't fire click reliably)
          item.addEventListener('touchend', function(e){
            // guard: if target is a link or interactive element, ignore
            var raw = img.getAttribute('data-src') || img.src;
            var url = safeUrl(raw);
            var a = document.createElement('a');
            a.href = url;
            a.download = decodeURIComponent(url.split('/').pop());
            document.body.appendChild(a);
            a.click();
            a.remove();
          }, {passive:true});
        }
      });

      // cleanup on page unload (stop heartbeat)
      window.addEventListener('beforeunload', function(){ clearInterval(heartbeat); });
    } // initScroller end
  })(); // scroller IIFE end

})(); // main IIFE end
