import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// jsdom no implementa estas APIs del navegador.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
window.scrollTo = () => undefined;
