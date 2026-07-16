const DOWNLOAD_ASSETS: Record<string, { name: string; url: string }> = {
  "meituan-cover": { name: "美团店铺主图", url: "https://github.com/user-attachments/assets/f94b005d-ea65-49c1-aace-a041ced9e3ab" },
  "meituan-service": { name: "美团服务主图", url: "https://github.com/user-attachments/assets/32b7ff44-db14-4709-982a-7d889c52ed58" },
  "xhs-profile": { name: "小红书账号主页", url: "https://github.com/user-attachments/assets/0d17b64f-b735-4208-9653-3c5375a1d72e" },
  "xhs-note": { name: "小红书营销海报", url: "https://github.com/user-attachments/assets/0e8972e4-bf88-49c3-9ff4-6707df121c1a" },
  "wechat-cover": { name: "微信账号主图", url: "https://github.com/user-attachments/assets/768bd141-edeb-4b12-841d-4a44df1e4b67" },
  "wechat-poster": { name: "朋友圈营销海报", url: "https://github.com/user-attachments/assets/783169d8-d37d-4c52-9579-6e018e57fb0a" },
};

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const asset = DOWNLOAD_ASSETS[id];
  if (!asset) return new Response("Not found", { status: 404 });

  const source = await fetch(asset.url);
  if (!source.ok) return new Response("Download failed", { status: 502 });

  const contentType = source.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  return new Response(await source.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${asset.name}.${extension}`)}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
