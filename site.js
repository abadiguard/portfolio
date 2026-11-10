(function(){
  "use strict";

  document.querySelectorAll(".site-foot").forEach(function(footer){
    var tools=footer.querySelector(".built-using");
    if(!tools)return;
    var qaContent=document.querySelector(".qa-content");
    var syncFooterWidth=function(){
      var toolsWidth=tools.getBoundingClientRect().width+"px";
      footer.style.setProperty("--built-using-width",toolsWidth);
      if(qaContent)qaContent.style.setProperty("--built-using-width",toolsWidth);
    };
    syncFooterWidth();
    if("ResizeObserver" in window)new ResizeObserver(syncFooterWidth).observe(tools);
    window.addEventListener("resize",syncFooterWidth,{passive:true});
  });

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

(function(){
  "use strict";
  var rail=document.querySelector("#case-cards");
  var dots=document.querySelector(".case-dots");
  if(!rail||!dots)return;
  var cards=Array.prototype.slice.call(rail.querySelectorAll(".card"));
  if(!cards.length)return;
  var buttons=cards.map(function(card,index){
    var button=document.createElement("button");
    button.type="button";
    button.setAttribute("aria-label","Show case study "+(index+1)+" of "+cards.length);
    button.addEventListener("click",function(){
      rail.scrollTo({left:card.offsetLeft-cards[0].offsetLeft,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    });
    dots.appendChild(button);
    return button;
  });
  dots.hidden=false;
  var frame=false;
  function setActive(){
    frame=false;
    var railLeft=rail.getBoundingClientRect().left;
    var activeIndex=0;
    var nearest=Infinity;
    cards.forEach(function(card,index){
      var distance=Math.abs(card.getBoundingClientRect().left-railLeft);
      if(distance<nearest){nearest=distance;activeIndex=index}
    });
    buttons.forEach(function(button,index){
      if(index===activeIndex)button.setAttribute("aria-current","true");
      else button.removeAttribute("aria-current");
    });
  }
  rail.addEventListener("scroll",function(){if(frame)return;frame=true;window.requestAnimationFrame(setActive)},{passive:true});
  window.addEventListener("resize",setActive,{passive:true});
  setActive();
})();
