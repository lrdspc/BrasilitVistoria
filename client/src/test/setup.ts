import '@testing-library/jest-dom';
import { vi } from 'vitest'; // Import vi for mocking

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated but included for safety
    removeListener: vi.fn(), // deprecated but included for safety
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver - often needed for UI components that adapt to size
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver - often needed for components that lazy load or react to visibility
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));


// You can add other global mocks here if needed for your project.
// For example, if you use navigator.geolocation or other browser APIs:
//
// Mock navigator.geolocation
// const mockGeolocation = {
//   getCurrentPosition: vi.fn().mockImplementationOnce((success) => Promise.resolve(success({
//     coords: { latitude: 51.1, longitude: 45.3 },
//   }))),
//   watchPosition: vi.fn(),
//   clearWatch: vi.fn()
// };
// Object.defineProperty(navigator, 'geolocation', {
//   writable: true,
//   value: mockGeolocation,
// });

// Mock Web Speech API (SpeechRecognition) if used by VoiceInput
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = '';
    onresult = null;
    onerror = null;
    onstart = null;
    onend = null;
    onspeechstart = null;
    onspeechend = null;
    onaudiostart = null;
    onaudioend = null;
    // Methods
    start = vi.fn();
    stop = vi.fn();
    abort = vi.fn();
    // Event handling
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn();
  }
  (window as any).SpeechRecognition = MockSpeechRecognition;
  (window as any).webkitSpeechRecognition = MockSpeechRecognition;
}


console.log('Test setup file loaded: @testing-library/jest-dom extended, matchMedia, ResizeObserver, IntersectionObserver mocked.');
