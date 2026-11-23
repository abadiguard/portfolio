(function(){
  'use strict';
  // Run in the head so native restoration cannot reveal an old scroll position.
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  window.addEventListener('pageshow',function(){
    if('scrollRestoration' in history)history.scrollRestoration='manual';
    window.scrollTo({top:0,left:0,behavior:'instant'});
  });
})();
