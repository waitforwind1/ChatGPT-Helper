# ChatGPT Helper

一个 Chrome/Edge Manifest V3 浏览器插件，用拟人化柴犬助手的方式，在 ChatGPT 页面内提供轻量悬浮解释窗口。

## 功能

- 在 `chatgpt.com` 和 `chat.openai.com` 注入柴犬悬浮入口。
- ChatGPT 正在生成内容时自动展开为安静提示态。
- 支持展开、折叠、拖动位置、清空本次临时会话。
- 支持把模型返回的常见 Markdown 渲染成易读格式，包括加粗、列表、标题、引用块和代码。
- 用户可选中 ChatGPT 输出片段后提问，柴犬会优先解释选中文本。
- 使用用户自己的 OpenAI-compatible API Key，不保存长期历史。

## 本地加载

1. 打开 Chrome 或 Edge 的扩展管理页。
   - Chrome：地址栏输入 `chrome://extensions/`
   - Edge：地址栏输入 `edge://extensions/`
2. 开启右上角的“开发者模式”。
3. 选择“加载已解压的扩展程序”。
4. 选择本目录：`chatgpt-floating-helper`。
5. 在浏览器工具栏点击扩展图标，打开 `ChatGPT Helper` 弹窗。
6. 点击“喂一下 API Key”，填写 `API Key`、`Base URL` 和 `Model`。
7. 打开或刷新 `https://chatgpt.com/`，页面右下角会出现柴犬悬浮按钮。

如果工具栏看不到扩展图标，点击浏览器右上角的拼图图标，把 `ChatGPT Helper` 固定到工具栏。

注意：柴犬悬浮窗只会出现在 `chatgpt.com` 和 `chat.openai.com` 页面，在其它网站不会显示。

## 使用

- 点击柴犬按钮展开助手。
- 按住柴犬按钮可以拖动折叠态位置。
- 展开后按住面板标题栏可以拖动面板位置。
- 选中 ChatGPT 输出中的一段内容后提问，柴犬会优先解释选中文本。
- 点击页面其它位置会自动收起窗口，并回到展开前的柴犬按钮位置。
- 点击“清空狗窝”只会清空本次页面临时会话，不会删除任何长期历史，因为插件默认不保存长期历史。

## 开发校验

```bash
npm test
npm run check
```
