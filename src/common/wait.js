export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const waitAndReject = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));