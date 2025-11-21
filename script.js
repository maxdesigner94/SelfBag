// script.js
// Carousel minimal, smooth scroll, hash navigation

document.addEventListener('DOMContentLoaded', function(){
  // Carousel
  const slides = Array.from(document.querySelectorAll('.slide'));
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const dotsContainer = document.querySelector('.carousel-dots');

  let idx = 0;
  function updateSlides(n){
    slides.forEach(s => s.classList.remove('active'));
    slides[n].classList.add('active');
    // update dots
    Array.from(dotsContainer.children).forEach((d,i)=> d.classList.toggle('active', i===n));
    idx = n;
  }

  // build dots
  slides.forEach((s,i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label','Vai alla slide ' + (i+1));
    b.addEventListener('click', () => updateSlides(i));
    if(i===0) b.classList.add('active');
    dotsContainer.appendChild(b);
  });

  prevBtn.addEventListener('click', () => updateSlides((idx-1+slides.length)%slides.length));
  nextBtn.addEventListener('click', () => updateSlides((idx+1)%slides.length));

  // Auto-rotate (gentle)
  let rotate = setInterval(()=> updateSlides((idx+1)%slides.length), 7000);
  // Pause on hover
  const carousel = document.querySelector('.hero-carousel');
  carousel.addEventListener('mouseenter', ()=> clearInterval(rotate));
  carousel.addEventListener('mouseleave', ()=> rotate = setInterval(()=> updateSlides((idx+1)%slides.length), 7000));

  // Smooth scroll & hash handling
  const scrollLinks = Array.from(document.querySelectorAll('a[data-scroll]'));
  function smoothScrollTo(hash){
    const el = document.querySelector(hash);
    if(!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80; // offset header
    window.scrollTo({top, behavior:'smooth'});
    // update hash without jumping
    history.replaceState(null, '', hash);
  }

  scrollLinks.forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      smoothScrollTo(a.getAttribute('href'));
    });
  });

  // If page loads with hash, scroll to it
  if(location.hash){
    setTimeout(()=> smoothScrollTo(location.hash), 200);
  }

  // Keyboard accessibility for carousel
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft') prevBtn.click();
    if(e.key === 'ArrowRight') nextBtn.click();
  });

  // Make sure focus order for internal links is logical
  // (No additional actions required here)
});
