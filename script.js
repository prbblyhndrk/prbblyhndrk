// script.js - handles menu toggle, film scroller, lazy load, hover/download overlay
(function(){
  // Menu toggle generic
  function wireMenu(btnId, menuId){
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if(!btn || !menu) return;
    btn.addEventListener('click', function(){
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
    });
    // close on link click
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); });
    });
  }
  wireMenu('menuBtn','sideMenu');
  wireMenu('menuBtnHu','sideMenuHu');
  wireMenu('menuBtnImp','sideMenuImp');
  wireMenu('menuBtnSocial','sideMenuSocial');

  // safe url encode
  function safeUrl(name){ return encodeURI(name); }

  // film scroller
  (function(){
    var track = document.getElementById('filmTrack');
    if(!track) return;
    // set src from data-src
    var imgs = track.querySelectorAll('img[data-src]');
    imgs.forEach(function(img){
      var src = img.getAttribute('data-src');
      img.src = safeUrl(src);
      // fade-in when loaded
      img.style.opacity = 0;
      img.addEventListener('load', function(){ img.classList.add('loaded'); img.style.opacity = ''; });
    });

    // duplicate children to allow seamless loop
    var children = Array.prototype.slice.call(track.children);
    children.forEach(function(c){ track.appendChild(c.cloneNode(true)); });

    var speed = 0.06; // pixels per ms
    var pos = 0;
    var last = performance.now();
    var playing = true;

    function step(now){
      var dt = now - last;
      last = now;
      if(playing){
        pos += speed * dt;
        var total = track.scrollWidth / 2; // half because duplicated
        if(pos >= total) pos = pos - total; // subtract to avoid jump
        track.style.transform = 'translateX(' + (-pos) + 'px)';
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // hover/pause and overlay + click-to-download
    track.querySelectorAll('.film-item').forEach(function(item){
      var img = item.querySelector('img');
      if(!img) return;
      var overlay = document.createElement('div');
      overlay.className = 'download-overlay';
      overlay.textContent = 'Click to download';
      item.appendChild(overlay);

      item.addEventListener('mouseenter', function(){
        playing = false;
        overlay.classList.add('visible');
      });
      item.addEventListener('mouseleave', function(){
        playing = true;
        overlay.classList.remove('visible');
      });
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
      });
      // touch support: tap toggles pause/show overlay
      item.addEventListener('touchstart', function(){ playing = false; overlay.classList.add('visible'); }, {passive:true});
      item.addEventListener('touchend', function(){ playing = true; overlay.classList.remove('visible'); }, {passive:true});
    });
  })();

  // ensure logo banner covers full width without gaps (handled by CSS)
})();
