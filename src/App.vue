<template>
  <div class="min-h-screen py-8 px-4 relative">
    <!-- 渐变背景层 -->
    <div class="absolute inset-0" style="background-image: radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%), linear-gradient(135deg, #c6e6ff 0%, #f8d7ee 30%, #fff2d8 65%, #fad8e8 100%); opacity: 0.25; z-index: 0;"></div>
    <!-- 内容层 -->
    <div class="max-w-2xl mx-auto relative z-10">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <span
          class="flex-shrink-0 px-1.5 py-0.5 rounded text-xs"
          style="
            border: 1.5px solid #4e6ef2;
            color: #4e6ef2;
            font-weight: 700;
            letter-spacing: 0.04em;
            line-height: 1;
          "
          >WebP</span
        >
        <div>
          <h1
            class="text-xl font-bold text-gray-900 leading-tight"
            style="font-size: 1.15rem; font-weight: 700; line-height: 1.3"
          >
            动态 WebP 生成器
          </h1>
          <p class="text-xs text-gray-400 mt-0.5">
            纯前端 · 高效转换 · 精细控制
          </p>
        </div>
      </div>

      <!-- 上传区域 + 帧列表（合并容器） -->
      <div
        class="mb-5 border-2 border-dashed rounded-2xl transition-all duration-200"
        :class="
          dragOver
            ? 'border-opacity-60'
            : frames.length > 0
              ? 'border-gray-200'
              : 'border-gray-200 hover:border-opacity-60'
        "
        :style="{
          borderColor: dragOver || frames.length === 0 ? '#4e6ef2' : '',
          backgroundColor: dragOver
            ? 'rgba(78, 110, 242, 0.05)'
            : frames.length > 0
              ? '#ffffff'
              : 'rgba(245, 246, 248, 0.6)',
        }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleDrop"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/png"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- 空状态：显示上传提示 -->
        <div
          v-if="frames.length === 0"
          class="py-10 flex flex-col items-center justify-center gap-2 cursor-pointer"
          @click="openFilePicker"
        >
          <div
            class="w-11 h-11 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <p class="text-sm text-gray-500">
            <span class="font-medium" style="color: #4e6ef2">点击选择</span>
            &nbsp;或将 PNG 图片拖拽到此处
          </p>
          <p class="text-xs text-gray-400">支持多选，按帧序排列</p>
        </div>

        <!-- 有帧时：显示帧列表 -->
        <div v-else class="p-3">
          <div class="flex items-center justify-between mb-2.5">
            <p class="font-medium text-sm text-gray-500">
              帧列表（{{ frames.length }} 张）
            </p>
            <div class="flex items-center gap-3">
              <button
                class="text-xs transition-colors"
                style="color: #4e6ef2"
                @mouseover="(e) => (e.target.style.color = '#3a5bd9')"
                @mouseout="(e) => (e.target.style.color = '#4e6ef2')"
                @click="openFilePicker"
              >
                + 添加更多
              </button>
              <button
                class="text-xs text-red-400 hover:text-red-500 transition-colors"
                @click="clearAllFrames"
              >
                清空全部
              </button>
            </div>
          </div>
          <Draggable
            v-model="frames"
            item-key="id"
            class="flex flex-wrap gap-2"
            handle=".drag-handle"
          >
            <template #item="{ element, index }">
              <div
                class="relative group rounded-xl overflow-hidden ring-1 ring-gray-200 bg-gray-100 transition-all"
                style="background-color: #ffffff"
                :style="{ '--hover-ring': '#4e6ef2' }"
                @mouseover="
                  (e) =>
                    e.target
                      .closest('.group')
                      .style.setProperty('--ring-color', '#4e6ef2')
                "
                @mouseout="
                  (e) =>
                    e.target
                      .closest('.group')
                      .style.removeProperty('--ring-color')
                "
              >
                <div
                  class="drag-handle absolute top-0 left-0 bg-black/60 text-white px-1.5 py-0.5 text-xs cursor-grab active:cursor-grabbing rounded-br-lg leading-none z-10"
                >
                  {{ index + 1 }}
                </div>
                <img :src="element.url" class="thumbnail block" />
                <button
                  class="absolute top-0 right-0 bg-red-500/90 hover:bg-red-600 text-white w-5 h-5 text-xs hidden group-hover:flex items-center justify-center rounded-bl-lg z-10"
                  @click.stop="removeFrame(index)"
                >
                  &times;
                </button>
              </div>
            </template>
          </Draggable>
        </div>
      </div>

      <!-- 替换/追加 确认弹窗 -->
      <Teleport to="body">
        <div
          v-if="showReplaceDialog"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            class="absolute inset-0 bg-black/30 backdrop-blur-sm"
            @click="cancelReplace"
          />
          <div class="relative bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"
              >
                <svg
                  class="w-5 h-5 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-800 text-sm">已有帧列表</h3>
                <p class="text-xs text-gray-400">
                  当前已有 {{ frames.length }} 张，如何处理？
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-2 mt-4">
              <button
                class="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors"
                style="background-color: #4e6ef2"
                @mouseover="(e) => (e.target.style.backgroundColor = '#3a5bd9')"
                @mouseout="(e) => (e.target.style.backgroundColor = '#4e6ef2')"
                @click="confirmAppend"
              >
                追加到末尾
              </button>
              <button
                class="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-sm font-medium transition-colors"
                @click="confirmReplace"
              >
                替换（清空重新导入）
              </button>
              <button
                class="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm transition-colors"
                @click="cancelReplace"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 反馈弹窗 -->
      <Teleport to="body">
        <div
          v-if="showFeedbackDialog"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/50"
            @click="closeFeedbackDialog"
          />
          <div class="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full"
                  style="background: linear-gradient(135deg, #7c6ef2, #a78bfa)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 10H16M8 14H13M6.2 19.8L6.7 16.3C6.76 15.87 6.97 15.48 7.29 15.2L17.2 6.52C17.91 5.9 18.98 5.94 19.64 6.6V6.6C20.36 7.32 20.34 8.49 19.58 9.18L9.16 18.61C8.88 18.87 8.53 19.04 8.15 19.1L6.2 19.8Z"
                      stroke="white"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <h2 class="text-lg font-bold text-gray-900">用户反馈</h2>
              </div>
              <button
                type="button"
                title="关闭"
                class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                @click="closeFeedbackDialog"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <form class="space-y-5 p-6" @submit.prevent="submitFeedback">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-900">
                  反馈内容 <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="feedbackForm.content"
                  rows="4"
                  required
                  placeholder="请输入您的反馈..."
                  class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#7c6ef2] focus:ring-2 focus:ring-[#7c6ef2]/15"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-900">
                  联系方式 <span class="font-normal text-gray-400">(选填)</span>
                </label>
                <input
                  v-model="feedbackForm.contact"
                  type="text"
                  placeholder="邮箱或电话"
                  class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#7c6ef2] focus:ring-2 focus:ring-[#7c6ef2]/15"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-900">
                  评分
                </label>
                <select
                  v-model.number="feedbackForm.rating"
                  class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#7c6ef2] focus:ring-2 focus:ring-[#7c6ef2]/15"
                >
                  <option :value="5">⭐⭐⭐⭐⭐ 非常满意</option>
                  <option :value="4">⭐⭐⭐⭐ 满意</option>
                  <option :value="3">⭐⭐⭐ 一般</option>
                  <option :value="2">⭐⭐ 不满意</option>
                  <option :value="1">⭐ 非常不满意</option>
                </select>
              </div>

              <button
                type="submit"
                :disabled="feedbackSubmitting"
                class="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                :style="{
                  background: feedbackSubmitting
                    ? 'linear-gradient(135deg, #a78bfa, #c4b5fd)'
                    : 'linear-gradient(135deg, #7c6ef2, #a78bfa)',
                  boxShadow: feedbackSubmitting
                    ? 'none'
                    : '0 4px 14px rgba(124, 110, 242, 0.3)',
                }"
              >
                <svg
                  v-if="feedbackSubmitting"
                  class="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="white"
                    stroke-width="3"
                    stroke-opacity="0.3"
                  />
                  <path
                    d="M21 12A9 9 0 0012 3"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                </svg>
                {{ feedbackSubmitting ? "提交中..." : "提交反馈" }}
              </button>

              <div
                v-if="feedbackMessage"
                class="rounded-lg border px-4 py-2 text-center text-sm"
                :class="
                  feedbackMessageType === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                "
              >
                {{ feedbackMessage }}
              </div>
            </form>
          </div>
        </div>
      </Teleport>

      <!-- 设置 2x2 网格 -->
      <div class="grid grid-cols-2 gap-4 mb-5">
        <!-- 帧处理 -->
        <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg
              class="w-4 h-4"
              style="color: #4e6ef2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 10h16M4 14h8"
              />
            </svg>
            <h3 class="font-semibold text-sm text-gray-800">帧处理</h3>
          </div>
          <div class="mb-3">
            <p class="text-xs text-gray-400 mb-1.5">范围跳过（删除指定范围）</p>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-gray-400">从</span>
              <input
                v-model="skipFrom"
                type="number"
                class="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
                style="--tw-ring-color: rgba(78, 110, 242, 0.1)"
                min="1"
              />
              <span class="text-xs text-gray-400">到</span>
              <input
                v-model="skipTo"
                type="number"
                class="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
                style="--tw-ring-color: rgba(78, 110, 242, 0.1)"
                min="1"
              />
              <button
                class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                @click="applySkipRange"
              >
                应用
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1.5">
              抽帧（每隔 N 张保留一张）
            </p>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-gray-400">每隔</span>
              <input
                v-model="skipEvery"
                type="number"
                class="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center"
                style="--tw-ring-color: rgba(78, 110, 242, 0.1)"
                min="2"
              />
              <button
                class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                @click="applySkipEvery"
              >
                应用
              </button>
            </div>
          </div>
        </div>

        <!-- 时间与循环 -->
        <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg
              class="w-4 h-4"
              style="color: #4e6ef2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="font-semibold text-sm text-gray-800">时间与循环</h3>
          </div>
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs text-gray-500">帧延迟（毫秒/ms）</span>
              <span class="text-xs font-semibold" style="color: #4e6ef2"
                >= {{ fps }} FPS</span
              >
            </div>
            <input
              v-model.number="delayMs"
              type="number"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              style="--tw-ring-color: rgba(78, 110, 242, 0.1)"
              min="1"
            />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1.5">循环次数</p>
            <input
              v-model="loopCount"
              type="number"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500"
              style="--tw-ring-color: rgba(78, 110, 242, 0.1)"
              placeholder="默认（0 = 无限循环）"
            />
          </div>
        </div>

        <!-- 特效与合成 -->
        <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg
              class="w-4 h-4"
              style="color: #4e6ef2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 class="font-semibold text-sm text-gray-800">特效与合成</h3>
          </div>
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              v-model="dontStack"
              type="checkbox"
              class="mt-0.5 w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
              style="accent-color: #4e6ef2"
            />
            <div>
              <span class="text-sm text-gray-700"
                >不堆叠帧（清除当前帧画布背景）</span
              >
              <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                处理透明 PNG 时尤为重要，防止画面堆叠<br />(Disposal:
                background)
              </p>
            </div>
          </label>
        </div>

        <!-- 输出质量与压缩 -->
        <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg
              class="w-4 h-4"
              style="color: #4e6ef2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <h3 class="font-semibold text-sm text-gray-800">输出质量与压缩</h3>
          </div>
          <label class="flex items-center gap-2 cursor-pointer mb-3">
            <input
              v-model="lossless"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 cursor-pointer"
              style="accent-color: #4e6ef2"
            />
            <span class="text-sm text-gray-700">无损模式 (Lossless)</span>
          </label>
          <div :class="{ 'opacity-40 pointer-events-none': lossless }">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-500">质量</span>
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                style="
                  color: #4e6ef2;
                  background-color: rgba(78, 110, 242, 0.1);
                "
                >{{ quality }}</span
              >
            </div>
            <input
              v-model.number="quality"
              type="range"
              min="0"
              max="100"
              class="w-full mb-3"
              style="accent-color: #4e6ef2"
            />
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-500">CPU 压缩级别</span>
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                style="
                  color: #4e6ef2;
                  background-color: rgba(78, 110, 242, 0.1);
                "
                >{{ compressionLevel }}</span
              >
            </div>
            <input
              v-model.number="compressionLevel"
              type="range"
              min="0"
              max="6"
              class="w-full"
              style="accent-color: #4e6ef2"
            />
            <p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
              级别越高消耗 CPU 越多，但体积更小、画质更优
            </p>
          </div>
        </div>
      </div>

      <!-- 开始转换按钮 -->
      <button
        class="w-full py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-200 shadow-md"
        :style="{
          backgroundColor:
            isProcessing || frames.length === 0
              ? 'rgba(78, 110, 242, 0.2)'
              : '#4e6ef2',
          cursor:
            isProcessing || frames.length === 0 ? 'not-allowed' : 'pointer',
        }"
        :disabled="isProcessing || frames.length === 0"
        @mouseover="
          (e) => {
            if (!isProcessing && frames.length > 0)
              e.target.style.backgroundColor = '#3a5bd9';
          }
        "
        @mouseout="
          (e) => {
            if (!isProcessing && frames.length > 0)
              e.target.style.backgroundColor = '#4e6ef2';
          }
        "
        @click="startConversion"
      >
        {{ isProcessing ? "处理中..." : "开始转换（生成 WebP）" }}
      </button>

      <p class="text-center text-xs text-gray-400 mt-2">
        纯前端处理，图片不会上传至任何服务器
      </p>

      <!-- 进度条 -->
      <div v-if="isProcessing" class="mt-4">
        <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="h-1.5 transition-all rounded-full"
            style="background-color: #4e6ef2"
            :style="{ width: `${progressPercent ?? 5}%` }"
          />
        </div>
        <div class="text-xs text-gray-400 mt-1 text-center">
          <span v-if="progressPercent != null"
            >{{ progressPercent.toFixed(0) }}%</span
          >
          <span v-else>处理中...</span>
        </div>
      </div>

      <!-- 日志 -->
      <div v-if="isProcessing || logs.length > 0" class="mt-4">
        <div
          class="bg-gray-950 rounded-xl p-3 h-32 overflow-y-auto font-mono text-xs text-emerald-400"
        >
          <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
        </div>
      </div>

      <!-- 结果 -->
      <div
        v-if="resultUrl"
        class="mt-4 p-5 border border-emerald-200 rounded-2xl bg-emerald-50 text-center"
      >
        <h3 class="text-base font-bold text-emerald-700 mb-3">转换完成!</h3>
        <img
          :src="resultUrl"
          class="mx-auto max-w-full max-h-[360px] shadow-md rounded-xl mb-3 bg-gray-100"
        />
        <p class="mb-3 text-gray-600 text-sm">
          最终文件大小：<span class="font-semibold text-gray-800"
            >{{ (resultSize / 1024).toFixed(2) }} KB</span
          >
        </p>
        <a
          :href="resultUrl"
          download="animated.webp"
          class="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          style="background-color: #4e6ef2"
          @mouseover="(e) => (e.target.style.backgroundColor = '#3a5bd9')"
          @mouseout="(e) => (e.target.style.backgroundColor = '#4e6ef2')"
        >
          下载 WebP 文件
        </a>
      </div>
    </div>

    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <button
        type="button"
        title="用户反馈"
        class="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-110"
        style="background: linear-gradient(135deg, #7c6ef2, #a78bfa)"
        @click="openFeedbackDialog"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 10H16M8 14H13M7 19L4.8 20.1C4.46 20.27 4.07 19.98 4.14 19.61L4.61 16.83C4.68 16.4 4.55 15.96 4.26 15.63C3.47 14.72 3 13.53 3 12.24C3 8.79 6.13 6 10 6H14C17.87 6 21 8.79 21 12.24C21 15.69 17.87 18.48 14 18.48H10.78C10.15 18.48 9.53 18.66 9 19L7 19Z"
            stroke="white"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <a
        :href="HOME_PAGE_URL"
        target="_blank"
        rel="noopener noreferrer"
        title="返回首页"
        class="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-110"
        style="background: #3370ff"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-md"
          style="background: #3370ff"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" />
            <rect
              x="8"
              y="1"
              width="5"
              height="5"
              rx="1.5"
              fill="white"
              fill-opacity="0.6"
            />
            <rect
              x="1"
              y="8"
              width="5"
              height="5"
              rx="1.5"
              fill="white"
              fill-opacity="0.6"
            />
            <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" />
          </svg>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from "vue";
