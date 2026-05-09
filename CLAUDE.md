# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A PyWebView desktop app that uses a local Ollama LLM to teach coding. Two modes: paste a problem statement, or paste your own code for review. Output is forced into a fixed 4-section format (Logic / Dry Run / Optimal Solution / Complexity) in Python, Java, C++, or JavaScript.

## Commands

```powershell
# Install Python deps (one-time)
python -m pip install --user -r requirements.txt

# Run the desktop app
python app.py
```

External prerequisites the app depends on at runtime:
- Ollama installed and reachable at `http://localhost:11434` (https://ollama.com/download)
- At least one model pulled, e.g. `ollama pull qwen2.5-coder:7b`

There are no tests, linter, or build step.

## Architecture

Three layers, communicating in a tight loop:

1. **PyWebView shell** ([app.py](app.py)) — creates the desktop window, points it at [web/index.html](web/index.html), and exposes the `Api` class to JS via `js_api=`. The `Api` methods (`check_ollama`, `teach`) become callable from the frontend as `window.pywebview.api.<method>` and return plain dicts.
2. **Ollama client** ([ollama_client.py](ollama_client.py)) — thin `requests` wrapper around `/api/tags` (model list, liveness) and `/api/chat` (completion). Calls are **non-streaming** with a 600s timeout. All errors raise `OllamaError` for `Api` to translate into `{ok: False, error: ...}`.
3. **Frontend** ([web/](web/)) — vanilla HTML/CSS/JS. Markdown rendered by `marked` (CDN), code highlighted by `Prism` autoloader (CDN). The `pywebviewready` event fires when the JS bridge is alive — all bindings happen there.

### Load-bearing contract: prompt format ↔ frontend

The system prompt in [prompts.py](prompts.py) **forces** the model to emit exactly four `## ` headers: `Logic`, `Dry Run`, `Optimal Solution`, `Complexity`. Don't loosen these rules without checking the frontend — `web/style.css` styles `.output h2` specifically, and the empty-state copy in [web/app.js](web/app.js) and [web/index.html](web/index.html) advertises this structure to the user. If you add a section, add CSS + update the empty-state text.

The two modes share one `SYSTEM_PROMPT` and differ only in the user-message template (`PROBLEM_MODE_TEMPLATE` vs `CODE_REVIEW_MODE_TEMPLATE`), routed by `build_messages(mode, ...)`.

### Where to change behavior

- **Tutor tone, structure, rules** → [prompts.py](prompts.py)
- **Default model, temperature, Ollama host** → [ollama_client.py](ollama_client.py) (`DEFAULT_MODEL`, `OLLAMA_HOST`)
- **Model dropdown ordering / preferred list** → `preferred` array in [web/app.js](web/app.js)
- **Window size, debug devtools** → `webview.create_window(...)` and `webview.start(debug=...)` in [app.py](app.py)

## Gotchas

- The PyPI package is `pywebview` but the Python import is `webview` (not `pywebview`).
- Prism's autoloader fetches each language's grammar from CDN on first use — the app needs internet the first time a given language is rendered. Cached after that by the webview.
- `renderMarkdown` rewrites unlabeled triple-backtick fences to the currently picked language so they highlight. If the model emits a labeled fence in a different language, that label is preserved.
- Ollama calls block for up to 600s; the UI disables the run button and shows a spinner during that window. Streaming is not implemented.
- Not a git repo. If you start tracking it, the project lives at the directory root — `web/` is a static asset folder, not a separate package.
