const cards = Array.from(document.querySelectorAll(".accordion-card"));

function toggleCard(targetCard) {
  for (const card of cards) {
    const isTarget = card === targetCard;
    const willOpen = isTarget ? !card.classList.contains("is-open") : false;
    card.classList.toggle("is-open", willOpen);

    const trigger = card.querySelector(".accordion-trigger");
    if (trigger) {
      trigger.setAttribute("aria-expanded", String(willOpen));
    }
  }
}

for (const card of cards) {
  const trigger = card.querySelector(".accordion-trigger");

  if (!trigger) {
    continue;
  }

  trigger.addEventListener("click", () => toggleCard(card));
}
