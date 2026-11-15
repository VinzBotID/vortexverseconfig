const API = "/api/config";

const ZIP_FOLDER =
  "com.dts.freefireth/file/contentcache/Optional/android/gameassetbundles/";

const CATEGORY_NAMES = {
  rambut: "RAMBUT",
  masker: "MASKER",
  face: "FACE",
  baju: "BAJU",
  celana: "CELANA",
  sepatu: "SEPATU"
};

const CATEGORY_ORDER = [
  "rambut",
  "masker",
  "face",
  "baju",
  "celana",
  "sepatu"
];

let configs = [];
const selected = new Set();

const grid = document.getElementById("configGrid");
const statusText = document.getElementById("statusText");
const downloadBtn = document.getElementById("downloadBtn");
const searchInput = document.getElementById("searchInput");

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getCategory(item) {
  const category = String(item.category || "").toLowerCase();

  return CATEGORY_NAMES[category]
    ? category
    : "lainnya";
}

function render(list = configs) {
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        ${configs.length
          ? "Config tidak ditemukan."
          : "Belum ada config yang tersedia."}
      </div>
    `;

    updateSelection();
    return;
  }

  const grouped = {};

  list.forEach(item => {
    const category = getCategory(item);

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  });

  const orderedCategories = [
    ...CATEGORY_ORDER.filter(category => grouped[category]),
    ...(grouped.lainnya ? ["lainnya"] : [])
  ];

  grid.innerHTML = orderedCategories.map(category => {
    const items = grouped[category];

    return `
      <section class="config-category">

        <div class="category-heading">
          <div>
            <span class="eyebrow">JENIS ITEM</span>
            <h3>${CATEGORY_NAMES[category] || "LAINNYA"}</h3>
          </div>

          <span class="catalog-count">
            ${items.length} FILE
          </span>
        </div>

        <div class="config-category-grid">
          ${items.map(item => {
            const isSelected = selected.has(item.id);

            const thumb = item.imageUrl
              ? `<img
                  class="config-thumb"
                  src="${safeText(item.imageUrl)}"
                  alt=""
                  loading="lazy"
                  onerror="this.style.display='none'"
                >`
              : `<div class="config-thumb config-placeholder">V</div>`;

            return `
              <article
                class="config-card ${isSelected ? "selected" : ""}"
                data-id="${safeText(item.id)}"
                role="checkbox"
                aria-checked="${isSelected}"
                tabindex="0"
              >
                ${thumb}

                <div class="config-info">
                  <strong>${safeText(item.title)}</strong>
                  <small>${safeText(item.fileName || "Config file")}</small>
                </div>

                <span class="check-mark">✓</span>
              </article>
            `;
          }).join("")}
        </div>

      </section>
    `;
  }).join("");

  grid.querySelectorAll(".config-card").forEach(card => {
    const toggle = () => toggleItem(card.dataset.id);

    card.addEventListener("click", toggle);

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  updateSelection();
}

function toggleItem(id) {
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    selected.add(id);
  }

  renderFiltered();
}

function renderFiltered() {
  const term = searchInput.value.trim().toLowerCase();

  const filtered = configs.filter(item => {
    const category = CATEGORY_NAMES[getCategory(item)] || "lainnya";

    return `
      ${item.title || ""}
      ${item.fileName || ""}
      ${category}
    `.toLowerCase().includes(term);
  });

  render(filtered);
}

function updateSelection() {
  const count = selected.size;

  document.getElementById("countText").textContent = count;

  document.getElementById("downloadCount").textContent =
    `${configs.length} FILE`;

  downloadBtn.disabled = count === 0;

  downloadBtn.innerHTML = count
    ? `DOWNLOAD ${count} FILE <span>↗</span>`
    : `DOWNLOAD ZIP <span>↗</span>`;

  grid.querySelectorAll(".config-card").forEach(card => {
    const active = selected.has(card.dataset.id);

    card.classList.toggle("selected", active);
    card.setAttribute("aria-checked", String(active));
  });
}

async function loadConfigs() {
  grid.innerHTML = `
    <div class="empty-state">Memuat daftar config...</div>
  `;

  try {
    const response = await fetch(API, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil daftar config.");
    }

    const data = await response.json();

    configs = Array.isArray(data)
      ? data
      : (data.items || []);

    selected.clear();

    document.getElementById("totalConfig").textContent =
      configs.length;

    renderFiltered();

    statusText.textContent = configs.length
      ? ""
      : "Config akan muncul setelah admin mengunggah file.";

  } catch (error) {
    grid.innerHTML = `
      <div class="empty-state">
        Tidak dapat memuat config. Silakan muat ulang halaman.
      </div>
    `;

    statusText.textContent = error.message;
  }
}

// PILIH SEMUA FILE YANG SEDANG DITAMPILKAN
document.getElementById("selectAllBtn")
  .addEventListener("click", () => {
    const term = searchInput.value.trim().toLowerCase();

    configs
      .filter(item => {
        const category = CATEGORY_NAMES[getCategory(item)] || "lainnya";

        return `
          ${item.title || ""}
          ${item.fileName || ""}
          ${category}
        `.toLowerCase().includes(term);
      })
      .forEach(item => selected.add(item.id));

    renderFiltered();
  });

// BATALKAN SEMUA PILIHAN
document.getElementById("clearBtn")
  .addEventListener("click", () => {
    selected.clear();
    renderFiltered();
  });

// PENCARIAN
searchInput.addEventListener("input", renderFiltered);

// DOWNLOAD ZIP
downloadBtn.addEventListener("click", async () => {
  const items = configs.filter(item =>
    selected.has(item.id)
  );

  if (!items.length) return;

  if (typeof JSZip === "undefined") {
    statusText.textContent =
      "Library ZIP gagal dimuat. Periksa koneksi internet.";
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "MENYIAPKAN ZIP...";

  statusText.textContent =
    "Sedang mengunduh dan mengemas file config...";

  try {
    const zip = new JSZip();
    const folder = zip.folder(ZIP_FOLDER);
    const usedNames = new Set();

    for (const item of items) {
      if (!item.fileUrl) {
        throw new Error(
          `URL file ${item.title} tidak tersedia.`
        );
      }

      const response = await fetch(item.fileUrl);

      if (!response.ok) {
        throw new Error(
          `Gagal mengambil file: ${item.title}`
        );
      }

      const blob = await response.blob();

      let fileName = String(
        item.fileName || "config.bin"
      ).split(/[\\/]/).pop();

      fileName = fileName
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .trim() || "config.bin";

      let finalName = fileName;

      if (usedNames.has(finalName.toLowerCase())) {
        const dot = fileName.lastIndexOf(".");
        const base = dot > 0
          ? fileName.slice(0, dot)
          : fileName;

        const ext = dot > 0
          ? fileName.slice(dot)
          : "";

        finalName =
          `${base}_${String(item.id).slice(-6)}${ext}`;
      }

      usedNames.add(finalName.toLowerCase());

      folder.file(finalName, blob);
    }

    const output = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 5
      }
    });

    const url = URL.createObjectURL(output);

    const link = document.createElement("a");
    link.href = url;
    link.download = "VORTEX_CONFIG.zip";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    statusText.textContent =
      `${items.length} config berhasil dikemas ke ZIP.`;

  } catch (error) {
    statusText.textContent =
      error.message || "Terjadi kesalahan saat membuat ZIP.";

  } finally {
    downloadBtn.disabled = selected.size === 0;

    downloadBtn.innerHTML =
      `DOWNLOAD ${selected.size} FILE <span>↗</span>`;
  }
});

loadConfigs();
