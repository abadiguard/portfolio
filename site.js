(function(){
  "use strict";
  var introStateKey="homeHeroIntroComplete";
  var navEntries=performance.getEntriesByType?performance.getEntriesByType("navigation"):[];
  if(navEntries.length&&navEntries[0].type==="reload"){
    try{sessionStorage.removeItem(introStateKey)}catch(e){}
  }
  var hero=document.querySelector(".hero[data-animated-intro]");
  if(!hero)return;
  var title=hero.querySelector("h1");
  var lines=title?title.querySelectorAll(".hero-title-line"):[];
  var paragraph=hero.querySelector(".mid p");
  var arrow=hero.querySelector(".arrow");
  if(!title||lines.length!==3||!paragraph||!arrow)return;
  var reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var started=false;
  var completed=false;
  var touchStartY=null;
  var pendingScroll=0;
  function saveFinalState(){try{sessionStorage.setItem(introStateKey,"1")}catch(e){}}
  document.addEventListener("click",function(event){
    var link=event.target.closest&&event.target.closest("a[href]");
    if(!link)return;
    try{var target=new URL(link.href,window.location.href);if(target.origin===window.location.origin&&target.pathname!==window.location.pathname)saveFinalState()}catch(e){}
  },true);
  function showFinalState(){
    lines[0].textContent="DESIGN IS";lines[1].textContent="ABOUT SHAPING";lines[2].textContent="BEHAVIOR";
    hero.classList.add("copy-reveal","copy-visible","arrow-reveal","intro-ready");
    completed=true;
  }
  try{if(sessionStorage.getItem(introStateKey)==="1"){showFinalState();return}}catch(e){}
  function revealArrow(){
    hero.classList.add("arrow-reveal");
    if(!reduceMotion){
      arrow.classList.add("draw-reveal");
      arrow.style.setProperty("--d","0s");
      requestAnimationFrame(function(){arrow.classList.add("in")});
      window.setTimeout(releaseScroll,1000);
    }
    if(reduceMotion)return;
  }
  function finish(){
    hero.classList.add("copy-reveal");
    requestAnimationFrame(function(){requestAnimationFrame(function(){hero.classList.add("copy-visible")})});
    setTimeout(revealArrow,1050);
  }
  function begin(){
    if(started)return;
    started=true;
    saveFinalState();
    if(reduceMotion){showFinalState();releaseScroll();return}
    var caret=document.createElement("span");caret.className="hero-caret";caret.setAttribute("aria-hidden","true");title.classList.add("is-typing");
    var first=lines[0],second=lines[1],third=lines[2];
    function moveCaret(line){line.appendChild(caret)}
    function eraseLine(line,stopAt,done){
      moveCaret(line);var value=line.firstChild?line.firstChild.textContent:"";
      var timer=setInterval(function(){value=value.slice(0,-1);line.firstChild.textContent=value;if(value.length<=stopAt){clearInterval(timer);done()}},76);
    }
    function typeLine(line,value,done){
      moveCaret(line);line.firstChild.textContent="";var i=0;
      var timer=setInterval(function(){i++;line.firstChild.textContent=value.slice(0,i);if(i>=value.length){clearInterval(timer);done()}},76);
    }
    moveCaret(third);
    setTimeout(function(){
      eraseLine(third,0,function(){eraseLine(second,0,function(){eraseLine(first,"DESIGN IS".length,function(){
        setTimeout(function(){typeLine(second,"ABOUT SHAPING",function(){typeLine(third,"BEHAVIOR",function(){title.classList.remove("is-typing");caret.remove();setTimeout(finish,550)})})},420);
      })})});
    },1500);
  }
  function releaseScroll(){
    if(completed)return;completed=true;
    hero.classList.add("intro-ready");
    saveFinalState();
    window.removeEventListener("wheel",onWheel);window.removeEventListener("touchstart",onTouchStart);window.removeEventListener("touchmove",onTouchMove);window.removeEventListener("keydown",onKey);
    if(pendingScroll)window.scrollBy({top:pendingScroll,behavior:"smooth"});
  }
  function onWheel(event){if(completed)return;event.preventDefault();if(!started)pendingScroll=event.deltaY||120;begin()}
  function onKey(event){
    if(["ArrowDown","PageDown"," "].indexOf(event.key)===-1)return;
    var target=event.target;
    if(event.altKey||event.ctrlKey||event.metaKey||(target&&target.closest&&target.closest("a,button,input,textarea,select,[contenteditable='true'],[role='button'],[role='combobox'],[role='listbox'],[role='option']")))return;
    event.preventDefault();if(!started)pendingScroll=event.key==="ArrowDown"?100:Math.round(window.innerHeight*.8);begin();
  }
  function onTouchStart(event){touchStartY=event.touches&&event.touches.length?event.touches[0].clientY:null}
  function onTouchMove(event){
    if(completed||touchStartY===null||!event.touches||!event.touches.length)return;
    var delta=event.touches[0].clientY-touchStartY;
    event.preventDefault();
    if(!started&&Math.abs(delta)>8){pendingScroll=-delta;begin()}
  }
  window.addEventListener("wheel",onWheel,{passive:false});
  window.addEventListener("touchstart",onTouchStart,{passive:true});
  window.addEventListener("touchmove",onTouchMove,{passive:false});
  window.addEventListener("keydown",onKey);
})();

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
  var isCarousel=window.matchMedia("(max-width: 1214px)");
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
    if(!isCarousel.matches){dots.hidden=true;return}
    dots.hidden=false;
    var railLeft=rail.getBoundingClientRect().left;
    var activeIndex=0;
    var nearest=Infinity;
    cards.forEach(function(card,index){
      var distance=Math.abs(card.getBoundingClientRect().left-railLeft);
      if(distance<nearest){nearest=distance;activeIndex=index}
    });
    var firstCard=cards[0];
    var cardStyle=window.getComputedStyle(rail);
    var gap=parseFloat(cardStyle.columnGap)||parseFloat(cardStyle.gap)||0;
    var cardWidth=firstCard.getBoundingClientRect().width;
    var visibleCount=Math.max(1,Math.floor((rail.clientWidth+gap)/(cardWidth+gap)));
    buttons.forEach(function(button,index){
      button.classList.remove("is-active-start","is-active-end");
      if(index>=activeIndex&&index<Math.min(cards.length,activeIndex+visibleCount))button.setAttribute("aria-current","true");
      else button.removeAttribute("aria-current");
    });
    buttons[activeIndex].classList.add("is-active-start");
    buttons[Math.min(cards.length,activeIndex+visibleCount)-1].classList.add("is-active-end");
    dots.dataset.visible=String(visibleCount);
  }
  rail.addEventListener("scroll",function(){if(frame)return;frame=true;window.requestAnimationFrame(setActive)},{passive:true});
  window.addEventListener("resize",setActive,{passive:true});
  isCarousel.addEventListener?isCarousel.addEventListener("change",setActive):isCarousel.addListener(setActive);
  setActive();
})();
