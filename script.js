/* =========================
   script.js - Site Logic
   - Menü (open/close, overlay)
   - Menü-Button Farbwechsel abhängig von Banner-Position
   - Grid-Loader (images-phone.txt, images-desktop.txt, images-justart.txt)
   - Film-Slider (Homepage)
   - JustArt: video hover autoplay + play overlay
   ========================= */

(function(){
  /* helper */
  function safeUrl(n){ return encodeURI(n || ""); }

  /* Elements */
  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const menuOverlay = document.getElementById("menuOverlay");
  const headerBanner = document.querySelector(".header-banner");

  /* ---------- Menu open/close ---------- */
  function openMenu(){
    if(sideMenu) sideMenu.classList.add("open");
    if(menuOverlay) menuOverlay.classList.add("active");
    if(sideMenu) sideMenu.setAttribute("aria-hidden","false");
  }
  function closeMenu(){
    if(sideMenu) sideMenu.classList.remove("open");
    if(menuOverlay) menuOverlay.classList.remove("active");
    if(sideMenu) sideMenu.setAttribute("aria-hidden","true");
  }

  if(menuBtn){
    menuBtn.addEventListener("click", function(e){
      e.preventDefault();
      if(sideMenu && sideMenu.classList.contains("open")) closeMenu(); else openMenu();
    });
  }
  if(menuOverlay) menuOverlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function(e){ if(e.key==="Escape") closeMenu(); });

  /* Close menu when clicking any menu link (and prevent ghost clicks) */
  document.addEventListener("click", function(e){
    if(e.target && e.target.matches && e.target.matches(".side-menu a")){
      // small timeout so the navigation can proceed
      setTimeout(closeMenu, 80);
    }
  });

  /* ---------- Menu button color switching based on banner visibility ---------- */
  function updateMenuButtonState(){
    if(!headerBanner || !menuBtn) return;
    const rect = headerBanner.getBoundingClientRect();
    // if banner bottom is below 60px, button is still over banner => light
    if(rect.bottom > 60){
      menuBtn.classList.remove("menu-state--dark");
      menuBtn.classList.add("menu-state--light");
    } else {
      menuBtn.classList.remove("menu-state--light");
      menuBtn.classList.add("menu-state--dark");
    }
  }
  // initial + on scroll/resize
  updateMenuButtonState();
  window.addEventListener("scroll", updateMenuButtonState, {passive:true});
  window.addEventListener("resize", updateMenuButtonState);

  /* ---------- Load images/videos from text list into a grid ---------- */
  async function loadListToGrid(txtFile, gridId, options = {}){
    const grid = document.getElementById(gridId);
    if(!grid) return;

    try{
      const res = await fetch(txtFile + "?v=" + Date.now());
      if(!res.ok) throw new Error("notfound");
      const txt = await res.text();
      const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      grid.innerHTML = "";

      lines.forEach(name => {
        const div = document.createElement("div");
        div.className = "card";

        if(name.toLowerCase().endsWith(".mp4")){
          const video = document.createElement("video");
          video.src = safeUrl(name);
          video.preload = "metadata";
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.controls = false;
          video.style.background = "transparent";
          div.appendChild(video);

          // Play overlay
          const overlay = document.createElement("div");
          overlay.className = "play-overlay";
          overlay.innerHTML = "▶";
          div.appendChild(overlay);

          // hover handlers (desktop)
          div.addEventListener("mouseenter", ()=>{ video.play().catch(()=>{}); overlay.style.opacity = "0.0"; }, {passive:true});
          div.addEventListener("mouseleave", ()=>{ video.pause(); overlay.style.opacity = ""; }, {passive:true});
          // touch: tap to toggle play
          div.addEventListener("click", (e)=>{
            // prevent link behaviour; toggle play
            if(video.paused) video.play().catch(()=>{}); else video.pause();
          }, {passive:true});

        } else {
          // image
          const img = document.createElement("img");
          img.src = safeUrl(name);
          img.alt = name.replace(/\.[^/.]+$/,'').replace(/[-_]/g,' ');
          div.appendChild(img);
        }

        // Add download button only if not justart grid
        if(!gridId.includes("justart")){
          const a = document.createElement("a");
          a.className = "download-btn";
          a.href = safeUrl(name);
          a.textContent = "download";
          // Desktop: trigger download attribute; mobile: open in new tab for user to save
          if(!/Mobi|Android/i.test(navigator.userAgent)){
            a.setAttribute("download", name);
          } else {
            a.setAttribute("target","_blank");
            a.setAttribute("rel","noopener");
          }
          div.appendChild(a);
        }

        grid.appendChild(div);
      });

    }catch(err){
      console.error("Fehler beim Laden von", txtFile, err);
      grid.innerHTML = "<p>Fehler beim Laden der Bildliste.</p>";
    }
  }

  /* ---------- Homepage: load slider images (filmTrack) and simple smooth loop ---------- */
  async function loadSliderImages(){
    const slider = document.getElementById("filmTrack");
    if(!slider) return;
    try{
      const res = await fetch("images-phone.txt?v=" + Date.now());
      if(!res.ok) throw new Error("notfound");
      const txt = await res.text();
      const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      slider.innerHTML = "";
      lines.forEach(name=>{
        const item = document.createElement("div");
        item.className = "film-item";
        const img = document.createElement("img");
        img.src = safeUrl(name);
        img.alt = name;
        item.appendChild(img);
        slider.appendChild(item);
      });
      // duplicate children to get seamless effect
      const originals = Array.from(slider.children);
      originals.forEach(c => slider.appendChild(c.cloneNode(true)));

      let pos = 0;
      const speed = 0.15; // px per frame tweak
      function step(){
        pos -= speed;
        // reset at half of scrollWidth to avoid huge numbers
        if(Math.abs(pos) > slider.scrollWidth/2) pos = 0;
        slider.style.transform = `translateX(${pos}px)`;
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }catch(err){
      console.error("Slider Fehler", err);
    }
  }

  /* ---------- Init loaders on DOM ready ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    // grids (if present)
    loadListToGrid("images-phone.txt","phoneGrid");
    loadListToGrid("images-desktop.txt","desktopGrid");
    loadListToGrid("images-justart.txt","justartGrid");

    // slider
    loadSliderImages();
  });

})();