import Draggable from "vuedraggable";
import { createFFmpegClient, getFetchFile } from "./lib/ffmpegClient";
import { patchWebPDisposal } from "./lib/patchWebPDisposal";

const FEEDBACK_API_URL = "http://101.200.38.189:3000/api/feedback";
const HOME_PAGE_URL = "https://lethe222.github.io/Design-tool-collection-website/#";

const fileInput = ref(null);
const dragOver = ref(false);

const frames = ref([]);
const skipFrom = ref("");
const skipTo = ref("");
const skipEvery = ref("");

const delayMs = ref(50);
const loopCount = ref("");

const dontStack = ref(true);

const lossless = ref(false);
const quality = ref(75);
const compressionLevel = ref(6);

const showReplaceDialog = ref(false);
const pendingFiles = ref([]);
const showFeedbackDialog = ref(false);
const feedbackSubmitting = ref(false);
const feedbackMessage = ref("");
const feedbackMessageType = ref("success");
const feedbackForm = ref({
  content: "",
  contact: "",
  rating: 3,
});

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
  const files = Array.from(fileList || []).filter(
    (f) => f.type === "image/png",
  );
  if (files.length === 0) return;

  if (frames.value.length > 0) {
    pendingFiles.value = files;
    showReplaceDialog.value = true;
    return;
  }

  doAddFiles(files);
}

