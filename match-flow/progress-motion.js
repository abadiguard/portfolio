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
  window.FitProgressMotion={play:play,moves:from!==target};
  window.addEventListener('pagehide',function(){if(motion)motion.cancel();if(lineMotion)lineMotion.cancel();motion=null;lineMotion=null;try{sessionStorage.setItem(key,String(target));}catch(e){}});
  window.addEventListener('pageshow',function(event){if(event.persisted){from=previous();play();}});
})();
