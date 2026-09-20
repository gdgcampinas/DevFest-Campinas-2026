/** Feature: depoimentos de edições anteriores. Some se vazio. */
function testimonialCardMarkup(testimonial) {
  return `
    <div class="testimonial">
      <p class="testimonial-quote">“${testimonial.quote}”</p>
      <div class="testimonial-name">${testimonial.name}</div>
      ${testimonial.role ? `<div class="testimonial-role">${testimonial.role}</div>` : ""}
    </div>`;
}

function renderTestimonials(testimonials, sectionEl, gridEl) {
  sectionEl.hidden = testimonials.length === 0;
  if (testimonials.length === 0) return;
  gridEl.innerHTML = testimonials.map(testimonialCardMarkup).join("");
}
