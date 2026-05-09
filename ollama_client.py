import requests

OLLAMA_HOST = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5-coder:7b"


class OllamaError(Exception):
    pass


def is_running() -> bool:
    try:
        requests.get(f"{OLLAMA_HOST}/api/tags", timeout=2)
        return True
    except requests.RequestException:
        return False


def list_models() -> list[str]:
    try:
        r = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        r.raise_for_status()
        return [m["name"] for m in r.json().get("models", [])]
    except requests.RequestException as e:
        raise OllamaError(f"Could not reach Ollama at {OLLAMA_HOST}: {e}")


def chat(messages: list[dict], model: str = DEFAULT_MODEL, temperature: float = 0.2) -> str:
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
    }
    try:
        r = requests.post(f"{OLLAMA_HOST}/api/chat", json=payload, timeout=600)
        r.raise_for_status()
    except requests.RequestException as e:
        raise OllamaError(f"Ollama request failed: {e}")

    data = r.json()
    if "message" not in data or "content" not in data["message"]:
        raise OllamaError(f"Unexpected Ollama response: {data}")
    return data["message"]["content"]
