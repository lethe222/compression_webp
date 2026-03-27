【角色设定】 你现在是一位精通 WebAssembly (WASM)、图像处理算法以及高性能前端应用开发的资深工程师。
【项目目标】 我需要你开发一个 Web 网站。 这个应用的功能是：允许用户在浏览器中上传多张 PNG 图片，然后利用用户本地电脑的 CPU 算力，将它们合成并压缩成一个高质量的动态 WebP 文件。 \*\*核心要求：整个过程必须完全在前端完成，不得将图片上传到任何后端服务器。\*\*应用的压缩质量和特性需要对标“Ezgif”网站（ <https://ezgif.com/webp-maker/ezgif-86647c135d9a2247-split.html`> \` ）

## 运行方式（已重构为 Vue3 + Vite）

前端纯本地运行，不需要后端；FFmpeg.wasm 相关资源随 npm 依赖安装并由本地站点提供（不再依赖 unpkg）。

```bash
npm install
npm run dev
```

打开终端输出的本地地址即可使用。

## 目录结构（关键文件）

- [index.html](file:///Users/chao/Desktop/github/webp/index.html)：入口 HTML（Tailwind CDN）
- [App.vue](file:///Users/chao/Desktop/github/webp/src/App.vue)：主页面（上传、拖拽排序、参数区、日志、预览下载）
- [ffmpegClient.js](file:///Users/chao/Desktop/github/webp/src/lib/ffmpegClient.js)：FFmpeg.wasm 初始化与加载（Blob URL 同源化）
- [patchWebPDisposal.js](file:///Users/chao/Desktop/github/webp/src/lib/patchWebPDisposal.js)：不堆叠帧（Disposal=background）写入 ANMF 标志位

## 透明通道说明

- 透明丢失通常是因为输出像素格式不带 alpha，本项目在编码时强制使用 `-pix_fmt yuva420p` 保留透明通道。
- `-alpha_quality` 属于部分 FFmpeg/libwebp 构建的可选参数；在当前 ffmpeg.wasm 构建里不可用时会报“不是有效的 FFmpeg 选项”，因此不使用该参数。

---
【核心技术栈要求（非常重要）】
运行环境：纯浏览器端（HTML + CSS + Vanilla JS 或 Vue/React）。
核心引擎（WASM）：为了实现 Ezgif 级别的压缩率和控制力，你不能使用浏览器原生的简单 Canvas API (canvas.toDataURL('image/webp'))。
你必须使用 WebAssembly (WASM) 技术引入底层的图像编码库。推荐使用 ffmpeg.wasm（因为它包含了完整的 libwebp 支持）或者专门的 libwebp WASM 封装。
你的代码必须能够调用底层的类似于 Google 官方提供的 cwebp (用于单帧高质量压缩) 和 webpmux (用于组装动图) 的功能。
【功能与参数细节清单】
请参考我提供的信息和截图，实现以下功能模块和参数调节区，并将 UI 上的参数准确映射到底层 WASM 的执行命令中：

1. 图片导入与管理区
   支持拖拽或点击上传多张 PNG 图片。
   提供一个列表展示已上传的图片缩略图，并允许用户拖拽调整帧的顺序。
2. 帧处理区 (参考截图 "Toggle a range of frames")
   范围跳过 (Skip range)：提供 "From: \[数字] To: \[数字]" 的输入框和一个 "Skip range" 按钮，用于在处理前剔除指定范围的帧。
   抽帧 (Skip every N-th)：提供 "Every: \[数字]" 输入框和一个按钮，用于实现例如“每隔一张取一张”的功能，减少总帧数。
3. 时间与循环控制区 (参考截图 "Delay time...")
   帧延迟 (Delay time)：提供一个输入框输入毫秒数 (ms)，例如 50ms。同时在旁边自动计算并显示对应的 FPS (例如 20.00 FPS)。
   循环次数 (Loop count)：提供输入框。留空代表无限循环 (infinite loop)。
4. 特效与合成规则区 (参考截图 "Effects")
   (核心) 不堆叠帧 (Don't stack frames / Disposal Method)：提供一个复选框。
   技术说明：选中时，应配置 muxer 在绘制下一帧前清除当前帧的画布背景（对应 WebP 的 disposal method 为 background 而非 none）。这对于处理透明背景的 PNG 至关重要，防止画面残留叠加。
5. 输出质量与压缩控制区 (Ezgif 核心特性还原) 这是最关键的部分，目的是榨干本地 CPU 以获取最优画质体积比。
   质量 (Quality) 滑块：提供 0-100 的滑块（参考截图），控制有损压缩的质量。
   无损模式 (Lossless) 开关：提供一个复选框。选中时，忽略质量滑块，强制使用无损压缩。
   (重中之重) 压缩耗时/算法级别 (Compression Method)：
   UI：提供一个标有 "CPU 使用率/压缩级别 (Method)" 的滑块，范围 0 到 6。默认为 6。
   技术说明：这个滑块必须直接对应底层 cwebp 的 -m 参数。告诉用户：级别越高，消耗本地 CPU 越多，但能获得更小的体积和更好的画质。
   Alpha 通道优化：在有损压缩模式下，底层的命令需要确保对透明通道进行高质量处理，防止边缘出现锯齿（对应 cwebp 的 alpha 处理参数）。
   剥离元数据：默认在底层命令中剥离 ICC Profile 和 EXIF 信息以减小体积。
   【UI/UX 要求】
   界面简洁现代，可以使用 Tailwind CSS CDN 或简单的自定义 CSS。
   进度反馈：由于 CPU 密集型操作可能需要几秒到几分钟，点击“开始转换”后，必须显示明确的进度条或 Loading 状态，最好能在页面下方输出 WASM 引擎的日志信息。
   结果展示：转换完成后，在页面上预览生成的动态 WebP，并提供下载按钮和最终文件大小显示。
   【输出要求】 请提供完整的、可以直接运行的 HTML 文件代码（如果包含 JS/CSS，请内联在 HTML 中或清晰分离）。代码需要有详细的注释，特别是说明如何加载和使用 WASM 部分。
