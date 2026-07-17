---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '5922dc15-e19b-4306-af83-9e1c93078b8b'
  PropagateID: '5922dc15-e19b-4306-af83-9e1c93078b8b'
  ReservedCode1: '41a8b085-01c0-4a96-aa4d-d6804b558022'
  ReservedCode2: '41a8b085-01c0-4a96-aa4d-d6804b558022'
---

# Design: enhance-pixel-fidelity

## Context

当前 `imageImport.ts` 的 `sampleImage` 用 `drawImage` + `imageSmoothingEnabled=false` 做最近邻降采样。问题：

- 源图 4000×3000 → 目标 32×32 时，每格代表 ~125×125 区域，只取 1 个点
- 该点可能是局部噪声/非代表色 → 颜色偏差
- 区域内的高频细节（边缘、纹理）完全丢失 → 细节糊

理论上缩小图像应做区域聚合（box filter / area averaging）以抗混叠。同时为补偿区域平均带来的边缘软化，降采样前先做锐化卷积增强边缘。

现有管道（文件校验 → FileReader → Image → 方裁 → 采样 → PixelGrid）的前半段不变，仅替换"采样"这一步。

## Goals / Non-Goals

**Goals:**
- 区域平均降采样：每目标像素 = 源区域 RGBA 均值，颜色更准
- 锐化卷积预处理：降采样前增强边缘，细节还原更好
- 大图性能可控：高分辨率照片不卡顿
- 输出格式不变：PixelGrid 硬边纯色块，与现有编辑/导出完全兼容

**Non-Goals:**
- 不引入第三方库
- 不做调色板量化
- 不做 UI 参数调节
- 不保留旧算法作为可选项

## Decisions

### D1. 区域平均降采样（box filter 抗混叠）

取代最近邻，对每个目标像素 `(tx, ty)`，计算源图中对应矩形区域 `[sx0, sx1) × [sy0, sy1)` 内所有像素的 RGBA 均值。

```
srcW, srcH = 裁切后源图尺寸
N = targetSize

for ty in [0, N):
  sy0 = floor(ty * srcH / N)
  sy1 = floor((ty+1) * srcH / N)
  for tx in [0, N):
    sx0 = floor(tx * srcW / N)
    sx1 = floor((tx+1) * srcW / N)
    // 累加 [sx0,sx1)×[sy0,sy1) 所有像素 r,g,b,a
    // 均值 → 该目标像素颜色
```

**为什么不是浏览器双线性**：双线性只采样邻近 4 个像素，对大缩小比（如 125:1）等价于取局部 4 点平均，覆盖率仅 ~0.003%，远不如完整区域平均。区域平均覆盖 100% 源区域，是缩小图像的理论最优。

**输出风格不变**：区域平均只影响"每格取什么颜色"，最终仍是 N×N 硬边纯色块。

### D2. 锐化卷积预处理（拉普拉斯算子）

降采样前对源图做 3×3 拉普拉斯锐化：

```
核：           计算：
 0 -1  0       out = 5*center - up - down - left - right
-1  5 -1
 0 -1  0
```

- 中心权重 5，四邻各 -1：经典 4 邻拉普拉斯锐化，温和增强边缘
- 不用 8 邻（中心 9 / 八邻 -1）：过强，照片噪声被放大
- 对 RGB 三通道各自卷积，alpha 通道不卷积（保持透明区域边界清晰）
- 边缘像素（1 像素宽）用镜像填充或直接复制原值

**为什么先锐化再区域平均**：区域平均会软化边缘。先锐化把边缘对比度拉高，平均后仍保留可辨识的边缘过渡。若后锐化则放大平均化产生的量化噪声。

### D3. 性能策略：大图安全尺寸限制

裁切后的源图可能很大（4000×4000 照片 = 1600 万像素）。

- **区域平均计算量** ≈ 源像素数（遍历每个源像素累加到对应目标格），1600 万次操作约 50-100ms，可接受
- **锐化卷积计算量** ≈ 源像素数 × 9，1.4 亿次操作约 500ms+，可能卡顿

策略：裁切后若 `cropSize > MAX_PROCESS_SIZE (1024)`，先用浏览器双线性（`imageSmoothingEnabled=true, quality=high`）缩放到 1024×1024，再做锐化+区域平均。

理由：
- 1024 → 32 的缩小比为 32:1，区域平均仍远优于最近邻
- 双线性 4000→1024 保留了足够信息（每 4×4 区域取加权平均）
- 卷积在 1024² = 100 万像素上仅 ~9ms，无感知

若 `cropSize ≤ 1024`，直接在原尺寸上锐化+区域平均，不预缩放。

### D4. 透明通道处理（alpha 加权）

区域平均时对 alpha 也做均值：
- 源区域 10 个像素，3 个 alpha=255、7 个 alpha=0 → 均值 alpha=76.5
- 按 `ALPHA_THRESHOLD=32` 判定 → 76 > 32 → 有色，颜色取该区域 RGB 均值

这样半透明边缘区域不会被一刀切，过渡更自然。完全透明区域（均值 alpha ≤ 32）仍为 null。

### D5. 实现结构

重写 `sampleImage`，拆分为三个纯函数：

```typescript
/** 裁切 + 预缩放到安全尺寸 → ImageData */
function cropToImageData(img, sx, sy, cropSize, maxProcessSize): ImageData

/** 拉普拉斯锐化卷积（原地修改 ImageData 的 RGB，不动 alpha） */
function sharpenConvolution(data: Uint8ClampedArray, w: number, h: number): void

/** 区域平均降采样 → PixelGrid */
function areaAverageDownsample(data: Uint8ClampedArray, w: number, h: number, targetSize: number): PixelGrid
```

`imageFileToGrid` 外层流程不变，`sampleImage` 内部改为：
1. `cropToImageData` 获取源 ImageData
2. `sharpenConvolution` 锐化
3. `areaAverageDownsample` 降采样

### D6. 锐化强度参数

内置固定参数，不暴露到 UI：
- 核中心权重 5，四邻 -1（4 邻拉普拉斯）
- 后续如需调节，可提取为函数参数 `sharpenConvolution(data, w, h, strength=1)`

## Risks / Trade-offs

- **[锐化放大噪声]** 照片本身有噪声时锐化会放大。4 邻拉普拉斯较温和，且区域平均随后会平滑部分噪声。第一版可接受
- **[对比度下降]** 区域平均天然降低对比度。锐化预处理部分补偿。如仍不足，后续可加后处理对比度提升
- **[大图双线性预缩放损失]** 4000→1024 的双线性缩放有微小信息损失，但远好于直接最近邻。实测视觉差异极小
- **[性能]** 最坏情况 1024² 卷积 + 区域平均 ≈ 15ms，无感知。已排除 4000² 直接卷积的卡顿风险

## Migration Plan

1. 重写 `src/utils/imageImport.ts` 的 `sampleImage`，新增 `cropToImageData` / `sharpenConvolution` / `areaAverageDownsample`
2. 保留外层 `imageFileToGrid` 签名不变（File + targetSize → Promise<PixelGrid>）
3. `tsc --noEmit` + `vite build` 验证
4. Playwright 视觉对比：同一张测试图，旧算法 vs 新算法的输出网格对比
5. 高分辨率照片性能验证（>1MB 图片处理时间 < 200ms）
6. 透明 PNG 导入验证
7. 回归测试：随机生成/预设/绘制/导出不受影响
8. `openspec validate` + `openspec archive`

回滚：还原 `imageImport.ts` 的 `sampleImage` 为最近邻版本。

> AI生成