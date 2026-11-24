(function(){
  'use strict';
  var root=document.documentElement;
  var main=document.querySelector('.fit-question');
  if(!main)return;
  var header=main.querySelector('.fit-question-heading');
  var options=Array.from(main.querySelectorAll('.fit-option'));
  if(main.classList.contains('fit-stage-response'))options=Array.from(main.querySelectorAll('.fit-response-content > *'));
  var leadForm=main.querySelector('.fit-lead-form');
  if(!options.length&&leadForm)options=[leadForm];
  var answerPanel=main.querySelector('.fit-answer-panel, .fit-sector-panel');
  if(!options.length&&answerPanel)options=[answerPanel];
  var navigation=main.querySelector('.fit-navigation');
  var progress=main.querySelector('.fit-progress');
  var headingNodes=header?Array.from(header.children).filter(function(node){return !node.classList.contains('fit-progress');}):[];
  var nodes=headingNodes.concat(options,[navigation]).filter(Boolean);
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var animations=[];
  var stopped=false;
  var epoch=0;
  function revealEverything(){
    stopped=true;
    animations.forEach(function(animation){animation.cancel();});
    nodes.forEach(function(node){node.style.removeProperty('opacity');node.inert=false;});
    root.classList.remove('fit-sequence-pending');
    if(progress)progress.classList.add('is-progress-advanced');
    if(window.FitProgressMotion)window.FitProgressMotion.play();
  }
  if(!root.classList.contains('fit-sequenced')||reduced.matches){revealEverything();return;}
  nodes.forEach(function(node){node.style.opacity='0';node.inert=true;});
  root.classList.remove('fit-sequence-pending');
  function fade(node,duration,delay){
    var frames=main.classList.contains('fit-stage-response')&&node!==header&&node!==navigation?[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}]:[{opacity:0},{opacity:1}];
    var animation=node.animate(frames,{duration:duration,delay:delay||0,easing:'ease-in-out',fill:'both'});
    animations.push(animation);
    return animation.finished.then(function(){node.style.removeProperty('opacity');node.inert=false;animation.cancel();});
  }
  function wait(duration){return new Promise(function(resolve){window.setTimeout(resolve,duration);});}
  async function enter(){
    var token=++epoch;
    try{
      if(document.fonts)await document.fonts.ready;
      if(stopped||token!==epoch)return;
      document.dispatchEvent(new Event('fit:before-enter'));
      await Promise.all(headingNodes.map(function(node,index){return fade(node,550,index*80);}));
      if(stopped||token!==epoch)return;
      if(progress){
        progress.classList.add('is-progress-advanced');
        var matchRays=main.classList.contains('fit-sector-result')&&progress.querySelector('.fit-match-rays:not([hidden])');
        // Final result waits for both the marker travel (760ms) and rays (720ms).
        var moved=window.FitProgressMotion?window.FitProgressMotion.play():true;
        await wait(matchRays?1480:(moved?780:0));
        if(stopped||token!==epoch)return;
      }
      await Promise.all(options.map(function(option,index){return fade(option,480,index*180);}));
      if(stopped||token!==epoch)return;
      await wait(120);
      if(stopped||token!==epoch)return;
      if(navigation)await fade(navigation,420);
    }catch(error){if(!stopped&&token===epoch)revealEverything();}
  }
  enter();
  reduced.addEventListener('change',function(){if(reduced.matches)revealEverything();});
  window.addEventListener('pagehide',function(){
    stopped=true;epoch++;
    animations.forEach(function(animation){animation.cancel();});animations=[];
    nodes.forEach(function(node){node.style.opacity='0';node.inert=true;});
  });
  window.addEventListener('pageshow',function(event){
    if(!event.persisted)return;
    if(window.FitProgressMotion)window.FitProgressMotion.prepare();
    if(reduced.matches){revealEverything();return;}
    animations.forEach(function(animation){animation.cancel();});animations=[];stopped=false;
    nodes.forEach(function(node){node.style.opacity='0';node.inert=true;});
    enter();
  });
})();
