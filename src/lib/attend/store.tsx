import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { loadStore, saveStore } from "./storage";
import { emptyStore, type Store } from "./types";

type Ctx = {
  store: Store;
  hydrated: boolean;
  /** apply a change; pass a label to offer an undo toast */
  update: (fn: (s: Store) => Store, label?: string) => void;
  replace: (next: Store) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(emptyStore);
  const [hydrated, setHydrated] = useState(false);
  const previous = useRef<Store | null>(null);

  useEffect(() => {
    let alive = true;
    loadStore().then((s) => {
      if (!alive) return;
      setStore(s);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveStore(store);
  }, [store, hydrated]);

  const update = useCallback((fn: (s: Store) => Store, label?: string) => {
    setStore((prev) => {
      previous.current = prev;
      return fn(prev);
    });
    if (label) {
      toast(label, {
        action: {
          label: "Undo",
          onClick: () => {
            const snapshot = previous.current;
            if (snapshot) setStore(snapshot);
          },
        },
      });
    }
  }, []);

  const replace = useCallback((next: Store) => {
    setStore((prev) => {
      previous.current = prev;
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ store, hydrated, update, replace }),
    [store, hydrated, update, replace],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
