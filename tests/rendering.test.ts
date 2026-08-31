import { describe, expect, it } from "vitest";
import { convertBlocksToHtml } from "@/lib/editorjs-to-html";
import { markdownToEditorJS } from "@/lib/markdown-parser";

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
    expect(html).toContain('<thead><tr><th scope="col">Heading</th></tr></thead>');
    expect(html).toContain("<td>Value</td>");
  });
  it("keeps tables without headings as data rows and preserves empty cells", () => {
    for (const withHeadings of [false, undefined]) {
      const html = convertBlocksToHtml([{ type: "table", data: { withHeadings, content: [["A", "", "C"], ["", "B", ""]] } }]);
      expect(html).not.toContain("<thead>");
      expect(html).toContain('<tbody><tr><td>A</td><td></td><td>C</td></tr><tr><td></td><td>B</td><td></td></tr></tbody>');
      expect(html).toContain('class="zenex-cms__table-wrapper"');
    }
  });
  it("sanitizes table cells while preserving safe inline formatting", () => {
    const html = convertBlocksToHtml([{ type: "table", data: { withHeadings: true, content: [["<strong>Title</strong>"], ['<script>evil()</script><a href="javascript:evil()">Link</a><em>Value</em>']] } }]);
    expect(html).not.toMatch(/<script|javascript:/);
    expect(html).toContain('<th scope="col"><strong>Title</strong></th>');
    expect(html).toContain('<em>Value</em>');
  });
  it("imports Markdown headers without losing empty cells or data containing dashes", () => {
    const content = markdownToEditorJS('| Name | Detail | Status |\n| :--- | --- | ---: |\n| A | | Ready |\n| | --- text | |');
    expect(content.blocks[0].data).toEqual({ withHeadings: true, content: [["Name", "Detail", "Status"], ["A", "", "Ready"], ["", "--- text", ""]] });
    expect(convertBlocksToHtml(content)).toContain('<th scope="col">Name</th>');
  });
  it("handles missing content and malformed blocks without crashing", () => {
    expect(convertBlocksToHtml(null)).toBe("");
    expect(convertBlocksToHtml([null, { type: "unknown" }])).toBe("");
  });
});
