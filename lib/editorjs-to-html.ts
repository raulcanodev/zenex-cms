import { OutputBlockData } from "@editorjs/editorjs";

export function convertBlocksToHtml(blocks: OutputBlockData[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return "";
  }

  return blocks
    .map((block) => {
      switch (block.type) {
        case "header":
          const level = block.data.level || 2;
          return `<h${level} class="zenex-cms__header zenex-cms__h${level}">${block.data.text}</h${level}>`;
        
        case "paragraph":
          return `<p class="zenex-cms__paragraph">${block.data.text}</p>`;
        
        case "list":
          const listTag = block.data.style === "ordered" ? "ol" : "ul";
          const listClass = `zenex-cms__list zenex-cms__list--${block.data.style}`;
          const items = block.data.items || [];
          const listItems = items
            .map((item: string | { content?: string; text?: string }) => {
              const content = typeof item === 'string' ? item : item.content || item.text || "";
              return `<li class="zenex-cms__list-item">${content}</li>`;
            })
            .join("");
          return `<${listTag} class="${listClass}">${listItems}</${listTag}>`;
        
        case "quote":
          const caption = block.data.caption ? `<cite class="zenex-cms__quote-caption">— ${block.data.caption}</cite>` : "";
          return `<blockquote class="zenex-cms__quote"><p class="zenex-cms__quote-text">${block.data.text}</p>${caption}</blockquote>`;
        
        case "code":
          return `<pre class="zenex-cms__code-block"><code class="zenex-cms__code">${block.data.code || ""}</code></pre>`;
        
        case "image":
          const imgCaption = block.data.caption ? `<figcaption class="zenex-cms__image-caption">${block.data.caption}</figcaption>` : "";
          return `<figure class="zenex-cms__image-figure"><img src="${block.data.file?.url || block.data.url || ""}" alt="${block.data.caption || block.data.alt || ""}" class="zenex-cms__image" />${imgCaption}</figure>`;
        
        case "linkTool":
          const link = block.data;
          return `
            <div class="zenex-cms__link-tool">
              <a href="${link.link}" target="_blank" rel="noopener noreferrer" class="zenex-cms__link-tool-anchor">
                ${link.image?.url ? `<img src="${link.image.url}" alt="${link.title || ""}" class="zenex-cms__link-tool-image" />` : ""}
                <div class="zenex-cms__link-tool-content">
                  <h3 class="zenex-cms__link-tool-title">${link.title || link.link}</h3>
                  ${link.description ? `<p class="zenex-cms__link-tool-description">${link.description}</p>` : ""}
                  <span class="zenex-cms__link-tool-url">${link.link}</span>
                </div>
              </a>
            </div>
          `;
        
        default:
          return "";
      }
    })
    .join("");
}

