import os
from openai import OpenAI

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.environ.get("OPENAI_API_KEY"),
            base_url=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        )
    return _client

MODEL = "llama-3.3-70b-versatile"


def review_code(code: str, custom_prompt: str):
    prompt = f"""You are a senior software engineer. Answer only what is asked — do not add unrequested sections.

Task:
{custom_prompt}

Code:
```
{code}
```
"""
    response = _get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def chat_with_ai(messages, system_instruction="You are a helpful AI assistant"):
    chat_messages = [{"role": "system", "content": system_instruction}]
    for msg in messages:
        role = "assistant" if msg.role == "assistant" else "user"
        chat_messages.append({"role": role, "content": msg.content})

    response = _get_client().chat.completions.create(
        model=MODEL,
        messages=chat_messages,
    )
    return response.choices[0].message.content
