(function(){
  'use strict';
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.fit-question-form').forEach(function(form){
    var next=form.querySelector('.fit-next');
    if(!next)return;
    var pending=null;
    var motion=null;
    function revealOption(input){
      var option=input.closest('.fit-option');
      var track=option&&option.closest('.fit-options');
      if(!track||track.scrollWidth<=track.clientWidth+1)return;
      var rect=option.getBoundingClientRect();
      var bounds=track.getBoundingClientRect();
      var padding=parseFloat(getComputedStyle(track).paddingLeft)||0;
      if(rect.left<bounds.left+padding-1||rect.right>bounds.right-padding+1){
        track.scrollTo({left:track.scrollLeft+rect.left-bounds.left-padding,behavior:reduced.matches?'instant':'smooth'});
      }
    }
    function stopMotion(){
      if(motion!==null)window.cancelAnimationFrame(motion);
      motion=null;
    }
    function glide(delta){
      if(reduced.matches){window.scrollBy({top:delta,behavior:'instant'});return;}
      var start=window.scrollY;
      var limit=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
      var target=Math.min(limit,start+delta);
      var distance=target-start;
      if(distance<=0)return;
      var began=null;
      var duration=Math.min(1500,1100+distance*.15);
      function frame(now){
        if(began===null)began=now;
        var progress=Math.min(1,(now-began)/duration);
        // Quintic smoothstep: no abrupt acceleration at either end.
        var eased=progress*progress*progress*(progress*(progress*6-15)+10);
        window.scrollTo({top:start+distance*eased,behavior:'instant'});
        motion=progress<1?window.requestAnimationFrame(frame):null;
      }
      motion=window.requestAnimationFrame(frame);
    }
    ['wheel','touchstart','pointerdown','keydown'].forEach(function(type){
      window.addEventListener(type,stopMotion,{passive:true});
    });
    reduced.addEventListener('change',stopMotion);
    window.addEventListener('pagehide',function(){
      stopMotion();
      if(pending!==null)window.cancelAnimationFrame(pending);
      pending=null;
    });
    function revealNext(){
      // Label activation also clicks its input. Coalesce both into one scroll.
      if(pending!==null)window.cancelAnimationFrame(pending);
      pending=window.requestAnimationFrame(function(){
        pending=null;
        var rect=next.getBoundingClientRect();
        var viewport=window.visualViewport;
        var top=viewport?viewport.offsetTop:0;
        var bottom=top+(viewport?viewport.height:window.innerHeight);
        var gap=24;
        // Once Next is visible, further selections must not reposition the page.
        var visible=rect.top>=top&&rect.bottom<=bottom;
        var delta=!visible&&rect.bottom>bottom?rect.bottom-bottom+gap:0;
        if(delta&&motion===null)glide(delta);
      });
    }
    form.addEventListener('click',function(event){
      // Click, rather than change alone, also covers the selected radio.
      if(event.target.closest('.fit-option'))revealNext();
    });
    form.addEventListener('change',function(event){
      if(event.target.matches('input[type="radio"]')){revealOption(event.target);revealNext();}
    });
    form.addEventListener('fit:selection',revealNext);
    var radios=Array.from(form.querySelectorAll('.fit-option-input[type="radio"]'));
    if(radios.length)document.addEventListener('keydown',function(event){
      if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;
      var focused=document.activeElement;
      if(focused&&focused.matches('input:not([type="radio"]), textarea, select, [contenteditable="true"], [role="combobox"]'))return;
      var current=radios.findIndex(function(input){return input.checked;});
      var index=current<0?(event.key==='ArrowRight'?0:radios.length-1):(current+(event.key==='ArrowRight'?1:-1)+radios.length)%radios.length;
      var input=radios[index];
      var option=input.closest('.fit-option');
      if(form.inert||(option&&option.inert))return;
      event.preventDefault();
      radios.forEach(function(radio){radio.checked=radio===input;});
      input.focus({preventScroll:true});
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
  });
})();
