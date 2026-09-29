export function createResourceCache() {
  const loaded = new Set();
  const pending = new Map();
  let generation = 0;

  return {
    load(key, loader, apply, force = false) {
      if (!force && loaded.has(key)) return Promise.resolve(false);
      if (pending.has(key)) return pending.get(key);

      const currentGeneration = generation;
      const request = Promise.resolve()
        .then(loader)
        .then(value => {
          if (currentGeneration !== generation) return false;
          apply(value);
          loaded.add(key);
          return true;
        })
        .finally(() => {
          if (pending.get(key) === request) pending.delete(key);
        });

      pending.set(key, request);
      return request;
    },
    clear() {
      generation += 1;
      loaded.clear();
      pending.clear();
    }
  };
}
