export function patchWebPDisposal(uint8, disposeToBackground) {
  const view = new DataView(uint8.buffer);
  let offset = 12;
  while (offset < view.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === "ANMF") {
      const flagsOffset = offset + 8 + 15;
      let flags = view.getUint8(flagsOffset);
      if (disposeToBackground) flags |= 1;
      else flags &= ~1;
      view.setUint8(flagsOffset, flags);
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return uint8;
}
