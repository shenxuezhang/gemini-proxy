/** 去除 data URL 前缀，返回纯 base64 字符串 */
export function cleanBase64(data: string): string {
  return data.includes(",") ? data.split(",")[1]! : data;
}
