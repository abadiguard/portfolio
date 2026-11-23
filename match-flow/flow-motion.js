(function(){
  'use strict';
  var main=document.querySelector('main');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var leaving=null;
  function navigate(url){
    if(reduced.matches||!main||typeof main.animate!=='function'){window.location.assign(url);return;}
    if(leaving)return;
    leaving=main.animate([{opacity:getComputedStyle(main).opacity},{opacity:0}],{duration:380,easing:'ease-in-out',fill:'forwards'});
    leaving.finished.then(function(){window.location.assign(url);}).catch(function(){leaving=null;});
  }
  window.MatchFlowNavigate=navigate;
  document.addEventListener('click',function(event){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    var link=event.target.closest('a.fit-start[href], a.fit-back[href], a.fit-lead-back[href]');
    if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
    if(reduced.matches||typeof main.animate!=='function')return;
    event.preventDefault();
    navigate(link.href);
  });
  window.addEventListener('pageshow',function(event){
    if(!event.persisted)return;
    if(leaving){leaving.cancel();leaving=null;}
  });
})();
