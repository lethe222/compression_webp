import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import coreURLSource from "@ffmpeg/core?url";
import wasmURLSource from "@ffmpeg/core/wasm?url";
import workerURLSource from "@ffmpeg/ffmpeg/worker?url";

export async function createFFmpegClient({ onLog, onProgress } = {}) {
  const ffmpeg = new FFmpeg();
  if (onLog) {
    ffmpeg.on("log", ({ message }) => onLog(message));
  }
  if (onProgress) {
    ffmpeg.on("progress", (payload) => onProgress(payload));
  }

  const coreURL = await toBlobURL(coreURLSource, "text/javascript");
  const wasmURL = await toBlobURL(wasmURLSource, "application/wasm");
  const workerURL = await toBlobURL(workerURLSource, "text/javascript");

  await ffmpeg.load({
    coreURL,
    wasmURL,
    workerURL,
  });

  return ffmpeg;
}

export function getFetchFile() {
  return fetchFile;
}
