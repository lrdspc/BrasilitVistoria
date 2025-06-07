export class ReportGenerator {
  private worker: Worker;

  constructor() {
    // Ensure the path to the worker is correct relative to the project structure and how Vite handles workers.
    // Vite expects `new URL('path/to/worker.js', import.meta.url)` for worker instantiation.
    try {
      this.worker = new Worker(
        new URL('../workers/docx-generator.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Optional: Initial message handling from worker if it sends one on load (e.g., { workerLoaded: true })
      this.worker.onmessage = (event) => {
        if (event.data && event.data.workerLoaded) {
          console.log('ReportGenerator: DOCX Worker confirmed loaded.');
        }
        // After initial confirmation, this onmessage should be primarily for generateReport responses.
        // This might get overridden by the onmessage in generateReport, which is fine.
      };

      this.worker.onerror = (error) => {
        console.error('ReportGenerator: Worker initialization error.', error);
        // You might want to throw an error here or set a state indicating the generator is unusable.
      };

    } catch (error) {
      console.error("ReportGenerator: Failed to create worker.", error);
      // Fallback or error state if worker creation fails (e.g. due to browser incompatibility or misconfiguration)
      this.worker = {
        postMessage: () => {
          console.error("ReportGenerator: Worker not initialized, cannot post message.");
        },
        terminate: () => {},
        onmessage: null,
        onerror: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as unknown as Worker; // Cast to Worker to satisfy type checks, but it's a dummy.
       throw new Error("Failed to initialize the report generator worker. " + (error as Error).message);
    }
  }

  async generateReport(inspectionData: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.worker || typeof this.worker.postMessage !== 'function') {
        return reject(new Error("ReportGenerator: Worker is not properly initialized."));
      }

      this.worker.onmessage = (event) => {
        const { success, data, error, filename } = event.data; // filename is also sent by worker
        if (success) {
          console.log(`ReportGenerator: DOCX generated successfully - ${filename}`);
          resolve(new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }));
        } else {
          console.error('ReportGenerator: Error message from worker:', error);
          reject(new Error(error || 'Unknown error during DOCX generation in worker.'));
        }
      };

      this.worker.onerror = (errorEvent) => {
        console.error('ReportGenerator: Error in worker:', errorEvent);
        reject(new Error(errorEvent.message || 'An error occurred in the report generator worker.'));
      };

      console.log("ReportGenerator: Posting message to worker with inspectionData", inspectionData);
      this.worker.postMessage({
        type: 'generate_docx',
        inspectionData
      });
    });
  }

  /**
   * Terminates the web worker. Useful for cleanup when the ReportGenerator instance is no longer needed.
   * It's good practice to call this to free up resources, especially in SPAs.
   */
  public terminate(): void {
    if (this.worker && typeof this.worker.terminate === 'function') {
      this.worker.terminate();
      console.log('ReportGenerator: Worker terminated.');
    }
  }
}

// Example usage (optional, for testing or demonstration):
// const reportGenerator = new ReportGenerator();
// async function testGenerate() {
//   try {
//     const mockInspectionData = {
//       inspection: { protocol: "TEST-001", date: new Date(), subject: "Test Report" },
//       client: { name: "Test Client" },
//       user: { name: "Test User" },
//       tiles: [{ type: "Ceramic", quantity: 100, area: 50 }],
//       nonConformities: [{ title: "Broken Tile", description: "A tile was broken.", photos: [] }]
//     };
//     const blob = await reportGenerator.generateReport(mockInspectionData);
//     console.log("Report generated, blob size:", blob.size);
//     // You could then use URL.createObjectURL(blob) and an <a> tag to download it.
//   } catch (error) {
//     console.error("Error testing report generation:", error);
//   } finally {
//     reportGenerator.terminate();
//   }
// }
// if (typeof window !== 'undefined') { // Basic check if running in browser-like env for testing
//    // testGenerate();
// }
