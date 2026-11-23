(function(){
'use strict';
var form=document.getElementById('product-stage-form');
var key='liat-match-product-stage';
var choices=Array.from(form.querySelectorAll('input[name="product-stage"]'));
try{var saved=sessionStorage.getItem(key);choices.forEach(function(input){if(input.value===saved)input.checked=true;});}catch(error){}
var next=form.querySelector('.fit-start');
function updateNext(){
  var selected=form.querySelector('input[name="product-stage"]:checked');
  var available=selected&&Boolean(window.FIT_APPROACH_COPY[selected.value]);
  if(available){next.href='stage-response.html?stage='+encodeURIComponent(selected.value);next.removeAttribute('aria-disabled');}
  else{next.removeAttribute('href');next.setAttribute('aria-disabled','true');}
}
form.addEventListener('change',function(event){if(event.target.name!=='product-stage')return;try{sessionStorage.setItem(key,event.target.value);}catch(error){}updateNext();});
next.addEventListener('click',function(event){if(next.getAttribute('aria-disabled')==='true')event.preventDefault();});
window.addEventListener('pageshow',updateNext);
updateNext();
form.addEventListener('submit',function(event){event.preventDefault();});
})();
