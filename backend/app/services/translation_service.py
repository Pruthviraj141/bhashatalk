import json
from dataclasses import dataclass
from functools import lru_cache
from typing import Protocol

from groq import Groq
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings


class TranslationService(Protocol):
    async def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        ...

    async def translate(self, text: str, source_lang: str, target_lang: str) -> "TranslationResult":
        ...

    async def translate_multi(self, text: str, source_lang: str) -> dict[str, str]:
        ...


@dataclass(slots=True)
class TranslationResult:
    text: str
    source_lang: str
    target_lang: str
    model_name: str
    fallback_used: bool


class GroqTranslationService:
    _TARGET_LANGUAGES = ("en", "hi", "mr")
    _LANG_NAMES = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
    }

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = (settings.groq_api_key or "").strip()
        self._model = settings.groq_model
        self._client = Groq(api_key=self._api_key) if self._api_key else None

    @staticmethod
    def _clean_text(text: str) -> str:
        return " ".join(text.split()).strip()

    @staticmethod
    def _normalize_lang(lang: str) -> str:
        value = (lang or "").strip().lower().replace("_", "-")
        if not value:
            return "en"
        return value.split("-", 1)[0]

    def _build_prompt(self, text: str, source_lang: str, target_lang: str) -> str:
        source_name = self._LANG_NAMES.get(source_lang, source_lang)
        target_name = self._LANG_NAMES.get(target_lang, target_lang)
        return (
            "You are a highly accurate translation engine.\n\n"
            f"Translate the following chat message from {source_name} to {target_name}.\n"
            "Preserve meaning, tone, and intent. Keep it natural and conversational.\n"
            "Do not explain. Return only translated text.\n\n"
            "Text:\n"
            f"{text}"
        )

    def _build_multi_prompt(self, text: str, source_lang: str) -> str:
        source_name = self._LANG_NAMES.get(source_lang, source_lang)
        return (
            "You are a highly accurate translation engine.\n\n"
            f"Translate the following chat message from {source_name} into English (en), Hindi (hi), and Marathi (mr).\n"
            "Preserve meaning, tone, and intent. Keep it natural and conversational.\n"
            "Return ONLY valid JSON in this exact format:\n"
            '{"en":"...","hi":"...","mr":"..."}\n\n'
            "Text:\n"
            f"{text}"
        )

    @staticmethod
    def _extract_json_object(raw: str) -> dict[str, str] | None:
        if not raw:
            return None
        candidate = raw.strip()
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return {str(k): str(v) for k, v in parsed.items()}
        except Exception:
            pass

        start = candidate.find("{")
        end = candidate.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            parsed = json.loads(candidate[start : end + 1])
        except Exception:
            return None

        if not isinstance(parsed, dict):
            return None
        return {str(k): str(v) for k, v in parsed.items()}

    def _normalize_translation_map(self, text: str, source_lang: str, raw_map: dict[str, str] | None) -> dict[str, str]:
        cleaned = self._clean_text(text)
        normalized_source = self._normalize_lang(source_lang)
        normalized: dict[str, str] = {}
        for lang in self._TARGET_LANGUAGES:
            candidate = ""
            if raw_map is not None:
                candidate = (raw_map.get(lang) or "").strip()
            if not candidate:
                candidate = cleaned
            normalized[lang] = candidate

        normalized[normalized_source] = cleaned
        return normalized

    @lru_cache(maxsize=2048)
    def _cached_translate(self, text: str, source_lang: str, target_lang: str) -> str:
        cleaned = self._clean_text(text)
        normalized_source = self._normalize_lang(source_lang)
        normalized_target = self._normalize_lang(target_lang)

        if not cleaned:
            return ""
        if normalized_source == normalized_target:
            return cleaned
        if not self._client:
            return cleaned

        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": "You are a translation engine."},
                {
                    "role": "user",
                    "content": self._build_prompt(
                        cleaned,
                        source_lang=normalized_source,
                        target_lang=normalized_target,
                    ),
                },
            ],
            temperature=0.2,
        )

        content = (response.choices[0].message.content or "").strip()
        return content or cleaned

    @lru_cache(maxsize=2048)
    def _cached_translate_multi(self, text: str, source_lang: str) -> dict[str, str]:
        cleaned = self._clean_text(text)
        normalized_source = self._normalize_lang(source_lang)

        if not cleaned:
            return {lang: "" for lang in self._TARGET_LANGUAGES}
        if not self._client:
            return self._normalize_translation_map(cleaned, normalized_source, None)

        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": "You are a translation engine."},
                {
                    "role": "user",
                    "content": self._build_multi_prompt(cleaned, normalized_source),
                },
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = (response.choices[0].message.content or "").strip()
        parsed = self._extract_json_object(content)
        return self._normalize_translation_map(cleaned, normalized_source, parsed)

    def _translate_sync(self, text: str, source_lang: str, target_lang: str) -> TranslationResult:
        normalized_source = self._normalize_lang(source_lang)
        normalized_target = self._normalize_lang(target_lang)
        cleaned = self._clean_text(text)

        if normalized_source == normalized_target:
            return TranslationResult(
                text=cleaned,
                source_lang=normalized_source,
                target_lang=normalized_target,
                model_name=self._model,
                fallback_used=False,
            )

        try:
            translated = self._cached_translate(cleaned, normalized_source, normalized_target)
            fallback_used = translated == cleaned and normalized_source != normalized_target
            return TranslationResult(
                text=translated,
                source_lang=normalized_source,
                target_lang=normalized_target,
                model_name=self._model,
                fallback_used=fallback_used,
            )
        except Exception:
            return TranslationResult(
                text=cleaned,
                source_lang=normalized_source,
                target_lang=normalized_target,
                model_name=self._model,
                fallback_used=True,
            )

    async def preload_common_models(self) -> None:
        # No local model preload is needed for Groq-hosted inference.
        return

    async def translate(self, text: str, source_lang: str, target_lang: str) -> TranslationResult:
        return await run_in_threadpool(self._translate_sync, text, source_lang, target_lang)

    async def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        result = await self.translate(text=text, source_lang=source_lang, target_lang=target_lang)
        return result.text

    async def translate_multi(self, text: str, source_lang: str) -> dict[str, str]:
        normalized_source = self._normalize_lang(source_lang)

        try:
            return await run_in_threadpool(self._cached_translate_multi, text, normalized_source)
        except Exception:
            return self._normalize_translation_map(text, normalized_source, None)
