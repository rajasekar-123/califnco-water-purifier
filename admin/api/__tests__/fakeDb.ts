/** Minimal in-memory stand-in for the Firestore Admin API surface used by the handlers. */
export function createFakeDb(seed: Record<string, Record<string, unknown>> = {}) {
  const store = new Map<string, Record<string, unknown>>(Object.entries(seed));
  let counter = 0;

  const snap = (path: string) => ({
    id: path.split('/').pop()!,
    ref: ref(path),
    exists: store.has(path),
    data: () => (store.has(path) ? structuredClone(store.get(path)) : undefined),
  });
  const ref = (path: string): any => ({
    path,
    get: async () => snap(path),
    set: async (d: Record<string, unknown>) => void store.set(path, structuredClone(d)),
    update: async (d: Record<string, unknown>) => {
      if (!store.has(path)) throw new Error('NOT_FOUND ' + path);
      store.set(path, { ...store.get(path)!, ...d });
    },
    delete: async () => void store.delete(path),
  });

  return {
    store,
    doc: (path: string) => ref(path),
    collection: (name: string) => ({
      add: async (d: Record<string, unknown>) => {
        const id = `auto${++counter}`;
        store.set(`${name}/${id}`, structuredClone(d));
        return { id };
      },
    }),
    runTransaction: async (fn: (tx: any) => Promise<void>) => {
      const writes: (() => void)[] = [];
      const tx = {
        get: async (r: any) => snap(r.path),
        update: (r: any, d: any) => writes.push(() => store.set(r.path, { ...store.get(r.path)!, ...d })),
        set: (r: any, d: any) => writes.push(() => store.set(r.path, structuredClone(d))),
        delete: (r: any) => writes.push(() => store.delete(r.path)),
      };
      await fn(tx); // throws before any write is applied -> atomic
      writes.forEach((w) => w());
    },
  };
}

export function mockRes() {
  const res: any = { statusCode: 200, body: undefined, ended: false, headers: {} };
  res.setHeader = (k: string, v: string) => void (res.headers[k] = v);
  res.status = (c: number) => ((res.statusCode = c), res);
  res.json = (b: unknown) => ((res.body = b), (res.ended = true), (res.writableEnded = true), res);
  res.end = () => ((res.ended = true), (res.writableEnded = true), res);
  return res;
}
