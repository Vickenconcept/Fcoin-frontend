/// <reference types="vite/client" />

declare module 'react' {
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);

  export function useState<S>(initialState: S): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...args: any[]) => unknown>(callback: T, deps: unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useContext<T>(context: any): T;
  export function useReducer(...args: unknown[]): unknown;
  export const useLayoutEffect: typeof useEffect;
  export type MouseEvent<T = unknown> = {
    target: T;
    currentTarget: T;
    stopPropagation: () => void;
    preventDefault: () => void;
  };

  const React: {
    createElement: unknown;
  };

  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
