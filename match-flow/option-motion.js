
(function(){
  'use strict';
  var fine=matchMedia('(hover: hover) and (pointer: fine)');
  var reduced=matchMedia('(prefers-reduced-motion: reduce)');
  var controllers=[];
  document.querySelectorAll('.fit-option').forEach(function(option){
    var kind=option.querySelector('input').value;
    var animations=[];
    function add(selector,frames,duration){
      option.querySelectorAll(selector).forEach(function(node){
        if(typeof node.animate!=='function')return;
        var animation=node.animate(frames,{duration:duration,easing:'ease-in-out',fill:'both'});
        animation.pause();animation.currentTime=0;
        animations.push({animation:animation,duration:duration});
      });
    }
    if(kind==='starting'){
      add('.fit-pencil-motion',[{transform:'translate(0px,0px) rotate(0deg)'},{transform:'translate(1px,-0.4px) rotate(1deg)',offset:.25},{transform:'translate(-1px,0px) rotate(-1deg)',offset:.5},{transform:'translate(1px,-0.3px) rotate(.8deg)',offset:.75},{transform:'translate(1.8px,0px) rotate(0deg)'}],850);
      add('.fit-pencil-scribble',[{opacity:0,strokeDashoffset:1},{opacity:1,strokeDashoffset:.7,offset:.3},{opacity:1,strokeDashoffset:0}],850);
    }else if(kind==='prototype'){
      add('.fit-plane-motion',[{transform:'translate(0px,0px) rotate(0deg)'},{transform:'translate(9px,-8px) rotate(-3deg)'}],650);
      add('.fit-plane-wish',[{opacity:0,transform:'translate(0px,0px)'},{opacity:1,transform:'translate(3px,-2px)'}],650);
    }else if(kind==='ai-ceiling'){
      add('.fit-button-motion',[{transform:'translateY(0px)'},{transform:'translateY(3px)'}],520);
      add('.fit-button-wish',[{opacity:0,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0px)'}],520);
    }else if(kind==='live-product'){
      add('.fit-speed-needle',[{transform:'rotate(0deg)'},{transform:'rotate(18deg)'}],700);
    }else if(['b2c','b2b','b2b2c'].includes(kind)){
      add('.fit-audience-profile',[{transform:'translate(0px,0px)'},{transform:'translate(-.8px,-1.8px)'}],720);
      add('.fit-audience-chart',[{transform:'translate(0px,0px)'},{transform:'translate(1.4px,-1.3px)'}],950);
      add('.fit-audience-copy',[{transform:'translate(0px,0px)',offset:0},{transform:'translate(0px,0px)',offset:.15},{transform:'translate(2.2px,.3px)'}],1000);
      add('.fit-audience-button',[{transform:'translate(0px,0px)',offset:0},{transform:'translate(0px,0px)',offset:.25},{transform:'translate(-1.2px,-1.4px)'}],1100);
    }else if(['exactly','smaller-scope','look-only'].includes(kind)){
      add('.fit-tool-ruler',[{transform:'rotate(0deg)'},{transform:'rotate(-2deg)'}],650);
      add('.fit-tool-scissors',[{transform:'rotate(0deg)'},{transform:'rotate(1.7deg)'}],700);
      add('.fit-tool-pencil',[{transform:'rotate(0deg)'},{transform:'rotate(-1.6deg)'}],650);
      add('.fit-tool-brush',[{transform:'rotate(0deg)'},{transform:'rotate(2deg)'}],750);
      add('.fit-tool-eraser',[{transform:'translateY(0px)'},{transform:'translateY(-1px)'}],650);
    }
    function run(direction){
      animations.forEach(function(item){
        var animation=item.animation;
        var current=Number(animation.currentTime)||0;
        if((direction<0&&current<=0)||(direction>0&&current>=item.duration))return;
        animation.playbackRate=direction;
        animation.play();
      });
    }
    function enter(){if(!fine.matches||reduced.matches)return;option.classList.add('is-option-hover');run(1);}
    function leave(){option.classList.remove('is-option-hover');run(-1);}
    option.addEventListener('pointerenter',enter);
    option.addEventListener('pointerleave',leave);
    option.addEventListener('pointercancel',leave);
    option.addEventListener('click',leave);
    controllers.push(function(){option.classList.remove('is-option-hover');animations.forEach(function(item){item.animation.pause();item.animation.currentTime=0;});});
  });
  function reset(){if(reduced.matches||!fine.matches)controllers.forEach(function(resetOne){resetOne();});}
  reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
})();
