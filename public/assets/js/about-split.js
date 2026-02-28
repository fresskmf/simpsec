document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".about-split-section");
  if (!section) return;

  const accordion = section.querySelector("#aboutSplitAccordion");
  if (!accordion) return;

  const images = Array.from(section.querySelectorAll(".about-split-img"));
  const setActiveImage = (id) => {
    if (!id) return;
    images.forEach(img => img.classList.toggle("is-active", img.id === id));
  };

  // Sync image when a panel finishes opening (works with Bootstrap)
  section.querySelectorAll(".accordion-collapse").forEach(collapseEl => {
    collapseEl.addEventListener("shown.bs.collapse", (e) => {
      const btn = section.querySelector(`button[data-bs-target="#${e.target.id}"]`);
      const imgId = btn?.dataset?.aboutImage;
      setActiveImage(imgId);
    });
  });

  // Initial sync (in case the first is already open)
  const openCollapse = section.querySelector(".accordion-collapse.show");
  if (openCollapse) {
    const btn = section.querySelector(`button[data-bs-target="#${openCollapse.id}"]`);
    setActiveImage(btn?.dataset?.aboutImage);
  } else {
    const firstBtn = section.querySelector("button[data-about-image]");
    setActiveImage(firstBtn?.dataset?.aboutImage);
  }
});
