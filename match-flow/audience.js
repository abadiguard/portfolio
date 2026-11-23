(function(){
  'use strict';
  var params=new URLSearchParams(location.search);
  var stage=params.get('stage')||'starting';
  var approach=params.get('approach')||'exactly';
  var query='?stage='+encodeURIComponent(stage)+'&approach='+encodeURIComponent(approach);
  var form=document.getElementById('audience-form');
  var choices=Array.from(form.querySelectorAll('input[name="audience"]'));
  var key='liat-match-audience:'+stage;
  var status=document.getElementById('audience-status');
  var next=form.querySelector('.fit-next');
  form.querySelector('.fit-back').href='approach.html'+query;
  try{var saved=sessionStorage.getItem(key);if(choices.some(function(input){return input.value===saved;}))choices.forEach(function(input){input.checked=input.value===saved;});}catch(error){}
  function save(){
    var selected=form.querySelector('input[name="audience"]:checked');
    if(selected){
      try{sessionStorage.setItem(key,selected.value);}catch(error){}
      next.href='sector.html'+query+'&audience='+encodeURIComponent(selected.value);
    }
  }
  form.addEventListener('change',function(){save();status.hidden=true;});
  next.addEventListener('click',save);
  window.addEventListener('pageshow',save);
  save();
  form.addEventListener('submit',function(event){event.preventDefault();form.querySelector('.fit-next').click();});
})();
