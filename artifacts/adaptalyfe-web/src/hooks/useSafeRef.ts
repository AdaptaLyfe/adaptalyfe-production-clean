import { MutableRefObject, useRef as originalUseRef } from 'react';

// Safe useRef hook that never throws errors
export function useSafeRef<T>(initialValue: T): MutableRefObject<T>;
export function useSafeRef<T>(initialValue: T | null): MutableRefObject<T | null>;
export function useSafeRef<T = undefined>(): MutableRefObject<T | undefined>;
export function useSafeRef<T>(initialValue?: T): MutableRefObject<T | undefined> {
  try {
    return originalUseRef(initialValue);
  } catch (error) {
    // If useRef fails, create a basic ref object manually
    const ref = { current: initialValue };
    return ref as MutableRefObject<T | undefined>;
  }
}