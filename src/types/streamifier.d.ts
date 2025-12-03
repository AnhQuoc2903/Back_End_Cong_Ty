// src/types/streamifier.d.ts
declare module "streamifier" {
  function createReadStream(buffer: Buffer): NodeJS.ReadableStream;
  const streamifier: { createReadStream: typeof createReadStream };
  export default streamifier;
}
