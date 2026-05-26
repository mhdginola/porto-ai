"use client";

import { useCallback, useEffect, useState } from "react";
import {
  availableChatModels,
  type ModelGroup,
} from "@/lib/ai-models";
import {
  findModelInGroups,
  isValidModelRef,
  parseModelRef,
} from "@/lib/chat-model-ref";

const STORAGE_KEY = "porto-ai-selected-model-ref";

function readInitialModelRef(
  defaultModelRef: string,
  groups: ModelGroup[]
): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isValidModelRef(saved, groups)) return saved;
  }
  if (isValidModelRef(defaultModelRef, groups)) return defaultModelRef;
  for (const g of groups) {
    if (g.available && g.models[0]) {
      return `${g.provider}:${g.models[0].id}`;
    }
  }
  return defaultModelRef;
}

type ApiModelsResponse = {
  groups: ModelGroup[];
  defaultModelRef: string;
  ollamaConnected?: boolean;
  groqAvailable?: boolean;
};

export function useChatModel(defaultModelRef: string) {
  const fallbackGroups: ModelGroup[] = [
    {
      provider: "groq",
      models: availableChatModels.groq,
      available: true,
    },
    {
      provider: "ollama",
      models: availableChatModels.ollama,
      available: true,
    },
  ];

  const [groups, setGroups] = useState<ModelGroup[]>(fallbackGroups);
  const [modelRef, setModelRefState] = useState(() =>
    readInitialModelRef(defaultModelRef, fallbackGroups)
  );
  const [confirmedModelRef, setConfirmedModelRef] = useState<string | null>(
    null
  );
  const [apiReady, setApiReady] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(
    null
  );
  const [groqAvailable, setGroqAvailable] = useState<boolean | null>(null);

  const parsed = parseModelRef(modelRef);
  const activeProvider = parsed?.provider ?? "groq";

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ai/models")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ApiModelsResponse | null) => {
        if (cancelled || !data) return;
        setApiReady(true);
        if (data.groups?.length) setGroups(data.groups);
        if (data.ollamaConnected != null) {
          setOllamaConnected(data.ollamaConnected);
        }
        if (data.groqAvailable != null) {
          setGroqAvailable(data.groqAvailable);
        }
        setModelRefState((current) => {
          if (isValidModelRef(current, data.groups)) return current;
          const next = data.defaultModelRef;
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setApiReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setModelRef = useCallback(
    (ref: string) => {
      if (!isValidModelRef(ref, groups)) return;
      setModelRefState(ref);
      setConfirmedModelRef(null);
      localStorage.setItem(STORAGE_KEY, ref);
    },
    [groups]
  );

  const onModelFromResponse = useCallback((res: Response) => {
    const ref = res.headers.get("x-ai-model-ref");
    const id = res.headers.get("x-ai-model");
    const provider = res.headers.get("x-ai-provider");
    if (ref) {
      setConfirmedModelRef(ref);
    } else if (id && provider) {
      setConfirmedModelRef(`${provider}:${id}`);
    } else if (id) {
      setConfirmedModelRef(id);
    }
  }, []);

  const activeModel = findModelInGroups(modelRef, groups);

  return {
    modelRef,
    setModelRef,
    groups,
    activeProvider,
    activeModel,
    confirmedModelRef,
    onModelFromResponse,
    apiReady,
    ollamaConnected,
    groqAvailable,
  };
}
