(function(){
  'use strict';
  var stage=new URLSearchParams(location.search).get('stage')||'starting';
  var copy=window.FIT_APPROACH_COPY[stage];
  if(!copy){location.replace('stage.html');return;}
  document.querySelector('.fit-response-art').innerHTML=window.FIT_STAGE_RESPONSE_ICONS[stage];
  document.getElementById('approach-title').textContent=copy.title;
  document.getElementById('approach-description').textContent=copy.description;
  document.querySelector('.fit-next').href='approach.html?stage='+encodeURIComponent(stage);
  document.querySelector('.fit-back').href='stage.html';
})();
