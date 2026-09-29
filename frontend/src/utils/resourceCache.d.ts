export type ResourceCache = {
  load<T>(
    key: string,
    loader: () => Promise<T>,
    apply: (value: T) => void,
    force?: boolean
  ): Promise<boolean>;
  clear(): void;
};

export function createResourceCache(): ResourceCache;
