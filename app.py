import os
import webview

import ollama_client
from prompts import build_messages

WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
INDEX = os.path.join(WEB_DIR, "index.html")


class Api:
    """Methods on this class are exposed to the JS frontend via window.pywebview.api."""

    def check_ollama(self) -> dict:
        if not ollama_client.is_running():
            return {
                "ok": False,
                "error": (
                    "Ollama is not running. Install it from https://ollama.com/download, "
                    "then run `ollama serve` (or just open the Ollama app)."
                ),
                "models": [],
            }
        try:
            models = ollama_client.list_models()
        except ollama_client.OllamaError as e:
            return {"ok": False, "error": str(e), "models": []}

        if not models:
            return {
                "ok": False,
                "error": "Ollama is running but no models are installed. Run: ollama pull qwen2.5-coder:7b",
                "models": [],
            }
        return {"ok": True, "error": None, "models": models}

    def teach(self, mode: str, content: str, language: str, model: str) -> dict:
        if not content or not content.strip():
            return {"ok": False, "error": "Empty input.", "markdown": ""}
        try:
            messages = build_messages(mode=mode, content=content, language=language)
            md = ollama_client.chat(messages=messages, model=model)
            return {"ok": True, "error": None, "markdown": md}
        except ollama_client.OllamaError as e:
            return {"ok": False, "error": str(e), "markdown": ""}
        except Exception as e:
            return {"ok": False, "error": f"Unexpected error: {e}", "markdown": ""}


def main():
    api = Api()
    webview.create_window(
        title="Code Tutor",
        url=INDEX,
        js_api=api,
        width=1200,
        height=820,
        min_size=(900, 600),
    )
    webview.start(debug=False)


if __name__ == "__main__":
    main()
