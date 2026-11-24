(function(){
  'use strict';
  var bar=document.querySelector('.fit-progress');
  if(!bar)return;
  var dots=Array.from(bar.children).filter(function(node){return !node.classList.contains('fit-progress-marker');});
  var target=dots.findIndex(function(dot){return dot.hasAttribute('aria-current');})+1;
  if(!target)return;
  var key='liat-fit-departing-step',motion=null;
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function previous(){try{var n=Number(sessionStorage.getItem(key));return n>=1&&n<=dots.length?n:target;}catch(e){return target;}}
  var from=previous();
  var dimTarget=document.querySelector('main').classList.contains('fit-look');
  var dimFrom=false;
  try{dimFrom=sessionStorage.getItem('liat-fit-departing-dim')==='1';}catch(e){}
  var tail=document.createElement('span');tail.className='fit-progress-tail-mask';tail.setAttribute('aria-hidden','true');
  bar.appendChild(tail);
  function setDim(dim){
    dots.slice(2).forEach(function(dot){dot.style.opacity=dim?'.25':'1';});
    tail.style.opacity=dim?'.75':'0';
  }
  setDim(dimFrom);
  var dimAnimations=[];
  function dimTransition(){
    dimAnimations.forEach(function(animation){animation.cancel();});dimAnimations=[];
    var before=dimFrom;dimFrom=dimTarget;
    setDim(dimTarget);
    if(before===dimTarget||reduced.matches)return;
    dots.slice(2).concat([tail]).forEach(function(node){
      var isTail=node===tail;
      var start=isTail?(before?.75:0):(before?.25:1);
      var end=isTail?(dimTarget?.75:0):(dimTarget?.25:1);
      dimAnimations.push(node.animate([{opacity:start},{opacity:end}],{duration:600,easing:'ease-in-out'}));
    });
  }
  var marker=bar.querySelector('.fit-progress-marker');
  if(!marker){marker=document.createElement('li');marker.className='fit-progress-marker';marker.setAttribute('aria-hidden','true');bar.appendChild(marker);}
  bar.classList.add('fit-progress-managed');
  function completed(step){
    dots.forEach(function(dot,index){dot.classList.toggle('fit-dot-completed',index<step-1);});
    bar.style.setProperty('--fit-completed-width',((step-1)*38)+'px');
  }
  marker.style.transform='translateX('+((from-1)*38)+'px)';
  completed(from);
  var line=document.createElement('span');
  line.className='fit-progress-moving-line';line.setAttribute('aria-hidden','true');bar.appendChild(line);
  line.style.width=((from-1)*38)+'px';
  var lineMotion=null;
  function play(){
    // BFCache restoration has two listeners; never cancel a running reverse.
    if(motion&&motion.playState==='running')return true;
    dimTransition();
    var start=from;from=target;
    var low=Math.min(start,target),high=Math.max(start,target);
    marker.style.transform='translateX('+((target-1)*38)+'px)';
    line.style.width=((target-1)*38)+'px';
    if(start===target||reduced.matches||typeof marker.animate!=='function'){completed(target);return false;}
    completed(start);
    // Forward departure reveals an already-filled small dot beneath the marker.
    if(start<target)dots[start-1].classList.add('fit-dot-completed');
    // Reverse the same keyframes and easing, rather than starting a new ease-out.
    var timing={duration:760,easing:'cubic-bezier(.22,.61,.36,1)',direction:start>target?'reverse':'normal'};
    motion=marker.animate([{transform:'translateX('+((low-1)*38)+'px)'},{transform:'translateX('+((high-1)*38)+'px)'}],timing);
    lineMotion=line.animate([{width:((low-1)*38)+'px'},{width:((high-1)*38)+'px'}],timing);
    motion.finished.then(function(){completed(target);motion=null;lineMotion=null;}).catch(function(){});
    return true;
  }
  function prepare(){
    if(motion)motion.cancel();if(lineMotion)lineMotion.cancel();motion=null;lineMotion=null;
    from=previous();
    try{dimFrom=sessionStorage.getItem('liat-fit-departing-dim')==='1';}catch(e){}
    setDim(dimFrom);
    marker.style.transform='translateX('+((from-1)*38)+'px)';
    line.style.width=((from-1)*38)+'px';completed(from);
  }
  window.FitProgressMotion={play:play,prepare:prepare,moves:from!==target};
  window.addEventListener('pagehide',function(){if(motion)motion.cancel();if(lineMotion)lineMotion.cancel();motion=null;lineMotion=null;try{sessionStorage.setItem(key,String(target));sessionStorage.setItem('liat-fit-departing-dim',dimTarget?'1':'0');}catch(e){}});

})();
