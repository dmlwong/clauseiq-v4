const ROUTE_ASSET_PATTERN = /\.[^/]+$/;

function shouldServeAppShell(request, response) {
  if (response.status !== 404) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const url = new URL(request.url);
  return !ROUTE_ASSET_PATTERN.test(url.pathname);
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (!shouldServeAppShell(request, response)) return response;

    const url = new URL(request.url);
    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  },
};
