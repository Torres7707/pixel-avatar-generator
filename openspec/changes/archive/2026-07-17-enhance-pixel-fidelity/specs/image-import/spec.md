---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '1afde9cd-46c9-441e-a6d1-f6459bc75f08'
  PropagateID: '1afde9cd-46c9-441e-a6d1-f6459bc75f08'
  ReservedCode1: 'cc4e38d1-b466-4501-b81a-c54b477e0519'
  ReservedCode2: 'cc4e38d1-b466-4501-b81a-c54b477e0519'
---

# image-import Specification (delta: enhance-pixel-fidelity)

## MODIFIED Requirements

### Requirement: 图片像素化转换
The system SHALL convert uploaded image files to a PixelGrid of the current canvas size using area-average downsampling with Laplacian sharpening pre-processing, with center-crop preprocessing for non-square images. The nearest-neighbor downsampling is replaced by area-average (box filter) downsampling to preserve color fidelity and detail.

#### Scenario: 正方形图片导入
- **WHEN** 用户上传一张 200×200 的图片，当前画板尺寸为 32
- **THEN** 图片经拉普拉斯锐化预处理后，按区域平均降采样到 32×32 像素
- **AND** 每个目标像素的颜色为其源区域所有像素 RGBA 均值（非单点采样）
- **AND** 生成的 32×32 PixelGrid 通过 `loadGrid()` 载入 store

#### Scenario: 非正方形图片居中方裁
- **WHEN** 用户上传一张 400×300 的图片，当前画板尺寸为 32
- **THEN** 图片被居中裁切为 300×300（水平偏移 50px）
- **AND** 裁切后的正方形经锐化+区域平均降采样到 32×32
- **AND** 生成的 PixelGrid 载入 store

#### Scenario: 高分辨率图片导入
- **WHEN** 用户上传一张 4000×3000 的照片
- **THEN** 居中方裁后，若裁切边长 > 1024，先双线性预缩放到 1024×1024
- **AND** 预缩放后做拉普拉斯锐化 + 区域平均降采样
- **AND** 处理时间 < 500ms，不出现 OOM 或卡死
- **AND** 降采样结果视觉可辨识，边缘细节比最近邻更清晰

#### Scenario: 透明 PNG 导入
- **WHEN** 用户上传一张含透明区域的 PNG
- **THEN** 区域平均时 alpha 通道同样取均值
- **AND** 均值 alpha > 32 的像素保留颜色（RGB 均值）
- **AND** 均值 alpha ≤ 32 的像素为 `null`

#### Scenario: 锐化增强边缘细节
- **WHEN** 图片含清晰的边缘/轮廓（如人物剪影、图标边界）
- **THEN** 降采样前经拉普拉斯锐化卷积增强边缘对比度
- **AND** 降采样后边缘过渡比无锐化的区域平均更清晰可辨

### Requirement: 零外部依赖
The system SHALL implement image pixelation using pure Canvas API and handwritten JavaScript (area-average downsampling + Laplacian convolution), without any third-party npm packages.

#### Scenario: 无新增 npm 依赖
- **WHEN** 检查 package.json 的 dependencies
- **THEN** 不包含 pixelit、rgbquant、image-js 或其他图片处理库
- **AND** 锐化卷积和区域平均降采样均为纯 JS 实现

> AI生成