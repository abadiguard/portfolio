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
  var progress=main.querySelector('.fit-progress-second, .fit-progress-third, .fit-progress-fourth, .fit-progress-fifth');
  var nodes=[header].concat(options,[navigation]).filter(Boolean);
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var animations=[];
  var stopped=false;
  function revealEverything(){
    stopped=true;
    animations.forEach(function(animation){animation.cancel();});
    nodes.forEach(function(node){node.style.removeProperty('opacity');node.inert=false;});
    root.classList.remove('fit-sequence-pending');
    if(progress)progress.classList.add('is-progress-advanced');
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
    try{
      if(document.fonts)await document.fonts.ready;
      if(stopped)return;
      document.dispatchEvent(new Event('fit:before-enter'));
      await fade(header,550);
      if(stopped)return;
      if(progress){
        progress.classList.add('is-progress-advanced');
        var matchRays=main.classList.contains('fit-sector-result')&&progress.querySelector('.fit-match-rays:not([hidden])');
        // Final result waits for both the marker travel (760ms) and rays (720ms).
        await wait(matchRays?1480:780);
        if(stopped)return;
      }
      await Promise.all(options.map(function(option,index){return fade(option,480,index*180);}));
      if(stopped)return;
      await wait(120);
      if(stopped)return;
      if(navigation)await fade(navigation,420);
    }catch(error){revealEverything();}
  }
  enter();
  reduced.addEventListener('change',function(){if(reduced.matches)revealEverything();});
  window.addEventListener('pageshow',function(event){if(event.persisted)revealEverything();});
})();
