import BN from 'bn.js';
import _ from 'lodash';
import { pedersen } from '../starkware';
/* eslint-disable */
let Worker;
let isMainThread;
let parentPort;
let workerData;
try {
  ({ Worker, isMainThread, parentPort, workerData } = require('worker_threads'));
} catch {
  throw new Error('Cannot use hashInWorkerThread() since worker_threads is not available');
}
/* eslint-enable */
let hashFunction = function hashInWorkerThread(_a, _b) {
  throw new Error('Expected hashInWorkerThread() to be called from the main thread');
};
if (!_.isNil(isMainThread)) {
  /**
   * Pedersen hash implementation that runs in a worker thread.
   */
  hashFunction = function hashInWorkerThread(a, b) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          a: a.toString(),
          b: b.toString(),
        },
      });
      worker.on('message', hashResult => {
        resolve(new BN(hashResult, 10));
      });
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  };
} else {
  const { a, b } = workerData;
  const hashResult = pedersen(new BN(a, 10), new BN(b, 10)).toString();
  parentPort.postMessage(hashResult);
}
export const hashInWorkerThread = hashFunction;
