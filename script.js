document.getElementById("year").textContent = new Date().getFullYear();

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

document.getElementById("loginButton").addEventListener("click", () => {
  const api = (window.PULSE_API_BASE || "").replace(/\/$/, "");
  if (api.startsWith("https://") && !api.includes("SET-YOUR-API-HOST")) {
    window.location.href = api + "/api/login";
  } else {
    document.getElementById("loginNotice").textContent =
      "Setup required: configure the secure HTTPS API address in dashboard-config.js first. Never put your bot token or OAuth client secret in website JavaScript.";
  }
});
