export default function createStore(initialState) {
  let state = initialState;

  let subscribers = [];

  const store = {
    getState() {
      return state;
    },
    setState(pso) {
      state = {
        ...state,
        ...pso
      };
      subscribers.forEach(notify => notify(state));
    },
    subscribe(subscriber) {
      subscribers.push(subscriber);
      return () => store.unsubscribe(subscriber);
    },
    unsubscribe(subscriber) {
      subscribers = subscribers.filter(remaining => remaining !== subscriber);
    }
  };

  return store;
}
