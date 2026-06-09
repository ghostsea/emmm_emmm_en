# Graph Tool

本目录是一个可直接本地打开的图片布局工具模块，入口文件为 `index.html`。

## 使用

1. 双击 `graph_tool/index.html` 或 `graph_tool/open.cmd`，也可以在 PowerShell 中运行：

   ```powershell
   Start-Process .\graph_tool\index.html
   ```

2. 上传或拖入图片，在画布中拖拽定位。
3. 在右侧面板调整坐标、缩放、旋转和图层顺序。
4. 保存 `scene_layout.json` 或导出当前画布 PNG。

保存的 JSON 只包含图片名称、坐标、缩放和旋转参数，不包含图片像素数据。

## 嵌入

`app.js` 暴露了 `window.GraphTool.create(root, options)`，可以挂载到任意容器：

```html
<div id="graph-tool-root"></div>
<link rel="stylesheet" href="./styles.css">
<script src="./app.js"></script>
<script>
  const tool = GraphTool.create(document.getElementById("graph-tool-root"));
</script>
```

`tool.getState()` 可读取当前布局，`tool.setState(state)` 可恢复布局。
