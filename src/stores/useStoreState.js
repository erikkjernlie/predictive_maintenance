import { useState, useEffect } from "react";

export default function useStoreState(store) {
  const [storeState, setStoreState] = useState(store.getState());

  useEffect(() => {
    return store.subscribe(setStoreState);
  }, [store]);

  return storeState;
}
