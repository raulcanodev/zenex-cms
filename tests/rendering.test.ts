import { describe, expect, it } from "vitest";
import { convertBlocksToHtml } from "@/lib/editorjs-to-html";

describe("public HTML", () => {
  it("escapes code instead of turning examples into live markup", () => {
    const html = convertBlocksToHtml([{ type: "code", data: { code: '<script>alert("x")</script> & <div>' } }]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
  it("removes active markup but keeps text, formatting, and safe links", () => {
    const html = convertBlocksToHtml({ blocks: [{ type: "raw", data: { html: '<p onclick="evil()"><strong>Hello</strong><script>evil()</script><a href="javascript:evil()">unsafe</a><a href="https://example.com">safe</a><img src="x" onerror="evil()"></p>' } }] });
    expect(html).not.toMatch(/onclick|onerror|javascript:|<script/);
    expect(html).toContain("<strong>Hello</strong>");
    expect(html).toContain('href="https://example.com"');
  });
  it("renders current Editor.js nested lists and table blocks", () => {
    const html = convertBlocksToHtml([
      { type: "list", data: { style: "ordered", items: [{ content: "Parent", items: [{ content: "Child", items: [] }] }] } },
      { type: "table", data: { withHeadings: true, content: [["Heading"], ["Value"]] } },
    ]);
    expect(html).toContain('Parent<ol><li class="zenex-cms__list-item">Child</li></ol>');
    expect(html).toContain("<th>Heading</th>");
    expect(html).toContain("<td>Value</td>");
  });
  it("handles missing content and malformed blocks without crashing", () => {
    expect(convertBlocksToHtml(null)).toBe("");
    expect(convertBlocksToHtml([null, { type: "unknown" }])).toBe("");
  });
});
