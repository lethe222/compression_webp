<template>
  <div class="bg-gray-100 min-h-screen p-8">
    <div id="app" class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">
        动态 WebP 生成器 (纯前端)
      </h1>

      <div
        class="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleDrop"
        :class="{ 'border-blue-500 bg-blue-50': dragOver }"
      >
        <div class="text-center mb-4">
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/png"
            class="hidden"
            @change="handleFileSelect"
          />
          <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            @click="openFilePicker"
          >
            选择 PNG 图片
          </button>
          <p class="text-gray-500 mt-2">或将图片拖拽到此处</p>
        </div>

        <div v-if="frames.length > 0" class="mt-4">
          <p class="font-semibold mb-2">
            帧列表 ({{ frames.length }}张): 拖拽可重新排序
          </p>
          <Draggable
            v-model="frames"
            item-key="id"
            class="flex flex-wrap gap-2"
            handle=".drag-handle"
          >
            <template #item="{ element, index }">
              <div class="relative group border p-1 rounded bg-white">
                <div
                  class="drag-handle absolute top-0 left-0 bg-black/50 text-white px-1 text-xs cursor-grab active:cursor-grabbing"
                >
                  {{ index + 1 }}
                </div>
                <img :src="element.url" class="thumbnail" />
                <button
                  class="absolute top-0 right-0 bg-red-500 text-white px-1 text-xs hidden group-hover:block rounded-bl"
                  @click="removeFrame(index)"
                >
                  &times;
                </button>
              </div>
            </template>
          </Draggable>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="p-4 bg-gray-50 rounded border">
          <h3 class="font-bold text-lg mb-3 border-b pb-2">帧处理</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              范围跳过 (剔除指定范围)
            </label>
            <div class="flex items-center gap-2">
              <span>从:</span>
              <input
                v-model="skipFrom"
                type="number"
                class="w-16 border rounded px-2 py-1 text-sm"
                min="1"
              />
              <span>到:</span>
              <input
                v-model="skipTo"
                type="number"
                class="w-16 border rounded px-2 py-1 text-sm"
                min="1"
              />
              <button
                class="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
                @click="applySkipRange"
              >
                应用
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              抽帧 (每隔 N 张保留一张)
            </label>
            <div class="flex items-center gap-2">
              <span>每隔:</span>
              <input
                v-model="skipEvery"
                type="number"
                class="w-16 border rounded px-2 py-1 text-sm"
                min="2"
              />
              <button
                class="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
                @click="applySkipEvery"
              >
                应用
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gray-50 rounded border">
          <h3 class="font-bold text-lg mb-3 border-b pb-2">时间与循环</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              帧延迟 (毫秒/ms)
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="delayMs"
                type="number"
                class="w-24 border rounded px-2 py-1"
                min="1"
              />
              <span class="text-sm text-gray-500">= {{ fps }} FPS</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              循环次数
            </label>
            <input
              v-model="loopCount"
              type="number"
              class="w-24 border rounded px-2 py-1"
              placeholder="无限"
            />
            <p class="text-xs text-gray-500 mt-1">留空或填 0 代表无限循环</p>
          </div>
        </div>

        <div class="p-4 bg-gray-50 rounded border">
          <h3 class="font-bold text-lg mb-3 border-b pb-2">特效与合成</h3>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="dontStack"
              type="checkbox"
              class="rounded border-gray-300"
            />
            <span class="text-sm font-medium text-gray-700">
              不堆叠帧 (清除当前帧画布背景)
            </span>
          </label>
          <p class="text-xs text-gray-500 mt-1 ml-6">
            处理透明背景 PNG 时至关重要，防止画面残留叠加。(Disposal:
            background)
          </p>
        </div>

        <div class="p-4 bg-gray-50 rounded border">
          <h3 class="font-bold text-lg mb-3 border-b pb-2">输出质量与压缩</h3>

          <div class="mb-4">
            <label class="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                v-model="lossless"
                type="checkbox"
                class="rounded border-gray-300"
              />
              <span class="text-sm font-medium text-gray-700"
                >无损模式 (Lossless)</span
              >
            </label>
          </div>

          <div
            class="mb-4"
            :class="{ 'opacity-50 pointer-events-none': lossless }"
          >
            <label class="block text-sm font-medium text-gray-700 mb-1">
              质量 ({{ quality }})
            </label>
            <input
              v-model.number="quality"
              type="range"
              min="0"
              max="100"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              CPU 使用率/压缩级别 ({{ compressionLevel }})
            </label>
            <input
              v-model.number="compressionLevel"
              type="range"
              min="0"
              max="6"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">
              级别越高，消耗本地 CPU 越多，但能获得更小的体积和更好的画质 (默认:
              6)。
            </p>
          </div>
        </div>
      </div>

      <div class="mb-8 text-center">
        <button
          class="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isProcessing || frames.length === 0"
          @click="startConversion"
        >
          {{ isProcessing ? "处理中..." : "开始转换 (生成 WebP)" }}
        </button>
      </div>

      <div v-if="isProcessing" class="mb-6">
        <div class="w-full bg-gray-200 rounded h-3 overflow-hidden">
          <div
            class="h-3 bg-green-500 transition-all"
            :style="{ width: `${progressPercent ?? 5}%` }"
          />
        </div>
        <div class="text-xs text-gray-500 mt-1">
          <span v-if="progressPercent != null"
            >{{ progressPercent.toFixed(0) }}%</span
          >
          <span v-else>处理中…</span>
        </div>
      </div>

      <div v-if="isProcessing || logs.length > 0" class="mb-8">
        <div
          class="bg-gray-900 rounded p-4 h-48 overflow-y-auto font-mono text-xs text-green-400"
        >
          <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
        </div>
      </div>

      <div
        v-if="resultUrl"
        class="text-center p-6 border-2 border-green-500 rounded-lg bg-green-50"
      >
        <h3 class="text-xl font-bold text-green-700 mb-4">转换完成！</h3>
        <img
          :src="resultUrl"
          class="mx-auto max-w-full max-h-[500px] shadow-lg mb-4 bg-gray-200"
        />
        <p class="mb-4 text-gray-700 font-semibold">
          最终文件大小: {{ (resultSize / 1024).toFixed(2) }} KB
        </p>
        <a
          :href="resultUrl"
          download="animated.webp"
          class="inline-block bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700"
        >
          下载 WebP 文件
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef } from "vue";
import Draggable from "vuedraggable";
import { createFFmpegClient, getFetchFile } from "./lib/ffmpegClient";
import { patchWebPDisposal } from "./lib/patchWebPDisposal";