function doAddFiles(files) {
  const prevLength = frames.value.length;
  for (let i = 0; i < files.length; i++) {
    frames.value.push({
      id: `${Date.now()}_${i}_${Math.random().toString(16).slice(2)}`,
      file: files[i],
      url: URL.createObjectURL(files[i]),
    });
  }
  if (frames.value.length > prevLength && frames.value.length > 1) {
    autoDetectFrameParams();
  }
}

function confirmAppend() {
  showReplaceDialog.value = false;
  doAddFiles(pendingFiles.value);
  pendingFiles.value = [];
}

function confirmReplace() {
  showReplaceDialog.value = false;
  for (const f of frames.value) {
    if (f?.url) URL.revokeObjectURL(f.url);
  }
  frames.value = [];
  doAddFiles(pendingFiles.value);
  pendingFiles.value = [];
}

function cancelReplace() {
  showReplaceDialog.value = false;
  pendingFiles.value = [];
}

function clearAllFrames() {
  for (const f of frames.value) {
    if (f?.url) URL.revokeObjectURL(f.url);
  }
  frames.value = [];
}

function resetFeedbackState() {
  feedbackMessage.value = "";
  feedbackMessageType.value = "success";
}

function openFeedbackDialog() {
  resetFeedbackState();
  showFeedbackDialog.value = true;
}

