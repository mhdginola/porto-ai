"use client";

import { useCallback, useEffect, useState } from "react";
import {
  availableChatModels,
  isValidModelId,
  type ChatProvider,
} from "@/lib/ai-models";

const STORAGE_KEY = "porto-ai-selected-model";

function readInitialModel(provider: ChatProvider, defaultModel: string) {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isValidModelId(provider, saved)) return saved;
  }
  const exists = availableChatModels[provider]?.some(
    (m) => m.id === defaultModel
  );
  return exists ? defaultModel : (availableChatModels[provider][0]?.id ?? "");
}

type ApiModelsResponse = {
  provider: ChatProvider;
  defaultModel: string;
};

export function useChatModel(provider: ChatProvider, defaultModel: string) {
  const [model, setModelState] = useState(() =>
    readInitialModel(provider, defaultModel)
  );
  const [confirmedModelId, setConfirmedModelId] = useState<string | null>(
    null
  );
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ai/models")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ApiModelsResponse | null) => {
        if (cancelled || !data) return;
        setApiReady(true);
        if (data.provider !== provider) return;
        setModelState((current) => {
          if (isValidModelId(provider, current)) return current;
          localStorage.setItem(STORAGE_KEY, data.defaultModel);
          return data.defaultModel;
        });
      })
      .catch(() => {
        if (!cancelled) setApiReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [provider]);

  const setModel = useCallback(
    (id: string) => {
      if (!isValidModelId(provider, id)) return;
      setModelState(id);
      setConfirmedModelId(null);
      localStorage.setItem(STORAGE_KEY, id);
    },
    [provider]
  );

  const onModelFromResponse = useCallback((res: Response) => {
    const id = res.headers.get("x-ai-model");
    if (id) setConfirmedModelId(id);
  }, []);

  return {
    model,
    setModel,
    confirmedModelId,
    onModelFromResponse,
    apiReady,
  };
}
