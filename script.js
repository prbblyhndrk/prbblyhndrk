(function(){

  function safeUrl(n){ return encodeURI(n || ""); }

  /* ========== MENU HANDLING ========== */

  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const menuOverlay = document.getElementById("menuOverlay");

  function openMenu(){
    sideMenu.classList.add("open");
    sideMenu.setAttribute("aria-hidden","false");
    menuOverlay.classList.add("active");
  }

  function closeMenu(){
    sideMenu.classList.remove("open");
    sideMenu.setAttribute("aria-hidden","true");
    menuOverlay.classList.remove("active");
  }

  menuBtn.addEventListener("click",()=>{
    if(sideMenu.classList.contains("open")) closeMenu();
    else openMenu();
  });

  menuOverlay.addEventListener("click",closeMenu);

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape") closeMenu();
  });

  /* ========== LOAD GRIDS ========== */

  async function loadListToGrid(txtFile, gridId){
    const grid = document.getElementById(gridId);
    if(!grid) return;

    try{
      const res = await fetch(txtFile + "?v=" + Date.now());
      const txt = await res.text();
      const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);

      grid.innerHTML = "";

      lines.forEach(name=>{
        const div = document.createElement("div");
        div.className="card";

        let media;
        if(name.toLowerCase().endsWith(".mp4")){
          media=document.createElement("video");
          media.src=safeUrl(name);
          media.controls=true;
          media.preload="metadata";
        } else {
          media=document.createElement("img");
          media.src=safeUrl(name);
        }
        div.appendChild(media);

        const a=document.createElement("a");
        a.className="download-btn";
        a.href=safeUrl(name);
        a.download=name;
        a.textContent="download";
        div.appendChild(a);

        grid.appendChild(div);
      });

    }catch(err){
      console.error("Fehler beim Laden",txtFile,err);
    }
  }

  /* ========== HOMEPAGE FILM SLIDER ========== */

  async function loadSliderImages(){
    const slider=document.getElementById("filmTrack");
    if(!slider) return;

    try{
      const res=await fetch("images-phone.txt?v="+Date.now());
      const txt=await res.text();
      const lines=txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);

      slider.innerHTML="";

      lines.forEach(name=>{
        const item=document.createElement("div");
        item.className="film-item";
        const img=document.createElement("img");
        img.src=safeUrl(name);
        item.appendChild(img);
        slider.appendChild(item);
      });

      let x=0;
      function loop(){
        x-=0.25;
        slider.style.transform=`translateX(${x}px)`;
        if(Math.abs(x) > slider.scrollWidth) x=0;
        requestAnimationFrame(loop);
      }
      loop();

    }catch(err){
      console.error("Fehler Slider",err);
    }
  }

  /* INIT */
  document.addEventListener("DOMContentLoaded",()=>{
    loadSliderImages();
    loadListToGrid("images-phone.txt","phoneGrid");
    loadListToGrid("images-desktop.txt","desktopGrid");
    loadListToGrid("images-justart.txt","justartGrid");
  });

})();
