/* =========================================================
   DVasquez Solutions — Interacciones
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  /* ---------- Año del footer ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Header con sombra al hacer scroll ---------- */
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menú móvil ---------- */
  const closeMenu = () => {
    navMenu.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  /* ---------- Link activo según la sección visible ---------- */
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) =>
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Animación de aparición ---------- */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    revealObserver.observe(el);
  });

  /* ---------- Contadores animados ---------- */
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll(".counter").forEach((c) => counterObserver.observe(c));

  /* ---------- Toggle de precios mensual / anual ---------- */
  const toggleBtns = document.querySelectorAll(".toggle-btn");
  toggleBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const period = btn.dataset.period;
      toggleBtns.forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".amount").forEach((amount) => {
        amount.textContent = amount.dataset[period];
      });
    })
  );

  /* ---------- Pre-seleccionar servicio al elegir un plan ---------- */
  const mensaje = document.getElementById("mensaje");
  const servicio = document.getElementById("servicio");
  document.querySelectorAll("[data-plan]").forEach((btn) =>
    btn.addEventListener("click", () => {
      servicio.value = "Mantenimiento web";
      if (!mensaje.value.trim()) {
        mensaje.value = `Hola, me interesa el plan de mantenimiento ${btn.dataset.plan}.`;
      }
    })
  );

  /* ---------- Validación y envío del formulario ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  const validators = {
    nombre: (v) => (v.trim().length >= 2 ? "" : "Ingresa tu nombre."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Ingresa un correo válido."),
    telefono: (v) => (!v.trim() || /^[+\d\s()-]{6,20}$/.test(v.trim()) ? "" : "Teléfono no válido."),
    servicio: (v) => (v ? "" : "Selecciona un servicio."),
    sitio: (v) => {
      if (!v.trim()) return "";
      try { new URL(v.trim()); return ""; } catch { return "Incluye https:// en la URL."; }
    },
    mensaje: (v) => (v.trim().length >= 10 ? "" : "Cuéntanos un poco más (mín. 10 caracteres)."),
  };

  const validateField = (field) => {
    const check = validators[field.name];
    if (!check) return true;
    const error = check(field.value);
    const group = field.closest(".form-group");
    group.classList.toggle("invalid", Boolean(error));
    group.querySelector(".error-msg").textContent = error;
    return !error;
  };

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".form-group")?.classList.contains("invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll("input, select, textarea")];
    const allValid = fields.map(validateField).every(Boolean);

    status.className = "form-status";
    if (!allValid) {
      status.textContent = "Revisa los campos marcados.";
      status.classList.add("error");
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      await sendForm(new FormData(form));
      status.textContent = "¡Gracias! Te responderemos en menos de 24 horas.";
      status.classList.add("success");
      form.reset();
    } catch (err) {
      console.error("Formulario:", err);
      status.textContent = "No se pudo enviar. Escríbenos por WhatsApp o correo.";
      status.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar solicitud";
    }
  });

  /**
   * Envío del formulario con FormSubmit (https://formsubmit.co).
   * Las solicitudes llegan al correo indicado en FORM_ENDPOINT.
   * IMPORTANTE: el primer envío dispara un correo de activación que hay que confirmar.
   * No funciona abriendo el HTML con doble clic (file://): usa Live Server o el sitio publicado.
   */
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/dhanferadrian@gmail.com";

  async function sendForm(data) {
    if (location.protocol === "file:") {
      alert("El formulario no puede enviarse abriendo el archivo con doble clic.\nÁbrelo con Live Server (VS Code) o desde el sitio publicado.");
      throw new Error("Página abierta como archivo local (file://)");
    }

    data.append("_subject", `Nueva solicitud web: ${data.get("servicio")} - ${data.get("nombre")}`);
    data.append("_template", "table");
    data.append("_replyto", data.get("email"));

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || String(result.success) !== "true") {
      throw new Error(result.message || "Error al enviar el formulario");
    }
  }
});
