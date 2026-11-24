(function(){
  'use strict';
  var params=new URLSearchParams(location.search);
  var stage=params.get('stage')||'starting';
  var approach=params.get('approach')||'exactly';
  var audience=params.get('audience')||'b2c';
  var sector=params.get('sector');
  var key='liat-match-sector:'+stage+':'+audience;
  if(!sector){try{sector=sessionStorage.getItem(key);}catch(error){}}
  var query='?stage='+encodeURIComponent(stage)+'&approach='+encodeURIComponent(approach)+'&audience='+encodeURIComponent(audience);
  var copy=Object.prototype.hasOwnProperty.call(window.FIT_SECTOR_RESULTS,sector)?window.FIT_SECTOR_RESULTS[sector]:null;
  if(!copy){location.replace('sector.html'+query);return;}
  document.getElementById('sector-result-title').textContent=copy.title;
  document.getElementById('sector-result-description').textContent=copy.description;
  var rays=document.getElementById('sector-match-rays');
  // SVG elements do not reflect the HTML `hidden` property consistently.
  if(copy.title==='Looks like a match')rays.removeAttribute('hidden');
  else rays.setAttribute('hidden','');
  document.getElementById('sector-result-prompt').hidden=!copy.matched;
  document.getElementById('sector-result-call').hidden=!copy.matched;
  document.getElementById('sector-result-retry').hidden=copy.matched;
  document.getElementById('sector-result-calendar').href=window.MATCH_FLOW_CONFIG.calendarUrl;
  document.getElementById('sector-result-back').href='sector.html'+query;
  document.title=copy.title+' — Liat Abadi';
  var canonical=document.querySelector('link[rel="canonical"]');
  if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}
  canonical.href='https://www.abadiguard.com/match-flow/sector-result.html?sector='+encodeURIComponent(sector);
})();
