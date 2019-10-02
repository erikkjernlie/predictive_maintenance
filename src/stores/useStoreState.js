import { useState, useEffect } from "react";
import { Store } from "./createStore";

export default function useStoreState(store) {
  const [storeState, setStoreState] = useState(store.getState());

  useEffect(() => {
    return store.subscribe(setStoreState);
  }, [store]);

  return storeState;
}
