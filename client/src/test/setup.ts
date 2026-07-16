import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver; stub it so HeadlessUI components render
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};