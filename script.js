/* Mobile menu */
const menuButton=document.querySelector('.menu-toggle');
const siteNav=document.querySelector('.site-nav');
if(menuButton&&siteNav){
  menuButton.addEventListener('click',()=>{
    const open=menuButton.getAttribute('aria-expanded')==='true';
    menuButton.setAttribute('aria-expanded',String(!open));
    siteNav.classList.toggle('open',!open);
  });
  siteNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    menuButton.setAttribute('aria-expanded','false');
    siteNav.classList.remove('open');
  }));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&siteNav.classList.contains('open')){
      menuButton.setAttribute('aria-expanded','false');
      siteNav.classList.remove('open');
      menuButton.focus();
    }
  });
}

/* Footer year */
document.querySelectorAll('[data-year]').forEach(node=>node.textContent=String(new Date().getFullYear()));

/* Header turns solid once you scroll past the top of the hero */
const header=document.querySelector('.site-header');
if(header){
  const onScroll=()=>header.classList.toggle('scrolled',window.scrollY>24);
  onScroll();
  window.addEventListener('scroll',onScroll,{passive:true});
}

/* Reveal-on-scroll (CSS only animates when the user hasn't asked for reduced motion) */
if('IntersectionObserver' in window){
  const targets=document.querySelectorAll([
    '.section-heading','.location-card','.pastor-photo','.pastor-copy','.message-copy','.video-placeholder',
    '.prayer-content','.prayer-mark','.invitation-section>*','.visit-copy','.visit-card','.campus-intro>*',
    '.arrival-grid article','.ministry-card','.events-top','.event-placeholder','.local-contact>*',
    '.about-jump','.about-pastor-image','.pastor-letter-copy','.about-mission>*','.expect-grid article',
    '.beliefs-heading','.beliefs-list article','.faq-heading','.faq-list details','.about-bottom-cta>*',
    '.youth-intro>*','.youth-program','.youth-bottom>*','.give-intro-copy','.give-options article','.give-bottom>*',
    '.image-break span'
  ].join(','));
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target);}
    });
  },{rootMargin:'0px 0px -8% 0px',threshold:.05});
  targets.forEach((el,i)=>{
    el.classList.add('reveal');
    /* light stagger for siblings in the same grid */
    const idx=el.parentElement?[...el.parentElement.children].indexOf(el):0;
    if(['ministry-card','location-card'].some(c=>el.classList.contains(c))||el.matches('.arrival-grid article,.expect-grid article'))el.style.setProperty('--d',(Math.min(idx,3)*.08)+'s');
    io.observe(el);
  });
}
