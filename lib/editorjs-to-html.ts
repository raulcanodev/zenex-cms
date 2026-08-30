import sanitizeHtml from "sanitize-html";

type Data = Record<string, unknown>;
const record = (value: unknown): Data => value && typeof value === "object" ? value as Data : {};
const text = (value: unknown): string => typeof value === "string" ? value : "";
const escape = (value: unknown): string => text(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

function listItems(items: unknown, tag: "ol" | "ul"): string {
  if (!Array.isArray(items)) return "";
  return items.map(item => {
    const data = record(item);
    const content = typeof item === "string" ? item : text(data.content) || text(data.text);
    const children = listItems(data.items, tag);
    return `<li class="zenex-cms__list-item">${content}${children ? `<${tag}>${children}</${tag}>` : ""}</li>`;
  }).join("");
}

/** Accept either Editor.js output or its blocks; sanitize the final HTML once. */
export function convertBlocksToHtml(content: unknown): string {
  const blocks = Array.isArray(content) ? content : record(content).blocks;
  if (!Array.isArray(blocks)) return "";

  const html = blocks.map(value => {
    const block = record(value);
    const data = record(block.data);
    switch (block.type) {
      case "header": {
        const level = [2, 3, 4, 5, 6].includes(Number(data.level)) ? Number(data.level) : 2;
        return `<h${level} class="zenex-cms__header zenex-cms__h${level}">${text(data.text)}</h${level}>`;
      }
      case "paragraph":
        return `<p class="zenex-cms__paragraph">${text(data.text)}</p>`;
      case "list": {
        const tag = data.style === "ordered" ? "ol" : "ul";
        return `<${tag} class="zenex-cms__list">${listItems(data.items, tag)}</${tag}>`;
      }
      case "quote":
        return `<blockquote class="zenex-cms__quote"><p>${text(data.text)}</p>${data.caption ? `<cite>— ${text(data.caption)}</cite>` : ""}</blockquote>`;
      case "code":
        return `<pre class="zenex-cms__code-block"><code class="zenex-cms__code">${escape(data.code)}</code></pre>`;
      case "image":
        return `<figure class="zenex-cms__image-figure"><img src="${escape(record(data.file).url || data.url)}" alt="${escape(data.caption || data.alt)}" class="zenex-cms__image" loading="lazy" decoding="async" />${data.caption ? `<figcaption>${text(data.caption)}</figcaption>` : ""}</figure>`;
      case "linkTool": {
        const meta = record(data.meta);
        const title = meta.title || data.title || data.link;
        const description = meta.description || data.description;
        const image = record(meta.image || data.image).url;
        return `<div class="zenex-cms__link-tool"><a href="${escape(data.link)}" target="_blank" rel="noopener noreferrer" class="zenex-cms__link-tool-anchor">${image ? `<img src="${escape(image)}" alt="" loading="lazy" />` : ""}<div><h3>${escape(title)}</h3>${description ? `<p>${escape(description)}</p>` : ""}</div></a></div>`;
      }
      case "table": {
        if (!Array.isArray(data.content)) return "";
        const rows = data.content.map((row, index) => {
          if (!Array.isArray(row)) return "";
          const tag = index === 0 && data.withHeadings ? "th" : "td";
          return `<tr>${row.map(cell => `<${tag}>${text(cell)}</${tag}>`).join("")}</tr>`;
        }).join("");
        return `<table class="zenex-cms__table"><tbody>${rows}</tbody></table>`;
      }
      case "raw":
        return text(data.html);
      case "embed":
        // Render unknown embeds as links rather than executing arbitrary markup.
        return `<p class="zenex-cms__embed"><a href="${escape(data.source || data.embed)}">${escape(data.caption || data.source || "View embed")}</a></p>`;
      case "delimiter":
        return '<div class="zenex-cms__delimiter">* * *</div>';
      default:
        return "";
    }
  }).join("");

  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  });
}
