(function(){
  'use strict';
  var main=document.querySelector('.fit-question');
  var track=main&&main.querySelector('.fit-options');
  var footer=main&&main.querySelector('.fit-question-form > .fit-navigation');
  if(!track||!footer)return;
  var header=main.querySelector('.fit-question-heading');
  var pending=null;
  function measure(){
    pending=null;
    var height=window.visualViewport?window.visualViewport.height:window.innerHeight;
    var siteHeader=document.querySelector('.fit-site-header');
    height-=siteHeader?siteHeader.getBoundingClientRect().height:0;
    // Size each horizontal slot from the actual rendered text lines. The body
    // retains its wrapping width; empty side space is excluded from the gap.
    if(window.matchMedia('(max-width: 1024px)').matches&&document.createRange){
      Array.from(track.querySelectorAll('.fit-option')).forEach(function(option){
        var widest=0;
        Array.from(option.querySelectorAll('.fit-option-title, .fit-option-copy')).forEach(function(text){
          var range=document.createRange();range.selectNodeContents(text);
          Array.from(range.getClientRects()).forEach(function(rect){widest=Math.max(widest,rect.width);});
        });
        if(widest)option.style.setProperty('--fit-text-width',Math.ceil(widest)+'px');
      });
    }else{
      Array.from(track.querySelectorAll('.fit-option')).forEach(function(option){option.style.removeProperty('--fit-text-width');});
    }
    var phoneKeyframes=window.matchMedia('(width < 720px)').matches;
    var style=main.style;
    var defaults={'--fit-viewport-top':60,'--fit-options-gap':16,'--fit-art-trim':0,'--fit-heading-gap':32,'--fit-card-heading-gap':24,'--fit-card-copy-gap':16,'--fit-card-radio-gap':24,'--fit-track-top':16,'--fit-track-bottom':20};
    Object.keys(defaults).forEach(function(key){style.setProperty(key,defaults[key]+'px');});
    style.setProperty('--fit-track-height','auto');
    style.setProperty('--fit-header-limit','none');
    main.classList.remove('fit-header-overflow');
    footer.style.setProperty('--fit-navigation-bottom','40px');
    var footerHeight=footer.getBoundingClientRect().height;
    function deficit(){return Math.max(0,track.getBoundingClientRect().bottom-main.getBoundingClientRect().top+footerHeight+16-height);}
    function reduce(key,minimum){var amount=deficit();if(amount>0)style.setProperty(key,Math.max(minimum,defaults[key]-amount)+'px');}
    // Header/progress and bottom actions keep identical anchors on every screen.
    reduce('--fit-options-gap',6);
    // Reclaim empty space inside the supplied SVG canvases, without scaling strokes.
    style.setProperty('--fit-art-trim',(phoneKeyframes?60:Math.min(60,deficit()))+'px');
    reduce('--fit-card-heading-gap',12);
    reduce('--fit-card-copy-gap',8);
    reduce('--fit-card-radio-gap',12);
    reduce('--fit-track-top',8);
    reduce('--fit-track-bottom',8);
    if(deficit()>0){
      var available=height-footerHeight-16-(track.getBoundingClientRect().top-main.getBoundingClientRect().top);
      if(available<100){
        var headerHeight=header.getBoundingClientRect().height;
        style.setProperty('--fit-header-limit',Math.max(48,headerHeight-(100-available))+'px');
        main.classList.add('fit-header-overflow');
        available=height-footerHeight-16-(track.getBoundingClientRect().top-main.getBoundingClientRect().top);
      }
      // On exceptionally short screens, text/art scroll separately above the radios.
      style.setProperty('--fit-track-height',Math.max(100,available)+'px');
    }
    if(window.matchMedia('(max-width: 768px)').matches){
      // Center against the actual paragraph and fixed navigation boundaries.
      var room=footer.getBoundingClientRect().top-header.getBoundingClientRect().bottom;
      var rowHeight=track.getBoundingClientRect().height;
      style.setProperty('--fit-options-gap',Math.max(6,(room-rowHeight)/2)+'px');
      return;
    }
    // Split unused space above and below the options, not above the title.
    var spare=height-footerHeight-16-(track.getBoundingClientRect().bottom-main.getBoundingClientRect().top);
    if(spare>0){
      var optionsGap=parseFloat(style.getPropertyValue('--fit-options-gap'))||6;
      style.setProperty('--fit-options-gap',(optionsGap+spare/2)+'px');
    }

  }
  function schedule(){if(pending===null)pending=window.requestAnimationFrame(measure);}
  if(typeof ResizeObserver==='function'){
    var observer=new ResizeObserver(schedule);
    [header,track,footer].filter(Boolean).forEach(function(node){observer.observe(node);});
  }
  document.addEventListener('fit:before-enter',measure);
  window.addEventListener('resize',schedule);
  window.addEventListener('pageshow',schedule);
  if(window.visualViewport)window.visualViewport.addEventListener('resize',schedule);
  if(document.fonts)document.fonts.ready.then(schedule);
  measure();
})();
