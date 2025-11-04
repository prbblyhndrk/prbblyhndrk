// Improved script.js for seamless film scroller without black gaps
(function(){
  function wireMenu(btnId, menuId){
    var btn = document.getElementById(btnId);
    var menu = document.getElementById(menuId);
    if(!btn || !menu) return;
    btn.addEventListener('click', function(){
      menu.classList.toggle('open');
      menu.setAttribute('aria-hidden', !menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); });
    });
  }
  wireMenu('menuBtn','sideMenu');
  wireMenu('menuBtnHu','sideMenuHu');
  wireMenu('menuBtnImp','sideMenuImp');
  wireMenu('menuBtnSocial','sideMenuSocial');

  function safeUrl(name){ return encodeURI(name); }

  // improved film scroller
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

    var children = Array.prototype.slice.call(track.children);
    children.forEach(function(c){ track.appendChild(c.cloneNode(true)); });

    var speed = 0.05;
    var pos = 0;
    var playing = true;
    var totalWidth = 0;

    function calcTotal(){
      totalWidth = 0;
      track.querySelectorAll('.film-item').forEach(function(i){ totalWidth += i.offsetWidth + 12; });
      totalWidth = totalWidth / 2; // since duplicated
    }
    window.addEventListener('resize', calcTotal);
    window.addEventListener('load', calcTotal);
    calcTotal();

    function step(){
      if(playing){
        pos += speed * 16; // assuming ~60fps
        if(pos >= totalWidth) pos = 0;
        track.style.transform = 'translateX(' + (-pos) + 'px)';
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    track.querySelectorAll('.film-item').forEach(function(item){
      var img = item.querySelector('img');
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
        var url = safeUrl(img.getAttribute('data-src') || img.src);
        var a = document.createElement('a');
        a.href = url;
        a.download = decodeURIComponent(url.split('/').pop());
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    });
  })();
})();