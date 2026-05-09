# Code Tutor

A desktop app that teaches you coding by explaining the **logic**, **dry-running** the algorithm, and giving the **optimal solution** with **time and space complexity**. Runs fully offline using Ollama.

Two modes:
- **Problem statement** — paste a problem (e.g. LeetCode-style), get the optimal approach.
- **Review my code** — paste your own code, get an explanation, dry run, and the optimal version.

Output languages: Python, Java, C++, JavaScript.

## Setup

### 1. Install Ollama (one-time)
Download from https://ollama.com/download and install. After install, Ollama runs as a background service on `localhost:11434`.

### 2. Pull a coding model (one-time)
Open PowerShell and run:

```powershell
ollama pull qwen2.5-coder:7b
```

This is ~4.7 GB. Bigger / better alternatives if you have the disk:
```powershell
ollama pull deepseek-coder-v2:16b   # ~9 GB, stronger reasoning
```

### 3. Install Python deps (one-time)
From this folder:

```powershell
python -m pip install --user -r requirements.txt
```

## Run

```powershell
python app.py
```

A desktop window opens. If Ollama is running and a model is installed, the **Teach me** button will be enabled.

Keyboard shortcut: **Ctrl+Enter** in the input box runs it.

## How it works

- `app.py` — PyWebView desktop shell, exposes a small Python API (`check_ollama`, `teach`) to the frontend.
- `ollama_client.py` — HTTP client for `localhost:11434` (`/api/tags`, `/api/chat`).
- `prompts.py` — System prompt that forces the model into a 4-section format: Logic / Dry Run / Optimal Solution / Complexity.
- `web/` — Frontend (HTML/CSS/JS). Markdown rendered with `marked`, syntax highlighted with `Prism`.

## Tweaking the tutor

Edit `prompts.py` to change tone, structure, or rules (e.g. "always include a brute-force first" — currently forbidden).

Edit `ollama_client.py` to change the default model or temperature.

## Troubleshooting

- **"Ollama is not running"** — start the Ollama app, or run `ollama serve` in a terminal.
- **"No models installed"** — run `ollama pull qwen2.5-coder:7b`.
- **Slow / weird output** — small local models can be inconsistent. Try a bigger model, or lower the temperature in `ollama_client.py`.
