import type { Persistence } from 'firebase/auth';

// Metro resolves `firebase/auth` to the React Native build at runtime, which exports this;
// TypeScript only sees the web typings, so declare it here.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
