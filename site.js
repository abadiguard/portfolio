(function(){
  "use strict";

  var sourceLogo=document.querySelector("a.logo");
  if(!sourceLogo)return;

  var strip=document.createElement("div");
  strip.className="scroll-logo-strip";
  strip.setAttribute("aria-hidden","true");

  var stickyLogo=sourceLogo.cloneNode(true);
  stickyLogo.classList.add("scroll-logo-link");
  stickyLogo.setAttribute("tabindex","-1");
  strip.appendChild(stickyLogo);
  document.body.appendChild(strip);

  var pagePath=window.location.pathname.replace(/\/+$/, "");
  var isHomePage=pagePath===""||pagePath.endsWith("/index.html");
  if(isHomePage){
    stickyLogo.addEventListener("click",function(event){
      if(!active)return;
      event.preventDefault();
      var reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({top:0,behavior:reduceMotion?"auto":"smooth"});
    });
  }

  var stickySvg=stickyLogo.querySelector(".logo-svg");
  var active=false;
  var framePending=false;
  var startHeight=0;
  var startLogoY=0;
  var finalHeight=64;
  var finalLogoY=32;

  function measure(){
    var scrollY=window.scrollY||0;
    var logoRect=sourceLogo.getBoundingClientRect();
    startLogoY=logoRect.top+scrollY+logoRect.height/2;

    var safeTop=parseFloat(getComputedStyle(document.documentElement).paddingTop)||0;
    finalHeight=64+safeTop;
    finalLogoY=finalHeight/2;

    var sourceHeader=sourceLogo.closest("header");
    if(sourceHeader){
      startHeight=sourceHeader.getBoundingClientRect().bottom+scrollY;
    }else{
      // The homepage has no separate logo header, so use the same logo-plus-clearance area.
      startHeight=startLogoY+logoRect.height/2+60;
    }
    startHeight=Math.max(startHeight,finalHeight);
  }

  function setProgress(scrollY){
    var travel=Math.max(1,startHeight-finalHeight);
    var progress=Math.max(0,Math.min(1,scrollY/travel));
    if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)progress=1;

    strip.style.height=(startHeight-(startHeight-finalHeight)*progress)+"px";
    stickyLogo.style.top=(startLogoY+(finalLogoY-startLogoY)*progress)+"px";
    stickySvg.style.width=(132+(95.04-132)*progress)+"px";
    strip.style.boxShadow="0 1px 5px rgba(36,39,45,"+(0.06*progress)+")";
  }

  function updateStrip(){
    framePending=false;
    var scrollY=Math.max(0,window.scrollY||0);
    var shouldBeActive=scrollY>0;
    if(shouldBeActive&&!active){
      measure();
      sourceLogo.classList.add("is-scroll-replaced");
      strip.classList.add("is-visible");
      strip.setAttribute("aria-hidden","false");
      stickyLogo.removeAttribute("tabindex");
      active=true;
    }else if(!shouldBeActive&&active){
      strip.classList.remove("is-visible");
      strip.setAttribute("aria-hidden","true");
      stickyLogo.setAttribute("tabindex","-1");
      sourceLogo.classList.remove("is-scroll-replaced");
      active=false;
    }
    if(active)setProgress(scrollY);
  }

  function queueUpdate(){
    if(framePending)return;
    framePending=true;
    window.requestAnimationFrame(updateStrip);
  }

  window.addEventListener("scroll",queueUpdate,{passive:true});
  window.addEventListener("resize",function(){
    measure();
    queueUpdate();
  },{passive:true});

  measure();
  if(window.scrollY>0){
    active=true;
    sourceLogo.classList.add("is-scroll-replaced");
    strip.classList.add("is-visible");
    strip.setAttribute("aria-hidden","false");
    stickyLogo.removeAttribute("tabindex");
    setProgress(window.scrollY);
  }
})();

(function(){
  "use strict";
  var page=document.querySelector("body.case-study");
  if(!page||!window.IntersectionObserver||!window.matchMedia||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;

  document.documentElement.classList.add("js");
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:"0px 0px -6% 0px"});

  function reveal(selector,step,base){
    page.querySelectorAll(selector).forEach(function(element,index){
      element.classList.add("rv");
      element.style.setProperty("--d",((base||0)+index*(step||0))+"s");
      observer.observe(element);
    });
  }

  reveal(".case-study__header .logo",0,0);
  reveal(".case-study__client",0,.04);
  reveal(".case-study__label",.12,.08);
  reveal(".case-study__hero h1",0,.2);
  reveal(".case-study__intro",0,.32);
  reveal(".case-study__summary",0,.42);
  reveal(".case-study__image-section",.08,.08);
  reveal(".case-study__content-section h2",0,.08);
  reveal(".case-study__body",0,.2);
  reveal(".case-study__feature-copy h2",0,.08);
  reveal(".case-study__feature-copy p",0,.2);
  reveal(".case-study__feature-media",0,.3);
  reveal(".case-study__calendar-copy h2",0,.08);
  reveal(".case-study__calendar-copy p",0,.2);
  reveal(".case-study__calendar-media",0,.3);
  reveal(".case-study__results-arrow",0,.04);
  reveal(".case-study__results-section > h2",0,.14);
  reveal(".case-study__results-item",.12,.25);
  reveal(".case-study__results-nav-link",.12,.15);
})();
