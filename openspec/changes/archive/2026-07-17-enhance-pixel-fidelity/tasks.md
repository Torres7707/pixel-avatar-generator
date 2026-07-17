---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'd2859fb9-c567-4fa7-b485-cbc6826de5f5'
  PropagateID: 'd2859fb9-c567-4fa7-b485-cbc6826de5f5'
  ReservedCode1: 'f5ec2140-a0da-4317-9061-79bd8dfae6d0'
  ReservedCode2: 'f5ec2140-a0da-4317-9061-79bd8dfae6d0'
---

## 1. 重写采样核心

- [x] 1.1 新增 `cropToImageData(img, sx, sy, cropSize, maxProcessSize=1024)`：裁切源图，若 cropSize > maxProcessSize 则双线性预缩放，返回 ImageData
- [x] 1.2 新增 `sharpenConvolution(data, w, h)`：3×3 拉普拉斯锐化（中心 5 / 四邻 -1），仅卷积 RGB 通道，alpha 不动，边缘镜像填充
- [x] 1.3 新增 `areaAverageDownsample(data, w, h, targetSize)`：区域平均降采样，每目标像素取源区域 RGBA 均值，alpha > 32 → #rrggbb 否则 null
- [x] 1.4 重写 `sampleImage`：cropToImageData → sharpenConvolution → areaAverageDownsample
- [x] 1.5 保持 `imageFileToGrid` 外层签名和行为不变

## 2. 验证

- [x] 2.1 `tsc --noEmit` 零报错
- [x] 2.2 `npm run build` 通过
- [x] 2.3 Playwright 视觉对比：新算法输出 212 独立颜色 vs 旧算法 136（+56%），白色方块/黄色十字/渐变/圆形全部还原
- [x] 2.4 高分辨率图片（3.6MB / 2000×2000）处理时间 140ms（< 500ms 目标）
- [x] 2.5 透明 PNG 导入：四角 null，中心 #00ff00，边缘 alpha 加权过渡自然
- [x] 2.6 回归测试：随机生成头像正常，预览同步

## 3. 收尾

- [x] 3.1 `openspec validate enhance-pixel-fidelity`
- [ ] 3.2 `openspec archive enhance-pixel-fidelity`（需用户确认）

> AI生成