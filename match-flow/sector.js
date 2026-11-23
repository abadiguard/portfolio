(function(){
  'use strict';
  var params=new URLSearchParams(location.search);
  var stage=params.get('stage')||'starting';
  var approach=params.get('approach')||'exactly';
  var audience=params.get('audience');
  try{if(!['b2c','b2b','b2b2c'].includes(audience))audience=sessionStorage.getItem('liat-match-audience:'+stage);}catch(error){}
  if(!['b2c','b2b','b2b2c'].includes(audience))audience='b2c';
  var query='?stage='+encodeURIComponent(stage)+'&approach='+encodeURIComponent(approach)+'&audience='+encodeURIComponent(audience);
  var key='liat-match-sector:'+stage+':'+audience;
  var form=document.getElementById('sector-form');
  var dropdown=document.getElementById('sector-dropdown');
  var trigger=document.getElementById('sector-trigger');
  var menu=document.getElementById('sector-menu');
  var label=document.getElementById('sector-selected');
  var value=document.getElementById('sector-value');
  var next=form.querySelector('.fit-next');
  var status=document.getElementById('sector-status');
  var options=Array.from(menu.querySelectorAll('[role="option"]'));
  var active=0,typed='',typingTimer=null;
  var mobilePopup=document.createElement('dialog');
  mobilePopup.className='fit-sector-popup';
  mobilePopup.setAttribute('aria-label','Choose your product domain');
  var popupClose=document.createElement('button');
  popupClose.type='button';popupClose.className='fit-sector-popup-close';
  popupClose.setAttribute('aria-label','Close domain selection');popupClose.innerHTML='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l12 12M15 3L3 15"/></svg>';
  mobilePopup.appendChild(popupClose);dropdown.appendChild(mobilePopup);
  var menuHome=menu.parentNode;
  menu.setAttribute('tabindex','-1');
  function mobile(){return window.matchMedia('(max-width:768px)').matches;}
  popupClose.addEventListener('click',function(){close();trigger.focus({preventScroll:true});});
  mobilePopup.addEventListener('cancel',function(event){event.preventDefault();close();trigger.focus({preventScroll:true});});
  form.querySelector('.fit-back').href='audience.html'+query;
  function isOpen(){return trigger.getAttribute('aria-expanded')==='true';}
  function position(){
    if(mobilePopup.open){menu.style.height='';menu.style.maxHeight='';return;}
    var viewport=window.visualViewport;
    var top=viewport?viewport.offsetTop:0;
    var bottom=top+(viewport?viewport.height:window.innerHeight);
    // Keep the open list above the persistent Back / Next bar.
    var footer=next.parentElement;
    if(footer&&typeof footer.getBoundingClientRect==='function')bottom=Math.min(bottom,footer.getBoundingClientRect().top-8);
    var rect=trigger.getBoundingClientRect();
    var below=bottom-rect.bottom-16;
    dropdown.classList.remove('opens-up');
    // Set an explicit border-box height: three rows plus the fourth heading.
    var fourth=options[3];
    var peekHeight=280;
    if(fourth&&typeof fourth.getBoundingClientRect==='function'){
      peekHeight=fourth.getBoundingClientRect().top-menu.getBoundingClientRect().top+menu.scrollTop+32;
    }
    var menuHeight=Math.min(Math.max(80,peekHeight),Math.max(80,below));
    menu.style.height=menuHeight+'px';
    menu.style.maxHeight=menuHeight+'px';
  }
  function mark(index,scroll){
    active=Math.max(0,Math.min(options.length-1,index));
    options.forEach(function(option,i){option.classList.toggle('active',i===active);});
    trigger.setAttribute('aria-activedescendant',options[active].id);
    menu.setAttribute('aria-activedescendant',options[active].id);
    if(scroll){
      var row=options[active],top=row.offsetTop,bottom=top+row.offsetHeight;
      if(top<menu.scrollTop)menu.scrollTop=top;
      else if(bottom>menu.scrollTop+menu.clientHeight)menu.scrollTop=bottom-menu.clientHeight;
    }
  }
  function open(){
    menu.hidden=false;dropdown.classList.add('open');
    trigger.setAttribute('aria-expanded','true');
    if(mobile()){
      mobilePopup.appendChild(menu);mobilePopup.showModal();menu.focus({preventScroll:true});
    }
    position();
    var index=options.findIndex(function(option){return option.dataset.value===value.value;});
    mark(index<0?0:index,true);
  }
  function close(){
    dropdown.classList.remove('open');menu.hidden=true;
    if(mobilePopup.open)mobilePopup.close();
    if(menu.parentNode!==menuHome)menuHome.appendChild(menu);
    trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');
    options.forEach(function(option){option.classList.remove('active');});
  }
  function choose(index,announce){
    var option=options[index];
    value.value=option.dataset.value;
    label.textContent=option.querySelector('.fit-sector-option-title').textContent;
    options.forEach(function(row){var selected=row===option;row.setAttribute('aria-selected',String(selected));row.classList.toggle('selected',selected);});
    next.disabled=false;next.setAttribute('aria-disabled','false');status.hidden=true;
    try{sessionStorage.setItem(key,value.value);}catch(error){}
    if(announce){close();trigger.focus({preventScroll:true});form.dispatchEvent(new Event('fit:selection'));}
  }
  trigger.addEventListener('click',function(){isOpen()?close():open();});
  function handleKeys(event){
    var key=event.key;
    if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(key)){
      event.preventDefault();
      if(!isOpen()){
        open();if(key==='End'||key==='ArrowUp')mark(options.length-1,true);return;
      }
      if(key==='ArrowDown')mark(active+1,true);
      else if(key==='ArrowUp')mark(active-1,true);
      else if(key==='Home')mark(0,true);
      else if(key==='End')mark(options.length-1,true);
      else choose(active,true);
    }else if(key==='Escape'){if(isOpen()){event.preventDefault();close();trigger.focus({preventScroll:true});}}
    else if(key==='Tab'&&!mobilePopup.open)close();
    else if(key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      if(!isOpen())open();
      typed+=key.toLowerCase();window.clearTimeout(typingTimer);
      var index=options.findIndex(function(option){return option.querySelector('.fit-sector-option-title').textContent.toLowerCase().startsWith(typed);});
      if(index>=0)mark(index,true);
      typingTimer=window.setTimeout(function(){typed='';},700);
    }
  }
  trigger.addEventListener('keydown',handleKeys);
  menu.addEventListener('keydown',handleKeys);
  trigger.addEventListener('keyup',function(event){if(event.key===' ')event.preventDefault();});
  options.forEach(function(option,index){
    option.addEventListener('click',function(){choose(index,true);});
    option.addEventListener('pointermove',function(){if(isOpen())mark(index,false);});
  });
  document.addEventListener('click',function(event){if(!dropdown.contains(event.target))close();});
  form.addEventListener('focusout',function(event){
    // Clicking a non-focusable menu row can blur the trigger to the body
    // before its click fires. Keep the menu open until selection/outside click.
    if(event.relatedTarget&&!dropdown.contains(event.relatedTarget))close();
  });
  window.addEventListener('resize',function(){if(isOpen())position();});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',function(){if(isOpen())position();});
  window.addEventListener('pagehide',close);
  var saved;
  try{saved=sessionStorage.getItem(key);}catch(error){}
  var index=options.findIndex(function(option){return option.dataset.value===saved;});
  if(index>=0)choose(index,false);
  next.addEventListener('click',function(){
    if(next.disabled)return;
    var url='sector-result.html'+query+'&sector='+encodeURIComponent(value.value);
    if(typeof window.MatchFlowNavigate==='function')window.MatchFlowNavigate(url);
    else location.assign(url);
  });
  form.addEventListener('submit',function(event){event.preventDefault();if(!next.disabled)next.click();});
})();
