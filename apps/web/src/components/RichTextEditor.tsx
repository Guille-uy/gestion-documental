import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";

export interface RichTextEditorHandle {
  insertContent: (html: string) => void;
  setContent: (html: string) => void;
  getHTML: () => string;
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const COLORS = [
  { label: "Negro", value: "#111827" },
  { label: "Gris", value: "#6B7280" },
  { label: "Rojo", value: "#DC2626" },
  { label: "Naranja", value: "#EA580C" },
  { label: "Amarillo", value: "#CA8A04" },
  { label: "Verde", value: "#16A34A" },
  { label: "Azul", value: "#2563EB" },
  { label: "Violeta", value: "#7C3AED" },
];

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors select-none
        ${active
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-0.5 self-center flex-shrink-0" />;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  ({ value, onChange, placeholder, minHeight = 220 }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Underline,
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: value || "",
      onUpdate({ editor }) {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-full",
          "data-placeholder": placeholder || "",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      insertContent: (html: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(html).run();
      },
      setContent: (html: string) => {
        if (!editor) return;
        editor.commands.setContent(html);
      },
      getHTML: () => editor?.getHTML() ?? "",
    }));

    // Sync external value changes (e.g. when switching modules)
    useEffect(() => {
      if (!editor) return;
      const current = editor.getHTML();
      if (value !== current) {
        editor.commands.setContent(value || "");
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    if (!editor) return null;

    const addTable = () => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    };

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
          {/* Undo / Redo */}
          <ToolbarBtn title="Deshacer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarBtn>
          <ToolbarBtn title="Rehacer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarBtn>
          <Divider />

          {/* Text style */}
          <ToolbarBtn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarBtn>
          <ToolbarBtn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarBtn>
          <ToolbarBtn title="Subrayado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{ textDecoration: "underline" }}>U</span></ToolbarBtn>
          <ToolbarBtn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{ textDecoration: "line-through" }}>S</span></ToolbarBtn>
          <Divider />

          {/* Headings */}
          <ToolbarBtn title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarBtn>
          <ToolbarBtn title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
          <ToolbarBtn title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>
          <Divider />

          {/* Lists */}
          <ToolbarBtn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>☰</ToolbarBtn>
          <ToolbarBtn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>①</ToolbarBtn>
          <ToolbarBtn title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarBtn>
          <Divider />

          {/* Align */}
          <ToolbarBtn title="Izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</ToolbarBtn>
          <ToolbarBtn title="Centrar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</ToolbarBtn>
          <ToolbarBtn title="Derecha" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>➡</ToolbarBtn>
          <Divider />

          {/* Color picker */}
          <div className="relative group">
            <button
              type="button"
              title="Color de texto"
              onMouseDown={(e) => e.preventDefault()}
              className="px-2 py-1 rounded text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1"
            >
              A
              <span
                className="inline-block w-3 h-1.5 rounded-sm"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#111827" }}
              />
            </button>
            <div className="absolute top-full left-0 z-20 hidden group-hover:flex group-focus-within:flex flex-wrap gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg w-36 mt-0.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); }}
                  className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                />
              ))}
              <button
                type="button"
                title="Sin color"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
                className="w-6 h-6 rounded-full border border-dashed border-gray-400 hover:bg-gray-100 text-xs text-gray-500 flex items-center justify-center"
              >✕</button>
            </div>
          </div>

          {/* Highlight */}
          <ToolbarBtn title="Resaltar" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}>
            <span className="px-0.5 rounded" style={{ backgroundColor: "#FEF08A" }}>ab</span>
          </ToolbarBtn>
          <Divider />

          {/* Table */}
          <ToolbarBtn title="Insertar tabla" onClick={addTable}>⊞</ToolbarBtn>
          {editor.isActive("table") && (
            <>
              <ToolbarBtn title="Agregar columna" onClick={() => editor.chain().focus().addColumnAfter().run()}>+col</ToolbarBtn>
              <ToolbarBtn title="Agregar fila" onClick={() => editor.chain().focus().addRowAfter().run()}>+fila</ToolbarBtn>
              <ToolbarBtn title="Eliminar tabla" onClick={() => editor.chain().focus().deleteTable().run()}>✕tab</ToolbarBtn>
            </>
          )}
        </div>

        {/* Editor area */}
        <div
          className="cursor-text"
          style={{ minHeight: `${minHeight}px` }}
          onClick={() => editor.chain().focus().run()}
        >
          <EditorContent editor={editor} style={{ minHeight: `${minHeight}px` }} />
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

// ── Helper: convert plain text / markdown-like to insertable HTML ─────────────
export function plainToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^#{3}\s/.test(trimmed)) return `<h3>${trimmed.replace(/^#{3}\s/, "")}</h3>`;
      if (/^#{2}\s/.test(trimmed)) return `<h2>${trimmed.replace(/^#{2}\s/, "")}</h2>`;
      if (/^#{1}\s/.test(trimmed)) return `<h1>${trimmed.replace(/^#{1}\s/, "")}</h1>`;
      // Bullet list block
      if (/^- /.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .filter((l) => l.startsWith("- "))
          .map((l) => `<li><p>${l.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p></li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      // Table: simple pipe-table detection
      if (/^\|/.test(trimmed)) {
        const rows = trimmed.split("\n").filter((l) => /^\|/.test(l) && !/^\|[-:]+/.test(l));
        if (rows.length === 0) return `<p>${trimmed}</p>`;
        const [headerRow, ...bodyRows] = rows;
        const thCells = headerRow
          .split("|")
          .filter((_, i, a) => i > 0 && i < a.length - 1)
          .map((c) => `<th>${c.trim()}</th>`)
          .join("");
        const tbodyRows = bodyRows
          .map((row) => {
            const cells = row
              .split("|")
              .filter((_, i, a) => i > 0 && i < a.length - 1)
              .map((c) => `<td>${c.trim()}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
        return `<table><thead><tr>${thCells}</tr></thead><tbody>${tbodyRows}</tbody></table>`;
      }
      // Bold inline
      const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<p>${withBold.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}
