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

/** Model list used until /api/ai/models answers. */
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

/** Server-safe initial model: the saved choice is applied after mount (see below). */
function defaultModel(defaultModelRef: string, groups: ModelGroup[]): string {
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
  const [groups, setGroups] = useState<ModelGroup[]>(fallbackGroups);
  const [modelRef, setModelRefState] = useState(() =>
    defaultModel(defaultModelRef, fallbackGroups)
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

    // Restore the saved model after hydration — reading localStorage during the
    // first render made the server and client HTML differ (hydration error).
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isValidModelRef(saved, fallbackGroups)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
        setModelRefState(saved);
      }
    } catch {
      /* storage unavailable: keep the default model */
    }

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
