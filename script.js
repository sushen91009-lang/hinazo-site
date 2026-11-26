(function () {
  var button = document.querySelector(".menu-button");
  var nav = document.getElementById("site-nav");
  if (!button || !nav) return;

  function setOpen(open) {
    button.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
  }

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      button.focus();
    }
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });
})();

/* The language buttons: what is chosen is remembered on this device (see lang.js). */
(function () {
  var links = document.querySelectorAll(".lang-switch a[data-lang]");
  for (var i = 0; i < links.length; i += 1) {
    links[i].addEventListener("click", function (event) {
      try {
        window.localStorage.setItem("hinazou-lang", event.currentTarget.getAttribute("data-lang"));
      } catch (error) {}
    });
  }
})();
