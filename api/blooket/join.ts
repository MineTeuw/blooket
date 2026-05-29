export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, msg: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch("https://blooketbot.schoolcheats.net/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://blooketbot.schoolcheats.net/",
        Origin: "https://blooketbot.schoolcheats.net",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, msg: "Proxy error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
