// script.js - robust seamless scroller, menu wiring, overlays and downloads
(function(){
  function wireMenu(btnId, menuId){
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if(!btn || !menu) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
    });
    Array.prototype.slice.call(menu.querySelectorAll('a')).forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); });
    });
  }
  wireMenu('menuBtn','sideMenu');
  wireMenu('menuBtnHu','sideMenuHu');
  wireMenu('menuBtnImp','sideMenuImp');
  wireMenu('menuBtnSocial','sideMenuSocial');
  wireMenu('menuBtnPhone','sideMenuPhone');
  wireMenu('menuBtnDesktop','sideMenuDesktop');

  function safeUrl(name){ return encodeURI(name); }

  (function(){
    var track = document.getElementById('filmTrack');
    if(!track) return;
    var imgs = track.querySelectorAll('img[data-src]');
    imgs.forEach(function(img){
      var src = img.getAttribute('data-src');
      img.src = safeUrl(src);
      img.style.opacity = 0;
      img.addEventListener('load', function(){ img.classList.add('loaded'); img.style.opacity = ''; });
    });

    var originalChildren = Array.prototype.slice.call(track.children);
    originalChildren.forEach(function(c){ track.appendChild(c.cloneNode(true)); });

    var totalWidth = 0;
    function calcTotal(){
      totalWidth = 0;
      var children = track.querySelectorAll('.film-item');
      var half = Math.floor(children.length / 2);
      for(var i=0;i<half;i++){
        totalWidth += children[i].offsetWidth + 12;
      }
    }
    window.addEventListener('load', calcTotal);
    window.addEventListener('resize', calcTotal);
    calcTotal();

    var speed = 0.04;
    var pos = 0;
    var playing = true;

    function step(ts){
      if(!step.last) step.last = ts;
      var dt = ts - step.last;
      step.last = ts;
      if(playing && totalWidth > 0){
        pos += speed * dt;
        if(pos >= totalWidth) pos = pos - totalWidth;
        track.style.transform = 'translateX(' + (-pos) + 'px)';
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

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

      item.addEventListener('mouseenter', function(){
        playing = false;
        overlay.classList.add('visible');
      });
      item.addEventListener('mouseleave', function(){
        playing = true;
        overlay.classList.remove('visible');
      });

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
        });
      }
    });
  })();
})();
