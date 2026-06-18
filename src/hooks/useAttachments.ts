import { useState, useRef, useCallback } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'csv', 'py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'xml', 'yaml', 'yml', 'log', 'sh', 'sql']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

export interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'text' | 'binary';
  preview?: string;
  textContent?: string;
  dataUrl?: string;
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

function classifyFile(file: File): Attachment['type'] {
  const ext = getFileExtension(file.name);
  if (IMAGE_EXTENSIONS.has(ext) || file.type.startsWith('image/')) return 'image';
  if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/')) return 'text';
  return 'binary';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function processFile(file: File): Promise<Attachment | null> {
  if (file.size > MAX_FILE_SIZE) {
    return null;
  }
  const type = classifyFile(file);
  const att: Attachment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    name: file.name,
    size: file.size,
    type,
  };
  try {
    if (type === 'image') {
      att.dataUrl = await readFileAsDataUrl(file);
    } else if (type === 'text') {
      const text = await readFileAsText(file);
      att.textContent = text.length > 50_000 ? text.slice(0, 50_000) + '\n\n...[文件过大，已截断]' : text;
    }
  } catch {
    return null;
  }
  return att;
}

function extractFilesFromDataTransfer(dt: DataTransfer): File[] {
  const files: File[] = [];

  if (dt.items && dt.items.length > 0) {
    for (const item of Array.from(dt.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          if (file.type.startsWith('image/') && (!file.name || file.name === 'image.png')) {
            const ext = file.type.split('/')[1] || 'png';
            const renamed = new File([file], `clipboard-image-${Date.now()}.${ext}`, { type: file.type });
            files.push(renamed);
          } else {
            files.push(file);
          }
        }
      }
    }
  } else if (dt.files && dt.files.length > 0) {
    for (const file of Array.from(dt.files)) {
      files.push(file);
    }
  }

  return files;
}

export function useAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setFileError(null);
    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`文件 "${file.name}" 超过 10MB 限制`);
        continue;
      }
      const att = await processFile(file);
      if (!att) {
        setFileError(`读取 "${file.name}" 失败`);
        continue;
      }
      newAttachments.push(att);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const dt = e.clipboardData;
    const hasFiles = dt.items
      ? Array.from(dt.items).some((item) => item.kind === 'file')
      : dt.files && dt.files.length > 0;

    if (!hasFiles) return;

    const textSelection = window.getSelection()?.toString();
    if (!textSelection && dt.items) {
      const hasOnlyText = Array.from(dt.items).every(
        (item) => item.kind === 'string' || item.type === 'text/plain'
      );
      if (hasOnlyText) return;
    }

    e.preventDefault();

    const files = extractFilesFromDataTransfer(dt);
    if (files.length > 0) {
      addFiles(files);
      const textData = dt.getData('text/plain');
      if (textData && !textSelection) {
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        const newValue = current.slice(0, start) + textData + current.slice(end);
        textarea.value = newValue;
        const newPos = start + textData.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, [addFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = extractFilesFromDataTransfer(e.dataTransfer);
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  const composeMessage = useCallback((inputText: string) => {
    const imageAttachments = attachments
      .filter((a) => a.type === 'image' && a.dataUrl)
      .map((a) => ({ name: a.name, dataUrl: a.dataUrl! }));

    const textAttachments = attachments.filter((a) => a.type === 'text' && a.textContent);
    const binaryAttachments = attachments.filter((a) => a.type === 'binary');

    let composedMessage = inputText;
    if (textAttachments.length > 0 || binaryAttachments.length > 0) {
      const fileList: string[] = [];
      for (const att of textAttachments) {
        fileList.push(`### 📄 ${att.name} (${formatSize(att.size)})\n\`\`\`\n${att.textContent}\n\`\`\``);
      }
      for (const att of binaryAttachments) {
        fileList.push(`- 📎 ${att.name} (${formatSize(att.size)}) — 二进制文件已附带（仅文件名参考）`);
      }
      const fileBlock = fileList.join('\n\n');
      composedMessage = composedMessage ? `${composedMessage}\n\n---\n\n${fileBlock}` : fileBlock;
    }

    return {
      text: composedMessage,
      imageAttachments: imageAttachments.length > 0 ? imageAttachments : undefined,
    };
  }, [attachments]);

  const dropHandlers = {
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return {
    attachments,
    fileError,
    isDragOver,
    fileInputRef,
    addFiles,
    removeAttachment,
    clearAttachments,
    handlePaste,
    dropHandlers,
    composeMessage,
    openFilePicker: () => fileInputRef.current?.click(),
  };
}
