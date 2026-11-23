(function(){
  'use strict';
  var header=document.createElement('header');
  header.className='fit-site-header';
  header.innerHTML='<button class="fit-site-menu-button" type="button" aria-label="Open navigation" aria-haspopup="dialog" aria-controls="fit-site-menu" aria-expanded="false"><img src="assets/menu-hamburger.svg" alt=""></button><a class="fit-site-logo" href="../index.html" aria-label="Liat Abadi home"><img src="assets/liat-abadi-logo.svg" alt="Liat Abadi"></a>';
  var menu=document.createElement('dialog');
  menu.id='fit-site-menu';menu.className='fit-site-menu';menu.setAttribute('aria-label','Site navigation');
  menu.innerHTML='<button class="fit-site-menu-close" type="button" aria-label="Close navigation">×</button><nav aria-label="Main navigation"><a href="../index.html">Home</a><a href="../index.html#work">Case studies</a><a href="../deconstructed.html">Notes on UX</a><a href="../faq.html">Questions, answered</a><a href="../index.html#contact">Are we a good fit?</a></nav>';
  document.body.append(header,menu);
  var trigger=header.querySelector('button');
  trigger.addEventListener('click',function(){menu.showModal();trigger.setAttribute('aria-expanded','true');});
  menu.querySelector('button').addEventListener('click',function(){menu.close();});
  menu.addEventListener('click',function(e){if(e.target===menu&&e.clientX>menu.getBoundingClientRect().right)menu.close();});
  menu.addEventListener('close',function(){trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});});
})();
