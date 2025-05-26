
'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3,
  TableIcon, Trash2, Minus, Pilcrow,
  ArrowUpFromLine, ArrowDownToLine, ArrowRightFromLine, ArrowLeftFromLine, Merge, Split
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TiptapToolbarProps {
  editor: Editor | null;
}

const TiptapToolbar: React.FC<TiptapToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const tableControlsDisabled = !editor.can().deleteTable(); // A proxy for being inside a table

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-input bg-muted/50 rounded-t-md">
      <Button type="button" size="icon" variant={editor.isActive('bold') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} aria-label="Bold"><Bold className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('italic') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} aria-label="Italic"><Italic className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('strike') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} aria-label="Strikethrough"><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="Heading 1"><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading 2"><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Heading 3"><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet List"><List className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered List"><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant={'ghost'} onClick={() => editor.chain().focus().setHardBreak().run()} aria-label="Hard Break (Enter)"><Pilcrow className="h-4 w-4" /></Button>

      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} aria-label="Insert Table"><TableIcon className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!tableControlsDisabled} aria-label="Add Column Before"><ArrowLeftFromLine className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!tableControlsDisabled} aria-label="Add Column After"><ArrowRightFromLine className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!tableControlsDisabled} aria-label="Delete Column"><Minus className="h-4 w-4" />Col</Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!tableControlsDisabled} aria-label="Add Row Before"><ArrowUpFromLine className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!tableControlsDisabled} aria-label="Add Row After"><ArrowDownToLine className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!tableControlsDisabled} aria-label="Delete Row"><Minus className="h-4 w-4" />Row</Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().mergeCells().run()} disabled={!tableControlsDisabled} aria-label="Merge Cells"><Merge className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().splitCell().run()} disabled={!tableControlsDisabled} aria-label="Split Cell"><Split className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleHeaderCell().run()} disabled={!tableControlsDisabled} aria-label="Toggle Header Cell">H</Button>
      <Button type="button" size="icon" variant="ghost" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!tableControlsDisabled} aria-label="Delete Table"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
};

export interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
  className?: string;
  readOnly?: boolean;
}

const TiptapEditor = React.forwardRef<HTMLDivElement, TiptapEditorProps>(
  ({ content, onChange, className, readOnly = false }, forwardedRef) => {
    // console.log(`[TiptapEditor] Rendering. Initial content prop length: ${content?.length}, readOnly: ${readOnly}`);
    // console.log(`[TiptapEditor] Content snippet: "${String(content).substring(0, 100)}"`);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: content || '', // Initialize with the content prop, ensuring it's a string
      editable: !readOnly,
      immediatelyRender: false, // Key change: Defer rendering to client-side
      onUpdate: ({ editor: currentEditor }) => {
        if (currentEditor) {
          onChange(currentEditor.getHTML());
        }
      },
    });

    React.useEffect(() => {
      if (editor && typeof content === 'string') {
        const editorHTML = editor.getHTML();
        if (content !== editorHTML) {
          // console.log(`[TiptapEditor] useEffect detected content prop change. Prop: "${content.substring(0,50)}", Editor: "${editorHTML.substring(0,50)}"`);
          
          // More robust check to avoid unnecessary updates for "empty" states
          const isEditorEffectivelyEmpty = editorHTML === '<p></p>' || editorHTML === '';
          const isContentPropEffectivelyEmpty = content === '<p></p>' || content === '';

          if (!(isEditorEffectivelyEmpty && isContentPropEffectivelyEmpty) || content !== editorHTML) {
            // console.log(`[TiptapEditor] Calling editor.commands.setContent()`);
            editor.commands.setContent(content, false, { preserveWhitespace: 'full' });
          }
        }
      }
    }, [content, editor]);

    React.useEffect(() => {
      if (editor) {
        editor.setEditable(!readOnly);
      }
    }, [readOnly, editor]);

    // Cleanup editor instance
    React.useEffect(() => {
      return () => {
        if (editor && !editor.isDestroyed) {
          editor.destroy();
        }
      };
    }, [editor]);

    return (
      <div
        ref={forwardedRef}
        className={cn(
          "border rounded-md",
          readOnly && "bg-muted/50 border-transparent",
          className
        )}
      >
        {!editor ? (
          <div className="p-2 min-h-[150px] text-sm text-muted-foreground">Editor initializing...</div>
        ) : (
          <>
            {!readOnly && <TiptapToolbar editor={editor} />}
            <EditorContent editor={editor} className={cn(
                "prose prose-sm max-w-none focus:outline-none",
                readOnly ? "p-3" : "p-3 bg-background rounded-b-md min-h-[150px]",
                readOnly && "prose-headings:mt-2 prose-p:my-1"
            )} />
          </>
        )}
      </div>
    );
  }
);
TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;

