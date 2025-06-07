import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportGenerator } from '../reportGenerator'; // Adjust path as needed

// Mock the Worker class
const mockPostMessage = vi.fn();
const mockTerminate = vi.fn();
let mockWorkerOnMessage: ((event: MessageEvent) => void) | null = null;
let mockWorkerOnError: ((event: ErrorEvent) => void) | null = null;

// Mock the global Worker constructor
vi.stubGlobal('Worker', vi.fn((scriptURL, options) => {
  // console.log('Mock Worker created with scriptURL:', scriptURL, 'options:', options);
  return {
    postMessage: mockPostMessage,
    terminate: mockTerminate,
    set onmessage(handler: (event: MessageEvent) => void) {
      mockWorkerOnMessage = handler;
    },
    get onmessage() {
      return mockWorkerOnMessage;
    },
    set onerror(handler: (event: ErrorEvent) => void) {
      mockWorkerOnError = handler;
    },
    get onerror() {
      return mockWorkerOnError;
    },
    // Add other Worker methods/properties if ReportGenerator uses them
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}));

// Helper to simulate worker sending a message to main thread
function simulateWorkerMessage(data: any) {
  if (mockWorkerOnMessage) {
    mockWorkerOnMessage({ data } as MessageEvent);
  } else {
    throw new Error("mockWorkerOnMessage is not set. Ensure ReportGenerator sets worker.onmessage.");
  }
}

// Helper to simulate worker throwing an error
function simulateWorkerError(error: Error) {
  if (mockWorkerOnError) {
    mockWorkerOnError(new ErrorEvent('error', { error }));
  } else {
    // If ReportGenerator doesn't attach an onerror, this path might not be directly testable
    // Or, the error might propagate differently. For now, assume onerror is attached.
    throw new Error("mockWorkerOnError is not set. Ensure ReportGenerator sets worker.onerror.");
  }
}


describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  const mockInspectionData = { sample: 'data' };

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks including Worker constructor calls and its methods
    reportGenerator = new ReportGenerator(); // Creates a new mock Worker instance
    mockWorkerOnMessage = null; // Reset handlers for each test
    mockWorkerOnError = null;
  });

  afterEach(() => {
    // Terminate after each test if an instance was created and terminate is available
    if (reportGenerator && typeof reportGenerator.terminate === 'function') {
      reportGenerator.terminate();
    }
  });

  it('constructor initializes a Worker with correct script URL and options', () => {
    expect(Worker).toHaveBeenCalledTimes(1);
    // The first argument to Worker constructor should be an URL object.
    // We check if the href of that URL object ends with the expected path.
    const workerArgs = (Worker as unknown as vi.Mock).mock.calls[0];
    const scriptUrlArg = workerArgs[0] as URL;
    expect(scriptUrlArg.pathname).toContain('client/src/workers/docx-generator.worker.ts'); // Vite specific URL path
    expect(workerArgs[1]).toEqual({ type: 'module' });
  });

  describe('generateReport method', () => {
    it('calls worker.postMessage with correct data structure', async () => {
      // Prevent promise from hanging if onmessage is not called immediately
      const promise = reportGenerator.generateReport(mockInspectionData);
      // Simulate worker taking time, or just check postMessage
      // To avoid Vitest's "unhandled promise rejection" warning if we don't resolve/reject:
      promise.catch(() => {}); // Catch any error if the test doesn't complete the promise

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'generate_docx',
        inspectionData: mockInspectionData,
      });
    });

    it('resolves with a Blob on successful worker message', async () => {
      const mockBuffer = new ArrayBuffer(8);
      const mockFilename = 'test-report.docx';

      const reportPromise = reportGenerator.generateReport(mockInspectionData);

      // Simulate the worker responding successfully
      simulateWorkerMessage({ success: true, data: mockBuffer, filename: mockFilename });

      await expect(reportPromise).resolves.toBeInstanceOf(Blob);
      const blob = await reportPromise;
      expect(blob.size).toBe(mockBuffer.byteLength);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('rejects with an Error on worker logic failure message', async () => {
      const errorMessage = 'Worker failed to generate DOCX';
      const reportPromise = reportGenerator.generateReport(mockInspectionData);

      // Simulate the worker responding with a failure
      simulateWorkerMessage({ success: false, error: errorMessage });

      await expect(reportPromise).rejects.toThrowError(errorMessage);
    });

    it('rejects with an Error if worker sends success:false without an error message', async () => {
      const reportPromise = reportGenerator.generateReport(mockInspectionData);
      simulateWorkerMessage({ success: false }); // No error message provided by worker
      await expect(reportPromise).rejects.toThrowError('Unknown error during DOCX generation in worker.');
    });


    it('rejects with an Error on worker error event', async () => {
      const errorObject = new Error('Simulated worker crash');
      const reportPromise = reportGenerator.generateReport(mockInspectionData);

      // Simulate the worker itself throwing an error
      simulateWorkerError(errorObject);

      await expect(reportPromise).rejects.toThrowError(errorObject.message);
    });

    it('rejects if worker is not initialized', async () => {
        // Sabotage the worker instance after construction for this specific test
        (reportGenerator as any).worker = null;
        await expect(reportGenerator.generateReport(mockInspectionData))
            .rejects.toThrowError("ReportGenerator: Worker is not properly initialized.");
    });
  });

  describe('terminate method', () => {
    it('calls worker.terminate', () => {
      reportGenerator.terminate();
      expect(mockTerminate).toHaveBeenCalledTimes(1);
    });

    it('does not throw if worker is already terminated or null', () => {
      reportGenerator.terminate(); // First call
      reportGenerator.terminate(); // Second call, should not throw
      (reportGenerator as any).worker = null;
      expect(() => reportGenerator.terminate()).not.toThrow();
    });
  });
});
