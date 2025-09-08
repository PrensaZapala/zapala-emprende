const directorioData = {
  sheetUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIoDcAP25sxxKlpGXeDLlx7n1TUTGoZHpZsh7AkpgEfa4zdsiKpMu005braW9JUy7Bj3VgHmGaKT4e/pub?gid=1075737631&single=true&output=tsv",
  assetsUrl: "assets/emprendedores/",
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderLinks(emp) {
  if (!mLinksContainer) {
    console.error("mLinksContainer element not found");
    return;
  }
  mLinksContainer.innerHTML = "";

  const allLinks = [];

  // 1. Enlace de la dirección
  if (emp.direccion && emp.direccion.trim() !== "") {
    allLinks.push({
      url: `https://maps.google.com/?q=${encodeURIComponent(emp.direccion)}`,
      text: emp.direccion,
      iconClass: 'fa-solid fa-location-dot'
    });
  }

  // 2. Enlace del teléfono
  if (emp.telefono && emp.telefono.trim() !== "") {
    allLinks.push({
      url: `tel:${emp.telefono.replace(/[^+\d]/g, "")}`,
      text: emp.telefono,
      iconClass: 'fa-solid fa-phone'
    });
  }

  // 3. Enlaces de redes sociales
  const socialSources = [
    {
      url: emp.web,
      text: emp.web_display || emp.web,
      iconClass: 'fa-solid fa-link'
    },
    {
      url: emp.facebook,
      text: emp.facebook_display || emp.facebook,
      iconClass: 'fa-brands fa-facebook'
    },
    {
      url: emp.instagram,
      text: emp.instagram_display || emp.instagram,
      iconClass: 'fa-brands fa-instagram'
    },
  ];

  socialSources.forEach((link) => {
    if (link.url && link.url.trim() !== "") {
      allLinks.push({
        url: link.url.startsWith("http") ? link.url : "https://" + link.url,
        text: link.text,
        iconClass: link.iconClass
      });
    }
  });

  // Renderizar todos los enlaces sin el separador, el espacio lo dará el CSS
  allLinks.forEach((linkData) => {
    const linkElement = document.createElement("a");
    linkElement.className = "dir-link-item";
    linkElement.href = linkData.url;
    linkElement.target = "_blank";
    linkElement.rel = "noopener";
    linkElement.innerHTML = `
      <span class="dir-link-icon"><i class="${linkData.iconClass}"></i></span>
      <span class="dir-link-text">${linkData.text}</span>
    `;

    mLinksContainer.appendChild(linkElement);
  });
}

let emprendedoresOriginales = [];
let emprendedoresAleatorios = [];
let sortOrder = "aleatorio";

const grid = document.getElementById("grid");
const count = document.getElementById("dir-count");
const countMobile = document.getElementById("dir-count-mobile");
const search = document.getElementById("search");
const searchMobile = document.getElementById("search-mobile");
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");
const mobileMenuClose = document.getElementById("mobile-menu-close");
const sortToggle = document.getElementById("sort-toggle");
const sortCheckbox = document.getElementById("sort-checkbox");

let searchTimeout;

function openMobileMenu() {
  mobileMenu.classList.add("open");
  hamburger.classList.add("active");
  document.body.style.overflow = "hidden";
  searchMobile.value = search.value;
  updateCountDisplay();
}

function closeMobileMenu() {
  mobileMenu.classList.remove("open");
  hamburger.classList.remove("active");
  document.body.style.overflow = "";
}

hamburger.addEventListener("click", openMobileMenu);
mobileMenuClose.addEventListener("click", closeMobileMenu);

mobileMenu.addEventListener("click", (e) => {
  if (e.target === mobileMenu) {
    closeMobileMenu();
  }
});

function getOrderedEntrepreneurs() {
  if (sortOrder === "alfabetico") {
    return [...emprendedoresOriginales].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  } else {
    return emprendedoresAleatorios;
  }
}

function generateNewRandomOrder() {
  emprendedoresAleatorios = shuffleArray(emprendedoresOriginales);
}

function syncSearch(sourceInput, targetInput) {
  targetInput.value = sourceInput.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(renderGridFiltered, 300);
}

search.addEventListener("input", () => syncSearch(search, searchMobile));
searchMobile.addEventListener("input", () => syncSearch(searchMobile, search));

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

fetch(directorioData.sheetUrl)
  .then((res) => {
    if (!res.ok) throw new Error("Error al cargar los datos");
    return res.text();
  })
  .then((tsvData) => {
    const lines = tsvData.trim().split("\n");
    const headers = lines[0].split("\t").map((h) => h.toLowerCase().trim());
    console.log("Headers:", headers);

    emprendedoresOriginales = lines
      .slice(1)
      .map((line) => {
        const values = line.split("\t");
        const row = {};
        headers.forEach((header, index) => {
          row[header] = (values[index] || "").trim();
        });

        console.log("Row data:", row);

        // Validar que carpeta exista y no esté vacía
        const carpeta =
          row.carpeta && row.carpeta.trim() !== "" ? row.carpeta : "default";
        const slug = generateSlug(row.emprendimiento || "");
        const emp = {
          id: slug,
          nombre: row.emprendimiento || "",
          emprendedor: row.emprendedor || "",
          rubro: row.productos || "",
          descripcion: row.descripcion || "",
          direccion: row.direccion || "",
          telefono: row.telefono || "",
          facebook: row.facebook || "",
          facebook_display: row.facebook_display || "",
          instagram: row.instagram || "",
          instagram_display: row.instagram_display || "",
          web: row["web-mail"] || "",
          web_display: row.web_display || "",
          logo: `${directorioData.assetsUrl}${carpeta}/logo.png`,
          fotos: Array.from(
            { length: 8 },
            (_, i) => `${directorioData.assetsUrl}${carpeta}/${i + 1}.jpg`
          ),
        };
        console.log("Parsed emp:", emp);
        return emp;
      })
      .filter((emp) => emp.nombre.trim() !== "");

    console.log("Total emprendedores:", emprendedoresOriginales.length);
    generateNewRandomOrder();
    renderGrid(getOrderedEntrepreneurs());

    const hash = location.hash.replace("#", "");
    if (hash) {
      const exists = emprendedoresOriginales.some((emp) => emp.id === hash);
      if (exists) openModal(hash);
    }
  })
  .catch((err) => {
    console.error("Error cargando datos:", err);
    grid.innerHTML =
      '<div class="error-message">Error al cargar los emprendedores. Por favor, recarga la página.</div>';
  });

function updateCountDisplay() {
  const currentCount = count.textContent;
  if (countMobile) {
    countMobile.textContent = currentCount;
  }
}

function toggleSortOrder() {
  const wasAlphabetical = sortOrder === "alfabetico";
  sortOrder = sortCheckbox.checked ? "alfabetico" : "aleatorio";

  if (wasAlphabetical && sortOrder === "aleatorio") {
    generateNewRandomOrder();
  }

  renderGridFiltered();
}

sortToggle.addEventListener("click", () => {
  sortCheckbox.checked = !sortCheckbox.checked;
  toggleSortOrder();
});

function renderGridFiltered() {
  const q = normalize(search.value || searchMobile.value);
  const orderedItems = getOrderedEntrepreneurs();

  let filtered = orderedItems.filter(
    (emp) =>
      normalize(emp.nombre).includes(q) || normalize(emp.rubro).includes(q)
  );

  renderGrid(filtered);
}

function renderGrid(items) {
  try {
    if (!items.length) {
      grid.innerHTML =
        '<div class="error-message">No se encontraron emprendedores con esos criterios.</div>';
      count.textContent = "0 emprendedores";
      updateCountDisplay();
      return;
    }

    grid.innerHTML = "";
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints;
    items.forEach((emp) => {
      const a = document.createElement("button");
      a.className = "card";
      a.setAttribute("role", "listitem");
      a.setAttribute("aria-label", `Ver detalles de ${emp.nombre}`);
      a.addEventListener("click", () => openModal(emp.id));
      a.innerHTML = `
<div class="logo">
  <img class="logo-img" src="${emp.logo}" alt="Logo de ${emp.nombre}" ${
        isMobile ? "" : 'loading="lazy"'
      } />
</div>
<div class="name">${emp.nombre}</div>
<div class="small">${emp.rubro}</div>
`;
      grid.appendChild(a);
    });

    // Manejo de imágenes en las tarjetas
    document.querySelectorAll(".logo-img").forEach((img) => {
      // Verificar si la imagen ya está cargada (puede estar en caché)
      if (img.complete && img.naturalWidth !== 0) {
        console.log(`Imagen ya cargada: ${img.src}`);
        img.parentElement.classList.remove("image-placeholder");
      } else {
        img.addEventListener(
          "error",
          () => {
            console.error(`Error cargando imagen: ${img.src}`);
            img.classList.add("error");
            img.parentElement.classList.add("image-placeholder");
          },
          { once: true }
        );
        img.addEventListener(
          "error",
          () => {
            console.error(`Error cargando imagen: ${img.src}`);
            img.classList.add("error");
            img.parentElement.classList.add("image-placeholder");

            const span = document.createElement("span");
            span.textContent = "Sin imagen";
            img.parentElement.appendChild(span);
          },
          { once: true }
        );
      }
    });

    const countText = `${items.length} emprendedor${
      items.length === 1 ? "" : "es"
    }`;
    count.textContent = countText;
    updateCountDisplay();
  } catch (error) {
    console.error("Error in renderGrid:", error);
    grid.innerHTML =
      '<div class="error-message">Error al renderizar la grilla. Por favor, recarga la página.</div>';
  }
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const modal = document.getElementById("modal");
const closeBtn = document.getElementById("close");
const mLogo = document.getElementById("m-logo");
const mName = document.getElementById("m-name");
const mTag = document.getElementById("m-tag");
const mDesc = document.getElementById("m-desc");
const mLinksContainer = document.getElementById("m-links-container");
const gStage = document.getElementById("g-stage");
const gStageContainer = document.getElementById("g-stage-container");
const thumbs = document.getElementById("thumbs");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

let active = null;
let gi = 0;
let fotosValidas = [];

function openModal(id) {
  try {
    const emp = emprendedoresOriginales.find((e) => e.id === id);
    console.log("Emp seleccionado:", emp);
    if (!emp) {
      console.warn(`Emprendedor con ID ${id} no encontrado`);
      return;
    }

    if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    }

    active = emp;
    gi = 0;

    fotosValidas = [];
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints;
    const checkImages = emp.fotos.map((src, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log(`Imagen de galería cargada: ${src}`);
          resolve({ src, index, exists: true });
        };
        img.onerror = () => {
          console.error(`Error cargando imagen de galería: ${src}`);
          resolve({ src, index, exists: false });
        };
        img.src = src;
      });
    });

    Promise.all(checkImages).then((results) => {
      fotosValidas = results.filter((r) => r.exists).map((r) => r.src);
      if (fotosValidas.length === 0) {
        fotosValidas = [emp.logo];
      }
      renderGallery();
    });

    const mLogoContainer = mLogo.parentElement;
    mLogo.src = emp.logo;
    mLogo.alt = `Logo de ${emp.nombre}`;
    if (mLogo.complete && mLogo.naturalWidth !== 0) {
      console.log(`Logo ya cargado: ${emp.logo}`);
      mLogoContainer.classList.remove("image-placeholder");
    } else {
      mLogo.addEventListener(
        "load",
        () => {
          console.log(`Logo cargado: ${emp.logo}`);
          mLogoContainer.classList.remove("image-placeholder");
        },
        { once: true }
      );
      mLogo.addEventListener(
        "error",
        () => {
          console.error(`Error cargando logo en modal: ${emp.logo}`);
          mLogo.classList.add("error");
          mLogoContainer.classList.add("image-placeholder");
        },
        { once: true }
      );
    }

    mName.textContent = emp.nombre;
    mTag.textContent = emp.rubro;

    if (emp.descripcion && emp.descripcion.trim() !== "") {
      mDesc.textContent = emp.descripcion;
      mDesc.style.display = "";
    } else {
      mDesc.style.display = "none";
    }

    renderLinks(emp);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    history.pushState(null, null, `#${emp.id}`);

    gStageContainer.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    gStageContainer.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    gStageContainer.addEventListener("touchend", handleTouchEnd);
  } catch (error) {
    console.error("Error in openModal:", error);
    closeModal();
  }
}

