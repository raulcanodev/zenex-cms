import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import ipaddr from "ipaddr.js";

export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === "unicast"; }
  catch { return false; }
}

/** Resolve once, reject internal addresses, then connect to that exact IP. */
export async function resolvePublicUrl(input: string) {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port))) throw new Error("Unsupported preview URL");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = ipaddr.isValid(hostname)
    ? [{ address: hostname, family: ipaddr.parse(hostname).kind() === "ipv4" ? 4 : 6 }]
    : await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("Private or reserved addresses are not allowed");
  }
  return { url, hostname, address: addresses[0] };
}

export async function fetchPreviewHtml(input: string): Promise<{ html: string; url: string }> {
  const signal = AbortSignal.timeout(10_000);
  let target = input;
  for (let redirects = 0; redirects <= 3; redirects++) {
    signal.throwIfAborted();
    const { url, hostname, address } = await resolvePublicUrl(target);
    signal.throwIfAborted();
    const result = await new Promise<{ html?: string; location?: string }>((resolve, reject) => {
      const request = url.protocol === "https:" ? httpsRequest : httpRequest;
      const req = request({
        protocol: url.protocol,
        hostname: address.address,
        family: address.family,
        servername: hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        headers: { Host: url.host, "User-Agent": "ZenexCMS-LinkPreview/1.0", Accept: "text/html" },
        signal,
        // Do not reuse a socket whose DNS validation belongs to another request.
        agent: false,
      }, response => {
        const status = response.statusCode || 500;
        if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
          const location = new URL(response.headers.location, url).href;
          response.destroy();
          resolve({ location });
          return;
        }
        if (status < 200 || status >= 300 || !response.headers["content-type"]?.includes("text/html")) {
          response.destroy();
          reject(new Error("URL did not return an HTML page"));
          return;
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        const finish = () => resolve({ html: Buffer.concat(chunks).toString("utf8") });
        response.on("data", (chunk: Buffer) => {
          const remaining = 500_000 - bytes;
          chunks.push(chunk.subarray(0, remaining));
          bytes += Math.min(chunk.length, remaining);
          if (bytes >= 500_000) { finish(); response.destroy(); }
        });
        response.on("end", finish);
        response.on("error", reject);
      });
      req.on("error", reject);
      req.end();
    });
    if (result.html !== undefined) return { html: result.html, url: url.href };
    target = result.location!;
  }
  throw new Error("Too many redirects");
}
