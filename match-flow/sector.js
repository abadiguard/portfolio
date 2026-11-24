(function(){
  'use strict';
  var params=new URLSearchParams(location.search);
  var stage=params.get('stage')||'starting',approach=params.get('approach')||'exactly';
  var audience=params.get('audience');
  try{if(!['b2c','b2b','b2b2c'].includes(audience))audience=sessionStorage.getItem('liat-match-audience:'+stage);}catch(e){}
  if(!['b2c','b2b','b2b2c'].includes(audience))audience='b2c';
  var query='?stage='+encodeURIComponent(stage)+'&approach='+encodeURIComponent(approach)+'&audience='+encodeURIComponent(audience);
  var form=document.getElementById('sector-form'),track=form.querySelector('.fit-domain-options');
  var radios=Array.from(form.querySelectorAll('input[name="sector"]'));
  var next=form.querySelector('.fit-next'),status=document.getElementById('sector-status');
  var prevPage=form.querySelector('.fit-domain-page-prev'),nextPage=form.querySelector('.fit-domain-page-next');
  var key='liat-match-sector:'+stage+':'+audience;
  var desktop=matchMedia('(min-width:1136px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  form.querySelector('.fit-back').href='audience.html'+query;
  try{var saved=sessionStorage.getItem(key);if(radios.some(function(r){return r.value===saved;}))radios.forEach(function(r){r.checked=r.value===saved;});}catch(e){}
  function save(){var selected=radios.find(function(r){return r.checked;});if(selected){try{sessionStorage.setItem(key,selected.value);}catch(e){}next.disabled=false;next.removeAttribute('aria-disabled');status.hidden=true;}}
  form.addEventListener('change',save);
  function syncArrows(){
    var scrolling=track.scrollWidth>track.clientWidth+2;
    prevPage.hidden=!desktop.matches||!scrolling||track.scrollLeft<4;
    nextPage.hidden=!desktop.matches||!scrolling||track.scrollLeft>=track.scrollWidth-track.clientWidth-4;
  }
  function page(index,instant){
    var option=radios[index].closest('.fit-option');
    var offset=option.getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft-parseFloat(getComputedStyle(track).paddingLeft||0);
    track.scrollTo({left:Math.max(0,offset),behavior:instant||reduced.matches?'instant':'smooth'});
  }
  prevPage.addEventListener('click',function(){page(0);});
  nextPage.addEventListener('click',function(){page(3);});
  track.addEventListener('scroll',syncArrows,{passive:true});
  window.addEventListener('resize',syncArrows);
  desktop.addEventListener('change',syncArrows);
  document.addEventListener('fit:before-enter',function(){
    var selectedIndex=radios.findIndex(function(r){return r.checked;});
    if(saved&&selectedIndex>0){
      if(desktop.matches){if(selectedIndex>3)page(3,true);}
      else page(selectedIndex,true);
    }
    syncArrows();
  });
  if(typeof ResizeObserver==='function')new ResizeObserver(syncArrows).observe(track);
  next.addEventListener('click',function(){
    var selected=radios.find(function(r){return r.checked;});if(!selected)return;save();
    var url='sector-result.html'+query+'&sector='+encodeURIComponent(selected.value);
    if(typeof window.MatchFlowNavigate==='function')window.MatchFlowNavigate(url);else location.assign(url);
  });
  form.addEventListener('submit',function(event){event.preventDefault();next.click();});
  window.addEventListener('pageshow',function(){save();syncArrows();});
  save();syncArrows();
})();