const fileInput = ref(null);
const dragOver = ref(false);

const frames = ref([]);
const skipFrom = ref("");
const skipTo = ref("");
const skipEvery = ref("");

const delayMs = ref(50);
const loopCount = ref("");

const dontStack = ref(false);

const lossless = ref(false);
const quality = ref(75);
const compressionLevel = ref(6);

const ffmpeg = shallowRef(null);
const isProcessing = ref(false);
const progressPercent = ref(null);
const logs = ref([]);
const resultUrl = ref(null);
const resultSize = ref(0);

const fps = computed(() => {
  if (!delayMs.value || delayMs.value <= 0) return "0.00";
  return (1000 / delayMs.value).toFixed(2);
});

function pushLog(message) {
  logs.value.push(message);
  if (logs.value.length > 80) logs.value.shift();
}

function openFilePicker() {
  fileInput.value?.click();
}

function addFiles(fileList) {
  const files = Array.from(fileList || []);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.type !== "image/png") continue;
    frames.value.push({
      id: `${Date.now()}_${i}_${Math.random().toString(16).slice(2)}`,
      file: f,
      url: URL.createObjectURL(f),
    });
  }
}

function handleFileSelect(e) {
  addFiles(e.target.files);
  e.target.value = "";
}

function handleDrop(e) {
  dragOver.value = false;
  addFiles(e.dataTransfer.files);
}

function removeFrame(index) {
  const item = frames.value[index];
  if (item?.url) URL.revokeObjectURL(item.url);
  frames.value.splice(index, 1);
}

function applySkipRange() {
  const from = parseInt(skipFrom.value, 10);
  const to = parseInt(skipTo.value, 10);
  if (!(from > 0 && to >= from && to <= frames.value.length)) {
    alert("无效的范围");
    return;
  }
  const removed = frames.value.splice(from - 1, to - from + 1);
  for (const r of removed) {
    if (r?.url) URL.revokeObjectURL(r.url);
  }
  skipFrom.value = "";
  skipTo.value = "";
}

