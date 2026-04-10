// Ping Matrix WebWorker
// Processes incoming WebSocket data and maintains the 500-slot state array
// for Canvas rendering, offloading computation from the UI thread.

const TOTAL = 500;
let pingStates = new Array(TOTAL).fill(0); // 0=idle, 1=success, 2=fail, 3=healing
let lastUpdate = new Array(TOTAL).fill(0);

self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === 'stress_ping') {
    const { index, success } = data;
    if (index >= 0 && index < TOTAL) {
      pingStates[index] = success ? 1 : 2;
      lastUpdate[index] = Date.now();
    }
    // Send updated frame data to main thread
    self.postMessage({
      type: 'frame',
      states: [...pingStates],
      timestamps: [...lastUpdate],
    });
  }

  if (type === 'heal') {
    const { index } = data;
    if (index >= 0 && index < TOTAL) {
      pingStates[index] = 3; // healing
      lastUpdate[index] = Date.now();
    }
    self.postMessage({
      type: 'frame',
      states: [...pingStates],
      timestamps: [...lastUpdate],
    });
  }

  if (type === 'reset') {
    pingStates = new Array(TOTAL).fill(0);
    lastUpdate = new Array(TOTAL).fill(0);
    self.postMessage({
      type: 'frame',
      states: [...pingStates],
      timestamps: [...lastUpdate],
    });
  }

  // Fade out old pings (called periodically)
  if (type === 'tick') {
    const now = Date.now();
    let changed = false;
    for (let i = 0; i < TOTAL; i++) {
      if (pingStates[i] !== 0 && now - lastUpdate[i] > 5000) {
        pingStates[i] = 0;
        changed = true;
      }
    }
    if (changed) {
      self.postMessage({
        type: 'frame',
        states: [...pingStates],
        timestamps: [...lastUpdate],
      });
    }
  }
};
