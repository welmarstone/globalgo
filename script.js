document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Mobile Menu Toggle ---
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-menu a");

  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");

      // Toggle icon between bars and times (X)
      const icon = mobileToggle.querySelector("i");
      if (navMenu.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    });
  }

  // Close mobile menu when a link is clicked
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      const icon = mobileToggle.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    });
  });

  // --- 2. Scroll Reveal Animation ---
  // This looks for any element with class="reveal" and adds "active" when it scrolls into view
  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          // Optional: Stop observing once revealed
          // observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      threshold: 0.15, // Trigger when 15% of the element is visible
      rootMargin: "0px",
    },
  );

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });
});