let startX = 0;
let startY = 0;
let distX = 0;
let distY = 0;
let threshold = 50;
let allowedTime = 300;
let elapsedTime = 0;
let startTime = 0;

function handleTouchStart(e) {
  if (e.target.closest("#g-stage-container")) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = new Date().getTime();
    e.preventDefault();
  }
}

function handleTouchMove(e) {
  if (e.target.closest("#g-stage-container")) {
    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  if (!active || !fotosValidas.length) return;
  if (e.target.closest("#g-stage-container")) {
    const touch = e.changedTouches[0];
    distX = touch.clientX - startX;
    distY = touch.clientY - startY;
    elapsedTime = new Date().getTime() - startTime;

    if (
      elapsedTime <= allowedTime &&
      Math.abs(distX) >= threshold &&
      Math.abs(distY) <= 100
    ) {
      if (distX > 0) {
        prevPhoto();
      } else {
        nextPhoto();
      }
    }
  }
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  gStageContainer.removeEventListener("touchstart", handleTouchStart);
  gStageContainer.removeEventListener("touchmove", handleTouchMove);
  gStageContainer.removeEventListener("touchend", handleTouchEnd);

  active = null;
  fotosValidas = [];

  if (location.hash.startsWith("#")) {
    history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.search
    );
  }
}

closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modal.classList.contains("open")) {
      closeModal();
    } else if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    }
  }
  if (!active || !fotosValidas.length) return;
  if (e.key === "ArrowRight") nextPhoto();
  if (e.key === "ArrowLeft") prevPhoto();
});

function renderGallery() {
  try {
    if (!active || !fotosValidas.length) return;

    if (gi >= fotosValidas.length) gi = 0;
    if (gi < 0) gi = fotosValidas.length - 1;

    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints;
    gStage.src = fotosValidas[gi];
    gStage.alt = `Foto ${gi + 1} de ${fotosValidas.length} de ${active.nombre}`;
    if (gStage.complete && gStage.naturalWidth !== 0) {
      console.log(`Imagen de galería ya cargada: ${gStage.src}`);
      gStage.parentElement.classList.remove("image-placeholder");
    } else {
      gStage.addEventListener(
        "load",
        () => {
          console.log(`Imagen de galería cargada: ${gStage.src}`);
          gStage.parentElement.classList.remove("image-placeholder");
        },
        { once: true }
      );
      gStage.addEventListener(
        "error",
        () => {
          console.error(`Error cargando imagen de galería: ${gStage.src}`);
          gStage.classList.add("error");
          gStage.parentElement.classList.add("image-placeholder");
        },
        { once: true }
      );
    }

    thumbs.innerHTML = "";
    fotosValidas.forEach((src, idx) => {
      const thumbContainer = document.createElement("div");
      thumbContainer.className = "thumb-container";
      // CAMBIO 1: Eliminar el span del innerHTML inicial
      thumbContainer.innerHTML = `
        <img src="${src}" alt="Miniatura ${idx + 1}" ${
        isMobile ? "" : 'loading="lazy"'
      } />
      `;
      if (idx === gi)
        thumbContainer.querySelector("img").classList.add("active");
      const thumbImg = thumbContainer.querySelector("img");
      thumbImg.addEventListener("click", () => {
        gi = idx;
        renderGallery();
      });
      if (thumbImg.complete && thumbImg.naturalWidth !== 0) {
        console.log(`Miniatura ya cargada: ${src}`);
        thumbContainer.classList.remove("image-placeholder");
      } else {
        thumbImg.addEventListener(
          "load",
          () => {
            console.log(`Miniatura cargada: ${src}`);
            thumbContainer.classList.remove("image-placeholder");
          },
          { once: true }
        );
        // CAMBIO 2: Añadir el span en el manejador de error
        thumbImg.addEventListener(
          "error",
          () => {
            console.error(`Error cargando miniatura: ${src}`);
            thumbImg.classList.add("error");
            thumbContainer.classList.add("image-placeholder"); // Agrega la clase al contenedor
            const span = document.createElement("span"); // Crea el span
            span.textContent = "Sin imagen";
            thumbContainer.appendChild(span); // Añade el span al contenedor
          },
          { once: true }
        );
      }
      thumbs.appendChild(thumbContainer);
    });

    const hasMultiplePhotos = fotosValidas.length > 1;
    prev.style.display = hasMultiplePhotos ? "block" : "none";
    next.style.display = hasMultiplePhotos ? "block" : "none";

    if (hasMultiplePhotos) {
      const activeThumb = thumbs.querySelector(".active");
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  } catch (error) {
    console.error("Error in renderGallery:", error);
  }
}

next.addEventListener("click", nextPhoto);
prev.addEventListener("click", prevPhoto);

function nextPhoto() {
  if (!active || !fotosValidas.length) return;
  gi = (gi + 1) % fotosValidas.length;
  renderGallery();
}

function prevPhoto() {
  if (!active || !fotosValidas.length) return;
  gi = (gi - 1 + fotosValidas.length) % fotosValidas.length;
  renderGallery();
}

window.addEventListener("popstate", () => {
  const hash = location.hash.replace("#", "");
  if (hash && emprendedoresOriginales.some((emp) => emp.id === hash)) {
    openModal(hash);
  } else if (modal.classList.contains("open")) {
    closeModal();
  }
});

modal.addEventListener("focus", (e) => {
  if (!modal.contains(e.target)) {
    closeBtn.focus();
  }
});

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("open")) return;

  if (e.key === "Tab") {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
});

if ("ontouchstart" in window || navigator.maxTouchPoints) {
  console.log("Dispositivo táctil detectado");
  document.body.classList.add("touch-device");

  const addTouchFeedback = () => {
    const buttons = document.querySelectorAll("button, .card");
    buttons.forEach((button) => {
      if (!button.hasAttribute("data-touch-enabled")) {
        button.setAttribute("data-touch-enabled", "true");

        button.addEventListener("touchstart", function () {
          this.classList.add("touch-active");
        });

        button.addEventListener("touchend", function () {
          setTimeout(() => {
            this.classList.remove("touch-active");
          }, 100);
        });

        button.addEventListener("touchcancel", function () {
          this.classList.remove("touch-active");
        });
      }
    });
  };

  addTouchFeedback();

  const observer = new MutationObserver(() => {
    addTouchFeedback();
  });

  observer.observe(grid, { childList: true });
}
