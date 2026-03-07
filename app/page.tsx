export default function Home() {
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>eMAG Gemini API 代理服务</h1>
      <p>API 已就绪，供 emag_xpkb 搜品助手调用。</p>
      <p>
        <a href="/api/gemini/test" target="_blank" rel="noopener">诊断：测试 Gemini 连接</a>
      </p>
      <ul>
        <li>POST /api/gemini/generate - 图片生成</li>
        <li>POST /api/gemini/edit - 图片编辑/合成</li>
        <li>POST /api/gemini/chat - 对话式修图（多轮）</li>
        <li>POST /api/imagen/generate - Imagen 4 图片生成</li>
        <li>POST /api/veo/generate - 视频生成</li>
        <li>POST /api/veo/operation - 视频状态轮询</li>
        <li>POST /api/veo/download - 视频下载</li>
      </ul>
    </div>
  );
}
