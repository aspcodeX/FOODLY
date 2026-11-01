export function initScrollAnimations() {
  const elements = document.querySelectorAll(
    ".section-heading, .cuisine-card, .recipe-card, .editorial-copy, .editorial-art, .newsletter"
  );

  // Fallback if GSAP is unavailable
  if (!window.gsap || !window.ScrollTrigger) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach(element => {
      element.classList.add("reveal");
      observer.observe(element);
    });

    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  elements.forEach(element => {
    window.gsap.fromTo(
      element,
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true
        }
      }
    );
  });
}