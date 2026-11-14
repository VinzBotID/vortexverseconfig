const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const adminStatus = document.getElementById("adminStatus");
const adminList = document.getElementById("adminList");

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Permintaan gagal.");
  }

  return data;
}

function showDashboard(loggedIn) {
  loginCard.classList.toggle("hidden", loggedIn);
  dashboard.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    loadAdminConfigs();
  }
}

async function checkSession() {
  try {
    const data = await api("/api/session");
    showDashboard(Boolean(data.authenticated));
  } catch {
    showDashboard(false);
  }
}

document.getElementById("loginForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const button = event.submitter;
    button.disabled = true;
    adminStatus.textContent = "";

    try {
      await api("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: document.getElementById("password").value
        })
      });

      document.getElementById("password").value = "";

      showDashboard(true);

    } catch (error) {
      adminStatus.textContent = error.message;

    } finally {
      button.disabled = false;
    }
  });

document.getElementById("uploadForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const button = document.getElementById("uploadButton");
    const form = new FormData(event.currentTarget);

    button.disabled = true;
    button.textContent = "MENGUPLOAD...";

    adminStatus.textContent = "Sedang mengunggah file...";

    try {
      await api("/api/upload", {
        method: "POST",
        body: form
      });

      event.currentTarget.reset();

      adminStatus.textContent = "Config berhasil diunggah.";

      await loadAdminConfigs();

    } catch (error) {
      adminStatus.textContent = error.message;

    } finally {
      button.disabled = false;
      button.textContent = "UPLOAD CONFIG";
    }
  });

async function loadAdminConfigs() {
  adminList.textContent = "Memuat data...";

  try {
    const data = await api("/api/config");

    const items = Array.isArray(data)
      ? data
      : (data.items || []);

    if (!items.length) {
      adminList.textContent = "Belum ada config.";
      return;
    }

    adminList.innerHTML = items.map(item => `
      <div class="admin-item">

        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <small>${escapeHTML(item.fileName || "")}</small>
        </div>

        <div class="admin-actions">
          <button
            class="secondary danger"
            data-delete="${escapeHTML(item.id)}"
            type="button"
          >
            HAPUS
          </button>
        </div>

      </div>
    `).join("");

    adminList.querySelectorAll("[data-delete]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          if (!confirm("Hapus config ini?")) return;

          button.disabled = true;

          try {
            await api("/api/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: button.dataset.delete
              })
            });

            await loadAdminConfigs();

            adminStatus.textContent =
              "Config berhasil dihapus.";

          } catch (error) {
            adminStatus.textContent = error.message;
            button.disabled = false;
          }
        });
      });

  } catch (error) {
    adminList.textContent = error.message;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

document.getElementById("logoutButton")
  .addEventListener("click", async () => {
    try {
      await api("/api/logout", {
        method: "POST"
      });
    } catch {}

    showDashboard(false);
  });

checkSession();
