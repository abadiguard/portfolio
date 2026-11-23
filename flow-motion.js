(function(){
  'use strict';
  var main=document.querySelector('main');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var leaving=null;
  var leavingAnimations=[];
  function navigate(url){
    if(reduced.matches||!main||typeof main.animate!=='function'){window.location.assign(url);return;}
    if(leaving)return;
    var progress=main.querySelector('.fit-progress');
    var targets=progress?Array.from(main.children).reduce(function(list,node){
      if(node.classList.contains('fit-question-heading'))return list.concat(Array.from(node.children).filter(function(child){return child!==progress;}));
      return list.concat([node]);
    },[]):[main];
    leavingAnimations=targets.map(function(node){return node.animate([{opacity:getComputedStyle(node).opacity},{opacity:0}],{duration:380,easing:'ease-in-out',fill:'forwards'});});
    leaving=Promise.all(leavingAnimations.map(function(animation){return animation.finished;}));
    leaving.then(function(){window.location.assign(url);}).catch(function(){leaving=null;});
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
    if(leaving){leavingAnimations.forEach(function(animation){animation.cancel();});leaving=null;}
  });
})();
