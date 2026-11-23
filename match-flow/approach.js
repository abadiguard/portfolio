(function(){
'use strict';
var stage=new URLSearchParams(location.search).get('stage')||'starting';
var copy=window.FIT_APPROACH_COPY[stage];
if(!copy){location.replace('stage.html');return;}
var form=document.getElementById('approach-form');
form.querySelector('.fit-back').href='stage-response.html?stage='+encodeURIComponent(stage);
var choices=Array.from(form.querySelectorAll('input[name="approach"]'));
var key='liat-match-approach:'+stage;
try{var saved=sessionStorage.getItem(key);choices.forEach(function(input){if(input.value===saved)input.checked=true;});}catch(error){}
var next=form.querySelector('.fit-next');
function updateNext(){var selected=form.querySelector('input[name="approach"]:checked');if(!selected)return;next.href=(selected.value==='look-only'?'look.html':'audience.html')+'?stage='+encodeURIComponent(stage)+'&approach='+encodeURIComponent(selected.value);}
form.addEventListener('change',function(event){if(event.target.name!=='approach')return;try{sessionStorage.setItem(key,event.target.value);}catch(error){}updateNext();});
window.addEventListener('pageshow',updateNext);
updateNext();
form.addEventListener('submit',function(event){event.preventDefault();});
})();
