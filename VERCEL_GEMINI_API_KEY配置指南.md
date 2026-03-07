# Vercel 配置 GEMINI_API_KEY 指南

## 一、进入环境变量设置

1. 打开 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击你的项目（如 **kdm**）
3. 顶部菜单选择 **Settings**
4. 左侧菜单点击 **Environment Variables**

## 二、添加 GEMINI_API_KEY

1. 在 **Key** 输入框填写：`GEMINI_API_KEY`
2. 在 **Value** 输入框填写：你的 Google AI API 密钥
3. **Environment** 勾选：
   - Production（生产）
   - Preview（预览）
   - Development（开发）
4. 点击 **Save** 保存

## 三、验证是否生效

1. 保存后，Vercel 会提示需重新部署
2. 点击 **Redeploy** 或到 **Deployments** 页手动触发一次部署
3. 部署完成后，访问：`https://你的域名.vercel.app/api/gemini/test`
4. 若返回 `{"ok": true, "message": "Gemini API 连接正常"}` 表示配置成功

## 四、获取 API Key

1. 打开 [Google AI Studio](https://aistudio.google.com/apikey)
2. 登录 Google 账号
3. 点击 **Create API Key**
4. 选择或创建项目，复制生成的 Key

> 注意：图片生成模型需开通计费，免费额度可能无法使用。

## 五、常见问题

| 问题 | 处理方式 |
|------|----------|
| 修改后仍报错 | 必须重新部署，环境变量在部署时注入 |
| 返回 fetch failed | 多为网络问题，Vercel 部署在海外，一般无此问题 |
| 403 / PERMISSION_DENIED | API Key 无效或已泄露，重新生成并替换 |
