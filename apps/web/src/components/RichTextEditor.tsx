import React, { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
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

// ── Minimal SVG icon components ────────────────────────────────────────────
const IcUndo = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>;
const IcRedo = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>;
const IcBold = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M15.6 11.79C16.57 11.11 17.25 10.01 17.25 9c0-2.74-2.13-5-5-5H7v14h6.04c2.65 0 4.96-2.13 4.96-4.75 0-1.84-.92-3.41-2.4-4.46zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>;
const IcItalic = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/></svg>;
const IcUnderline = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>;
const IcStrike = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>;
const IcBulletList = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>;
const IcNumList = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>;
const IcAlignLeft = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>;
const IcAlignCenter = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>;
const IcAlignRight = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>;
const IcTable = () => <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden><path d="M20 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h15zm-7.5 5h-3v-3h3v3zm0 5h-3v-3h3v3zm5 0h-3v-3h3v3zm0 5h-3v-3h3v3zm-5 0h-3v-3h3v3zm-5-5H5v-3h2.5v3zm0 5H5v-3h2.5v3z"/></svg>;

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
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors select-none leading-none
        ${active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-1 self-center flex-shrink-0" />;
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

    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    const addTable = () => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 4, withHeaderRow: true })
        .run();
    };

    const insertParagraphBeforeTable = () => {
      const { state, view } = editor;
      const { $from } = state.selection;
      let depth = $from.depth;
      while (depth > 0) {
        if ($from.node(depth).type.name === "table") {
          const pos = $from.before(depth);
          const tr = state.tr.insert(pos, state.schema.nodes.paragraph.create());
          view.dispatch(tr);
          editor.commands.setTextSelection(pos + 1);
          return;
        }
        depth--;
      }
    };

    const insertParagraphAfterTable = () => {
      const { state, view } = editor;
      const { $from } = state.selection;
      let depth = $from.depth;
      while (depth > 0) {
        if ($from.node(depth).type.name === "table") {
          const pos = $from.after(depth);
          const tr = state.tr.insert(pos, state.schema.nodes.paragraph.create());
          view.dispatch(tr);
          editor.commands.setTextSelection(pos + 1);
          return;
        }
        depth--;
      }
    };

    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
        <style>{`
          .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          .ProseMirror table th, .ProseMirror table td { border: 1px solid #cbd5e1; padding: 6px 10px; min-width: 60px; position: relative; }
          .ProseMirror table th { background: #f8fafc; font-weight: 600; }
          .ProseMirror table .selectedCell:after { position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200,225,255,0.4); pointer-events: none; z-index: 2; }
          .ProseMirror .tableWrapper { overflow-x: auto; }
          .ProseMirror-gapcursor { display: none; pointer-events: none; position: absolute; }
          .ProseMirror-gapcursor:after { content: ""; display: block; position: absolute; top: -2px; width: 20px; border-top: 1px solid black; animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite; }
          .ProseMirror-focused .ProseMirror-gapcursor { display: block; }
          @keyframes ProseMirror-cursor-blink { to { visibility: hidden; } }
        `}</style>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-slate-200 bg-slate-50">
          {/* Undo / Redo */}
          <ToolbarBtn title="Deshacer (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><IcUndo /></ToolbarBtn>
          <ToolbarBtn title="Rehacer (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><IcRedo /></ToolbarBtn>
          <Divider />

          {/* Text style */}
          <ToolbarBtn title="Negrita (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><IcBold /></ToolbarBtn>
          <ToolbarBtn title="Cursiva (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><IcItalic /></ToolbarBtn>
          <ToolbarBtn title="Subrayado (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><IcUnderline /></ToolbarBtn>
          <ToolbarBtn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><IcStrike /></ToolbarBtn>
          <Divider />

          {/* Headings */}
          <ToolbarBtn title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarBtn>
          <ToolbarBtn title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
          <ToolbarBtn title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>
          <Divider />

          {/* Lists */}
          <ToolbarBtn title="Lista de viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><IcBulletList /></ToolbarBtn>
          <ToolbarBtn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><IcNumList /></ToolbarBtn>
          <ToolbarBtn title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarBtn>
          <Divider />

          {/* Align */}
          <ToolbarBtn title="Alinear a la izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><IcAlignLeft /></ToolbarBtn>
          <ToolbarBtn title="Centrar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><IcAlignCenter /></ToolbarBtn>
          <ToolbarBtn title="Alinear a la derecha" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><IcAlignRight /></ToolbarBtn>
          <Divider />

          {/* Color picker */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              title="Color de texto"
              onMouseDown={(e) => { e.preventDefault(); setShowColorPicker((v) => !v); }}
              className="px-2.5 py-1.5 rounded text-sm font-semibold text-slate-600 hover:bg-slate-200 flex items-center gap-1 leading-none"
            >
              <span style={{ borderBottom: `3px solid ${editor.getAttributes("textStyle").color || "#111827"}` }}>A</span>
              <svg viewBox="0 0 10 6" className="w-2 h-2 fill-current opacity-50"><path d="M0 0l5 6 5-6z"/></svg>
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 z-30 flex flex-wrap gap-1.5 p-2.5 bg-white border border-slate-200 rounded-lg shadow-xl w-40 mt-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c.value).run(); setShowColorPicker(false); }}
                    className="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <button
                  type="button"
                  title="Quitar color"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                  className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 hover:bg-slate-100 text-xs text-slate-500 flex items-center justify-center"
                >✕</button>
              </div>
            )}
          </div>

          {/* Highlight */}
          <ToolbarBtn title="Resaltar texto" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#FEF08A" }).run()}>
            <span className="px-0.5 rounded text-xs font-bold" style={{ backgroundColor: "#FEF08A", color: "#78350f" }}>ab</span>
          </ToolbarBtn>
          <Divider />

          {/* Table */}
          <ToolbarBtn title="Insertar tabla (3×4)" onClick={addTable}>
            <span className="flex items-center gap-1"><IcTable /><span className="text-xs">Tabla</span></span>
          </ToolbarBtn>
          {editor.isActive("table") && (
            <>
              <Divider />
              <ToolbarBtn title="Insertar párrafo antes de la tabla" onClick={insertParagraphBeforeTable}>
                <span className="text-xs">↑ Antes</span>
              </ToolbarBtn>
              <ToolbarBtn title="Insertar párrafo después de la tabla" onClick={insertParagraphAfterTable}>
                <span className="text-xs">↓ Después</span>
              </ToolbarBtn>
              <ToolbarBtn title="Agregar columna a la derecha" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <span className="text-xs">+Col</span>
              </ToolbarBtn>
              <ToolbarBtn title="Eliminar columna" onClick={() => editor.chain().focus().deleteColumn().run()}>
                <span className="text-xs text-red-500">−Col</span>
              </ToolbarBtn>
              <ToolbarBtn title="Agregar fila abajo" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <span className="text-xs">+Fila</span>
              </ToolbarBtn>
              <ToolbarBtn title="Eliminar fila" onClick={() => editor.chain().focus().deleteRow().run()}>
                <span className="text-xs text-red-500">−Fila</span>
              </ToolbarBtn>
              <ToolbarBtn title="Eliminar tabla" onClick={() => editor.chain().focus().deleteTable().run()}>
                <span className="text-xs text-red-600 font-semibold">✕ Tabla</span>
              </ToolbarBtn>
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