function closeFeedbackDialog() {
  if (feedbackSubmitting.value) return;
  showFeedbackDialog.value = false;
}

async function submitFeedback() {
  if (!feedbackForm.value.content.trim()) {
    feedbackMessage.value = "请输入反馈内容";
    feedbackMessageType.value = "error";
    return;
  }

  feedbackSubmitting.value = true;
  feedbackMessage.value = "";

  try {
    const response = await fetch(FEEDBACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: feedbackForm.value.content,
        contact: feedbackForm.value.contact,
        rating: feedbackForm.value.rating,
      }),
    });

    const result = await response.json();

    if (result.success) {
      feedbackMessage.value = "反馈提交成功！感谢您的反馈";
      feedbackMessageType.value = "success";
      feedbackForm.value = {
        content: "",
        contact: "",
        rating: 3,
      };
      window.setTimeout(() => {
        showFeedbackDialog.value = false;
      }, 1500);
      return;
    }

    feedbackMessage.value = result.message || "提交失败,请重试";
    feedbackMessageType.value = "error";
  } catch (error) {
    console.error("提交失败:", error);
    feedbackMessage.value = "网络错误,请检查网络连接";
    feedbackMessageType.value = "error";
  } finally {
    feedbackSubmitting.value = false;
  }
}

function autoDetectFrameParams() {
  const count = frames.value.length;
  if (count <= 1) return;

  // 根据帧数自动建议抽帧间隔
  if (count > 60) {
    skipEvery.value = "2";
  } else if (count > 30) {
    skipEvery.value = "3";
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
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

function handleBeforeUnload(e) {
  if (frames.value.length > 0) {
    e.preventDefault();
    e.returnValue = "您有已上传的图片，刷新将丢失这些数据。确定要刷新吗？";
    return "您有已上传的图片，刷新将丢失这些数据。确定要刷新吗？";
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped>
.thumbnail {
  width: 72px;
  height: 72px;
  object-fit: contain;
  background: #f3f4f6;
  display: block;
}
</style>
