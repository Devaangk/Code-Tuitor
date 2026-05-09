const $ = (s) => document.querySelector(s);

const state = {
  mode: "problem",
  ready: false,
};

const LANG_TO_PRISM = {
  Python: "python",
  Java: "java",
  "C++": "cpp",
  JavaScript: "javascript",
};

function setStatus(text, kind) {
  const el = $("#status");
  if (!text) {
    el.classList.add("hidden");
    $(".split").classList.remove("with-status");
    return;
  }
  el.textContent = text;
  el.classList.remove("hidden", "ok", "warn");
  if (kind) el.classList.add(kind);
  $(".split").classList.add("with-status");
}

function setReady(ready) {
  state.ready = ready;
  $("#run").disabled = !ready;
}

async function checkOllama() {
  const res = await window.pywebview.api.check_ollama();
  if (!res.ok) {
    setStatus(res.error, "warn");
    setReady(false);
    return;
  }
  const modelSel = $("#model");
  modelSel.innerHTML = "";
  const preferred = ["qwen2.5-coder:7b", "deepseek-coder-v2:16b", "codellama:7b"];
  const sorted = [...res.models].sort((a, b) => {
    const ai = preferred.indexOf(a);
    const bi = preferred.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  for (const m of sorted) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modelSel.appendChild(opt);
  }
  setStatus(`Ollama ready · ${res.models.length} model${res.models.length === 1 ? "" : "s"} loaded`, "ok");
  setTimeout(() => setStatus(""), 2500);
  setReady(true);
}

function bindModeToggle() {
  $("#mode-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
    if (state.mode === "problem") {
      $("#input-label").textContent = "Paste a problem statement";
      $("#input").placeholder =
        "e.g. Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.";
    } else {
      $("#input-label").textContent = "Paste your code";
      $("#input").placeholder =
        "Paste the code you wrote. The tutor will explain what it does, dry-run it, and give you the optimal version.";
    }
  });
}

function renderMarkdown(md, language) {
  const prismLang = LANG_TO_PRISM[language] || "python";
  // Force any unlabeled fences to the picked language so they highlight.
  md = md.replace(/```(\s*\n)/g, "```" + prismLang + "$1");
  const html = marked.parse(md, { gfm: true, breaks: false });
  $("#output").innerHTML = html;
  // Tag code blocks with language class for Prism autoloader.
  document.querySelectorAll("#output pre code").forEach((el) => {
    if (![...el.classList].some((c) => c.startsWith("language-"))) {
      el.classList.add("language-" + prismLang);
    }
  });
  if (window.Prism) Prism.highlightAllUnder($("#output"));
}

async function run() {
  const content = $("#input").value;
  if (!content.trim()) return;
  const language = $("#language").value;
  const model = $("#model").value;

  $("#spinner").classList.remove("hidden");
  setReady(false);
  $("#output").innerHTML = '<div class="empty">Thinking… (local models can take 10–60s)</div>';

  try {
    const res = await window.pywebview.api.teach(state.mode, content, language, model);
    if (!res.ok) {
      $("#output").innerHTML = `<div class="empty" style="color:var(--err)">${res.error}</div>`;
    } else {
      renderMarkdown(res.markdown, language);
    }
  } catch (e) {
    $("#output").innerHTML = `<div class="empty" style="color:var(--err)">${e}</div>`;
  } finally {
    $("#spinner").classList.add("hidden");
    setReady(true);
  }
}

function bindKeys() {
  $("#input").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (state.ready) run();
    }
  });
}

window.addEventListener("pywebviewready", async () => {
  bindModeToggle();
  bindKeys();
  $("#run").addEventListener("click", run);
  $("#clear").addEventListener("click", () => {
    $("#input").value = "";
    $("#output").innerHTML = '<div class="empty">The optimal solution, dry run, and complexity will appear here.</div>';
  });
  await checkOllama();
});
