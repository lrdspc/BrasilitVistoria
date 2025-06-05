export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e as BeforeInstallPromptEvent;
});

export function canInstallPWA(): boolean {
  return deferredPrompt !== null;
}

export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  // Reset the deferred prompt variable
  deferredPrompt = null;

  return outcome === 'accepted';
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Check if app is running in standalone mode (installed PWA)
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Connection status management
export class ConnectionStatus {
  private listeners: Array<(online: boolean) => void> = [];
  private _isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this._isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this._isOnline = false;
      this.notifyListeners();
    });
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  addListener(callback: (online: boolean) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (online: boolean) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this._isOnline));
  }
}

export const connectionStatus = new ConnectionStatus();