function applySkipEvery() {
  const n = parseInt(skipEvery.value, 10);
  if (!(n > 1)) {
    alert("抽帧间隔必须大于 1");
    return;
  }
  const next = [];
  for (let i = 0; i < frames.value.length; i++) {
    if ((i + 1) % n !== 0) next.push(frames.value[i]);
    else if (frames.value[i]?.url) URL.revokeObjectURL(frames.value[i].url);
  }
  frames.value = next;
  skipEvery.value = "";
}

async function initFFmpeg() {
  if (ffmpeg.value) return;
  pushLog("正在初始化 FFmpeg...");
  progressPercent.value = null;

  const instance = await createFFmpegClient({
    onLog: (m) => pushLog(m),
    onProgress: (payload) => {
      if (payload && typeof payload.progress === "number") {
        progressPercent.value = Math.max(
          0,
          Math.min(100, Math.round(payload.progress * 100)),
        );
      }
    },
  });

  ffmpeg.value = instance;
  await nextTick();
}

async function startConversion() {
  if (frames.value.length === 0 || isProcessing.value) return;
  isProcessing.value = true;
  logs.value = [];
  progressPercent.value = null;
  resultSize.value = 0;

  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value);
    resultUrl.value = null;
  }

  try {
    await initFFmpeg();
    const fetchFile = getFetchFile();

    pushLog("正在将文件写入虚拟内存...");
    for (let i = 0; i < frames.value.length; i++) {
      const fileName = `frame_${i.toString().padStart(4, "0")}.png`;
      const fileData = await fetchFile(frames.value[i].file);
      await ffmpeg.value.writeFile(fileName, fileData);
    }

    const fr = parseFloat(fps.value);
    const loop = loopCount.value === "" ? 0 : parseInt(loopCount.value, 10);
    const isLossless = lossless.value ? 1 : 0;

    const args = [
      "-framerate",
      (fr > 0 ? fr : 20).toString(),
      "-i",
      "frame_%04d.png",
      "-c:v",
      "libwebp",
      "-pix_fmt",
      "yuva420p",
      "-lossless",
      isLossless.toString(),
    ];

    if (!lossless.value) {
      args.push("-quality", quality.value.toString());
    }

    args.push(
      "-compression_level",
      compressionLevel.value.toString(),
      "-loop",
      loop.toString(),
      "-an",
      "-vsync",
      "0",
      "output.webp",
    );

    pushLog(`执行底层命令: ffmpeg ${args.join(" ")}`);
    await ffmpeg.value.exec(args);

    pushLog("正在读取输出文件...");
    let data = await ffmpeg.value.readFile("output.webp");

    if (dontStack.value) {
      pushLog("正在应用不堆叠(background)策略...");
      data = patchWebPDisposal(data, true);
    }

    resultSize.value = data.length;
    const blob = new Blob([data.buffer], { type: "image/webp" });
    resultUrl.value = URL.createObjectURL(blob);
    pushLog("转换完成！");

    for (let i = 0; i < frames.value.length; i++) {
      const fileName = `frame_${i.toString().padStart(4, "0")}.png`;
      await ffmpeg.value.deleteFile(fileName);
    }
    await ffmpeg.value.deleteFile("output.webp");
  } catch (error) {
    const errorMsg = error && error.message ? error.message : String(error);
    pushLog(`Error: ${errorMsg}`);
    if (
      errorMsg.includes("fetch") ||
      errorMsg.includes("load") ||
      errorMsg.includes("import")
    ) {
      alert(
        "加载 FFmpeg 核心文件失败，请检查网络连接 (可能需要代理) 或稍后重试。",
      );
    } else {
      alert("转换过程中发生错误，请查看页面下方的日志。");
    }
  } finally {
    isProcessing.value = false;
  }
}

onBeforeUnmount(() => {
  for (const f of frames.value) {
    if (f?.url) URL.revokeObjectURL(f.url);
  }
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
});
</script>

<style scoped>
.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: contain;
  background: #eee;
}
</style>
