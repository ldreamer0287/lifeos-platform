/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  File as FileIcon,
  Folder,
  FolderPlus,
  FolderOpen,
  CheckCircle,
  MoreVertical,
  Download,
  Trash2,
  Copy,
  Clipboard,
  Heart,
  Clock,
  ArrowUpDown,
  ChevronRight,
  Edit2,
  ExternalLink,
  Share2,
  FileSpreadsheet,
  Presentation,
  FileText,
  CheckSquare,
  BookOpen,
  PenTool,
  Palette,
  Search,
  ArrowLeft,
  Save,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Sparkles,
  Plus,
  X,
  Scissors,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FilePlus,
  Info,
  FolderClosed,
  Check,
  Smartphone,
  MousePointer,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { FileItem } from '../types';

interface FilesViewProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  theme: 'dark' | 'light';
  onViewInWorkspace?: (fileId: string) => void;
}

export default function FilesView({ files, setFiles, theme, onViewInWorkspace }: FilesViewProps) {
  // Navigation & Folder Structure
  const [currentPath, setCurrentPath] = useState<string[]>(['Root']);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<string>('All');
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Connection to Local system Storage (FileSystemAccess API)
  const [localDirectoryHandle, setLocalDirectoryHandle] = useState<any>(null);
  const [isLocalConnected, setIsLocalConnected] = useState(false);

  // Clipboard operations Buffer
  const [clipboard, setClipboard] = useState<{
    items: FileItem[];
    action: 'copy' | 'cut';
  } | null>(null);

  // Active opening file state
  const [openedFile, setOpenedFile] = useState<FileItem | null>(null);
  const [openWithMode, setOpenWithMode] = useState<'default' | 'text' | null>(null);
  const [showPropertiesId, setShowPropertiesId] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<FileItem | null>(null);
  const [shareToastText, setShareToastText] = useState<string | null>(null);

  // New item triggers
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    fileId?: string;
    isFolder?: boolean;
    folderName?: string;
  } | null>(null);

  // Text editor states
  const [editorContent, setEditorContent] = useState('');
  const [editorName, setEditorName] = useState('');
  const [editorHistory, setEditorHistory] = useState<string[]>([]);
  const [editorHistoryIndex, setEditorHistoryIndex] = useState(-1);
  const [editorSaveStatus, setEditorSaveStatus] = useState<'saved' | 'saving' | 'modified'>('saved');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(true);

  // Canvas Whiteboard drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFolder = currentPath[currentPath.length - 1];

  // Auto-Save effect for the Text Editor
  useEffect(() => {
    if (openedFile && (openedFile.type === 'document' || openedFile.type === 'text' || openedFile.type === 'code')) {
      const timer = setTimeout(() => {
        if (editorSaveStatus === 'modified') {
          handleSaveEditorContent(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [editorContent, editorSaveStatus]);

  // Handle right click outside of list
  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenu(null);
      setShowNewMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Keyboard shortcut operations listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when inside inputs or textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.ctrlKey && e.key === 'c') {
        if (selectedIds.length > 0) {
          const itemsToCopy = files.filter(f => selectedIds.includes(f.id));
          setClipboard({ items: itemsToCopy, action: 'copy' });
          showToast(`Copied ${selectedIds.length} item(s) to clipboard`);
        }
      } else if (e.ctrlKey && e.key === 'x') {
        if (selectedIds.length > 0) {
          const itemsToCut = files.filter(f => selectedIds.includes(f.id));
          setClipboard({ items: itemsToCut, action: 'cut' });
          showToast(`Cut ${selectedIds.length} item(s) to clipboard`);
        }
      } else if (e.ctrlKey && e.key === 'v') {
        if (clipboard) {
          handlePaste();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected item(s)?`)) {
            handleDeleteSelected();
          }
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setContextMenu(null);
        setShowPropertiesId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clipboard, files]);

  // Utility toast messenger
  const showToast = (msg: string) => {
    setShareToastText(msg);
    setTimeout(() => setShareToastText(null), 3000);
  };

  // Connect local storage folder via File System Access API
  const handleConnectLocalDisk = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert("Your web browser doesn't support the File System Access API. Please use Google Chrome, Microsoft Edge, or a modern chromium-based browser to mount your actual local computer drive.");
        return;
      }

      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setLocalDirectoryHandle(handle);
      setIsLocalConnected(true);

      const loadedFiles: FileItem[] = [];
      
      // Recursively parse local files
      async function scanDirectory(dirHandle: any, pathName: string) {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const ext = entry.name.split('.').pop()?.toLowerCase() || '';
            let fileType: any = 'other';
            if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(ext)) fileType = 'image';
            else if (['zip', 'rar', 'tar'].includes(ext)) fileType = 'archive';
            else if (['js', 'ts', 'tsx', 'json', 'py', 'css', 'html'].includes(ext)) fileType = 'code';
            else if (ext === 'pdf') fileType = 'pdf';
            else if (['mp4', 'mov'].includes(ext)) fileType = 'video';
            else if (['mp3', 'wav'].includes(ext)) fileType = 'audio';
            else if (['xls', 'xlsx'].includes(ext)) fileType = 'spreadsheet';
            else if (['ppt', 'pptx'].includes(ext)) fileType = 'presentation';
            else if (['doc', 'docx'].includes(ext)) fileType = 'document';
            else if (['txt', 'md', 'rtf', 'csv'].includes(ext)) fileType = 'text';

            let content = '';
            if (['text', 'code', 'document'].includes(fileType)) {
              try {
                content = await file.text();
              } catch (e) {
                console.log("Could not read file text", e);
              }
            }

            loadedFiles.push({
              id: `local_${Math.random().toString(36).substr(2, 9)}`,
              name: entry.name,
              type: fileType,
              size: file.size,
              sizeBytes: file.size,
              url: URL.createObjectURL(file),
              folder: pathName,
              createdAt: new Date(file.lastModified).toISOString().split('T')[0],
              content: content || undefined,
              handle: entry,
              localPath: `${pathName}/${entry.name}`
            });
          } else if (entry.kind === 'directory') {
            await scanDirectory(entry, entry.name);
          }
        }
      }

      await scanDirectory(handle, 'Root');

      if (loadedFiles.length > 0) {
        // Merge with existing
        setFiles(prev => {
          const nonLocal = prev.filter(f => !f.localPath);
          return [...loadedFiles, ...nonLocal];
        });
        showToast(`Successfully connected and loaded ${loadedFiles.length} files from local storage.`);
      } else {
        showToast("Connected folder is empty.");
      }

    } catch (e) {
      console.error(e);
      showToast("Access permission denied or failed to mount local directory.");
    }
  };

  const handleDisconnectLocalDisk = () => {
    setLocalDirectoryHandle(null);
    setIsLocalConnected(false);
    setFiles(prev => prev.filter(f => !f.localPath));
    showToast("Mounted local drive has been disconnected safely.");
  };

  // Storage and metrics calculation
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes !== undefined ? f.sizeBytes : f.size), 0);
  const totalSizeMb = totalSizeBytes / (1024 * 1024);
  const storageCapGb = 10;
  const storageCapMb = storageCapGb * 1024;
  const usedPercent = Math.min(100, (totalSizeMb / storageCapMb) * 100);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Recursive folders list
  const allFolders = Array.from(new Set(files.map(f => f.folder).filter(Boolean)));
  if (!allFolders.includes('Root')) allFolders.unshift('Root');

  // New folder creation helper
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folderName = newFolderName.trim();
    
    // Add a virtual placeholder file so the folder exists in our catalog
    const placeholderItem: FileItem = {
      id: `folder_${Date.now()}`,
      name: '.placeholder',
      type: 'other',
      size: 0,
      sizeBytes: 0,
      url: '',
      folder: folderName,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setFiles([placeholderItem, ...files]);
    setNewFolderName('');
    setShowNewFolderInput(false);
    showToast(`Created folder "${folderName}" successfully.`);
  };

  // Paste handler
  const handlePaste = () => {
    if (!clipboard) return;
    const newPasteFiles = clipboard.items.map((item, idx) => {
      const id = `file_${Date.now()}_paste_${idx}`;
      return {
        ...item,
        id,
        folder: activeFolder,
        createdAt: new Date().toISOString().split('T')[0]
      };
    });

    if (clipboard.action === 'cut') {
      const cutIds = clipboard.items.map(i => i.id);
      setFiles(prev => [...newPasteFiles, ...prev.filter(f => !cutIds.includes(f.id))]);
      setClipboard(null);
    } else {
      setFiles(prev => [...newPasteFiles, ...prev]);
    }

    setSelectedIds([]);
    showToast(`Pasted ${newPasteFiles.length} item(s) to ${activeFolder}`);
  };

  // Delete selected items
  const handleDeleteSelected = () => {
    setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
    setSelectedIds([]);
    showToast("Selected items deleted successfully.");
  };

  // Toggle favorite property
  const toggleFavorite = (fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f));
    showToast("Updated item favorite status.");
  };

  // Navigation handlers
  const handleFolderDoubleClick = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
    setSelectedIds([]);
  };

  const handleBreadcrumbClick = (idx: number) => {
    setCurrentPath(currentPath.slice(0, idx + 1));
    setSelectedIds([]);
  };

  // Upload trigger
  const handleUploadFiles = async (fileList: FileList) => {
    const newItems: FileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const originalFile = fileList[i];
      const ext = originalFile.name.split('.').pop()?.toLowerCase() || '';

      let type: FileItem['type'] = 'other';
      if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif', 'heic'].includes(ext)) {
        type = 'image';
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        type = 'archive';
      } else if (['js', 'ts', 'tsx', 'json', 'py', 'css', 'html', 'java', 'cpp', 'c', 'php', 'go', 'rs', 'sql', 'dart'].includes(ext)) {
        type = 'code';
      } else if (ext === 'pdf') {
        type = 'pdf';
      } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        type = 'video';
      } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
        type = 'audio';
      } else if (['xls', 'xlsx'].includes(ext)) {
        type = 'spreadsheet';
      } else if (['ppt', 'pptx'].includes(ext)) {
        type = 'presentation';
      } else if (['doc', 'docx'].includes(ext)) {
        type = 'document';
      } else if (['txt', 'log', 'xml', 'yaml', 'yml', 'csv'].includes(ext)) {
        type = 'text';
      }

      let content = '';
      if (['text', 'code', 'document'].includes(type)) {
        try {
          content = await originalFile.text();
        } catch (err) {
          console.error('Error reading file as text:', err);
        }
      }

      newItems.push({
        id: `file_${Date.now()}_${i}`,
        name: originalFile.name,
        sizeBytes: originalFile.size,
        size: originalFile.size,
        type,
        url: URL.createObjectURL(originalFile),
        folder: activeFolder,
        createdAt: new Date().toISOString().split('T')[0],
        content: content || undefined
      });
    }

    setFiles([...newItems, ...files]);
    showToast(`Uploaded ${newItems.length} file(s) into ${activeFolder}`);
  };

  // Open file handler (Supported editors vs properties)
  const handleOpenFile = (file: FileItem) => {
    const isEditable = ['document', 'text', 'code'].includes(file.type) || 
                       file.name.endsWith('.md') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.csv') ||
                       file.type === 'spreadsheet';

    if (file.type === 'spreadsheet') {
      // Open inline CSV table editor
      setOpenedFile(file);
      setEditorContent(file.content || 'name,category,status\nProduct A,SaaS,Active\nProduct B,Workspace,Pending');
      setEditorName(file.name);
      setOpenWithMode(null);
      return;
    }

    if (isEditable) {
      setOpenedFile(file);
      setEditorContent(file.content || '');
      setEditorName(file.name);
      setEditorHistory([file.content || '']);
      setEditorHistoryIndex(0);
      setEditorSaveStatus('saved');
      setOpenWithMode(null);
    } else if (file.type === 'other' && file.name === 'whiteboard_session.json') {
      // Open whiteboard editor
      setOpenedFile(file);
      setOpenWithMode(null);
    } else {
      // Unsupported file, show detailed properties inspector card
      setOpenedFile(file);
      setOpenWithMode(null);
    }
  };

  // Create a new blank supported document
  const handleCreateNewFile = (type: 'doc' | 'txt' | 'md' | 'csv' | 'wb') => {
    let name = '';
    let ext = '';
    let fileType: FileItem['type'] = 'text';
    let defaultContent = '';

    if (type === 'doc') {
      name = 'New Document';
      ext = 'docx';
      fileType = 'document';
      defaultContent = '<h1>New LifeOS Document</h1><p>Start writing your rich prose here...</p>';
    } else if (type === 'txt') {
      name = 'Plain Text File';
      ext = 'txt';
      fileType = 'text';
      defaultContent = 'Start writing plain text here...';
    } else if (type === 'md') {
      name = 'Readme Documentation';
      ext = 'md';
      fileType = 'text';
      defaultContent = '# New Markdown Document\n\n- Beautiful list item\n- Standard rich document prose.\n\nType some rich styled markdown here...';
    } else if (type === 'csv') {
      name = 'Academic Finance Ledger';
      ext = 'csv';
      fileType = 'spreadsheet';
      defaultContent = 'date,description,amount,type\n2026-07-20,Monthly Course Fee,250.00,expense\n2026-07-20,Coaching Income,1200.00,income';
    } else if (type === 'wb') {
      name = 'Creative Brainstorm Board';
      ext = 'json';
      fileType = 'other';
      name = 'whiteboard_session';
      defaultContent = JSON.stringify({ brushColor: '#6366f1', lines: [] });
    }

    // Ensure unique name
    let finalName = `${name}.${ext}`;
    let counter = 1;
    while (files.some(f => f.name === finalName && f.folder === activeFolder)) {
      finalName = `${name} (${counter++}).${ext}`;
    }

    const newItem: FileItem = {
      id: `file_creation_${Date.now()}`,
      name: finalName,
      type: fileType,
      size: defaultContent.length,
      sizeBytes: defaultContent.length,
      url: '',
      folder: activeFolder,
      createdAt: new Date().toISOString().split('T')[0],
      content: defaultContent
    };

    setFiles([newItem, ...files]);
    setShowNewMenu(false);
    handleOpenFile(newItem);
    showToast(`Created dynamic file "${finalName}" successfully.`);
  };

  // Editor Actions
  const handleSaveEditorContent = async (isAuto = false) => {
    if (!openedFile) return;

    let updatedContent = editorContent;
    if (openedFile.name === 'whiteboard_session.json' && canvasRef.current) {
      // Save canvas state
      updatedContent = canvasRef.current.toDataURL();
    }

    // If localConnected file and handle available, write straight to computer!
    if (openedFile.handle) {
      try {
        const writable = await openedFile.handle.createWritable();
        await writable.write(updatedContent);
        await writable.close();
        showToast("Synchronized changes directly with your local machine drive!");
      } catch (e) {
        console.error("Local file writing failed:", e);
      }
    }

    setFiles(prev => prev.map(f => {
      if (f.id === openedFile.id) {
        return {
          ...f,
          name: editorName,
          content: updatedContent,
          size: updatedContent.length,
          sizeBytes: updatedContent.length,
          lastModifiedAt: new Date().toISOString().split('T')[0]
        };
      }
      return f;
    }));

    setEditorSaveStatus('saved');
    if (!isAuto) showToast("File saved successfully.");
  };

  const handleEditorChange = (val: string) => {
    setEditorContent(val);
    setEditorSaveStatus('modified');

    // Add to history for undo-redo
    const nextHist = editorHistory.slice(0, editorHistoryIndex + 1);
    setEditorHistory([...nextHist, val]);
    setEditorHistoryIndex(nextHist.length);
  };

  const handleUndo = () => {
    if (editorHistoryIndex > 0) {
      const idx = editorHistoryIndex - 1;
      setEditorHistoryIndex(idx);
      setEditorContent(editorHistory[idx]);
    }
  };

  const handleRedo = () => {
    if (editorHistoryIndex < editorHistory.length - 1) {
      const idx = editorHistoryIndex + 1;
      setEditorHistoryIndex(idx);
      setEditorContent(editorHistory[idx]);
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    const text = file.content || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    showToast(`Downloading file "${file.name}"...`);
  };

  // Canvas drawing operations
  useEffect(() => {
    if (openedFile && openedFile.name === 'whiteboard_session.json' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.fillStyle = theme === 'dark' ? '#18181b' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load drawing contents if exists
        if (openedFile.content && openedFile.content.startsWith('data:image')) {
          const img = new Image();
          img.src = openedFile.content;
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
        }
      }
    }
  }, [openedFile]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? (theme === 'dark' ? '#18181b' : '#ffffff') : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setEditorSaveStatus('modified');
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = theme === 'dark' ? '#18181b' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setEditorSaveStatus('modified');
    showToast("Whiteboard canvas cleared.");
  };

  // Sorting and Filtering algorithm
  const folderItems = Array.from(
    new Set(
      files
        .filter(f => f.folder.startsWith(activeFolder === 'Root' ? '' : activeFolder))
        .map(f => {
          const relativePath = f.folder.replace(activeFolder === 'Root' ? '' : activeFolder, '');
          const parts = relativePath.split('/').filter(Boolean);
          return parts[0];
        })
        .filter(Boolean)
    )
  ).map(folderName => ({
    name: folderName,
    isFolder: true,
    id: `folder_ref_${folderName}`
  }));

  const filteredAndSortedFiles = files
    .filter(f => {
      if (f.name === '.placeholder') return false; // Hide metadata files
      const inCurrentFolder = f.folder === activeFolder;
      if (!inCurrentFolder) return false;

      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || f.type === filterType;
      const matchesFavorite = !showFavoritesOnly || f.isFavorite;

      return matchesSearch && matchesType && matchesFavorite;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        comparison = a.createdAt.localeCompare(b.createdAt);
      } else if (sortBy === 'size') {
        comparison = (a.sizeBytes || a.size) - (b.sizeBytes || b.size);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSortToggle = (type: 'name' | 'date' | 'size') => {
    if (sortBy === type) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  // Move files logic
  const handleMoveFile = (targetFolder: string) => {
    if (!showMoveModal) return;
    setFiles(prev => prev.map(f => f.id === showMoveModal.id ? { ...f, folder: targetFolder } : f));
    setShowMoveModal(null);
    showToast("Moved file successfully.");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 text-left relative select-none">
      
      {/* Toast notifier */}
      {shareToastText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 text-indigo-400 font-mono text-xs font-semibold rounded-xl px-5 py-3 shadow-2xl flex items-center gap-2">
          <Sparkles size={13} className="text-amber-400 animate-spin" />
          <span>{shareToastText}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: Explorer Tree Navigation Panel */}
      <div className="w-64 border border-zinc-800/40 rounded-3xl bg-zinc-950/20 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-6">
          
          {/* Section: Local storage mounting */}
          <div className="space-y-2">
            <h5 className="text-[9px] uppercase font-mono font-bold text-zinc-500 tracking-wider">Drive Mount</h5>
            
            {isLocalConnected ? (
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Computer Disk Connected</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Syncing directly with local system file picker workspace directory.
                </p>
                <button
                  onClick={handleDisconnectLocalDisk}
                  className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/10 text-[10px] font-mono font-bold uppercase transition-all"
                >
                  Disconnect Drive
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectLocalDisk}
                className="w-full py-3 bg-zinc-900/60 hover:bg-zinc-800/40 text-zinc-300 rounded-2xl border border-zinc-800 hover:border-zinc-700 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <FilePlus size={14} className="text-indigo-400" />
                <span>Connect Local Drive</span>
              </button>
            )}
          </div>

          {/* Section: Quick Links & Filters */}
          <div className="space-y-1.5">
            <h5 className="text-[9px] uppercase font-mono font-bold text-zinc-500 tracking-wider">Categories</h5>
            
            <button
              onClick={() => {
                setShowFavoritesOnly(false);
                setFilterType('All');
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                !showFavoritesOnly && filterType === 'All'
                  ? 'bg-indigo-600/10 border border-indigo-500/15 text-indigo-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/25'
              }`}
            >
              <FileIcon size={13} />
              <span>All Workspace Files</span>
            </button>

            <button
              onClick={() => {
                setShowFavoritesOnly(true);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                showFavoritesOnly
                  ? 'bg-indigo-600/10 border border-indigo-500/15 text-indigo-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/25'
              }`}
            >
              <Heart size={13} className="text-rose-500 fill-rose-500/20" />
              <span>Favorites</span>
            </button>

            <div className="pt-2 border-t border-zinc-800/40 space-y-1">
              {[
                { type: 'document', label: 'Documents', color: 'text-indigo-400' },
                { type: 'spreadsheet', label: 'Spreadsheets', color: 'text-emerald-400' },
                { type: 'text', label: 'Prose Notes', color: 'text-amber-400' },
                { type: 'image', label: 'Illustrations', color: 'text-sky-400' },
                { type: 'code', label: 'Developer Code', color: 'text-purple-400' }
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => {
                    setShowFavoritesOnly(false);
                    setFilterType(item.type);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                    filterType === item.type
                      ? 'bg-indigo-600/10 border border-indigo-500/15 text-indigo-300 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/15'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Virtual Directory Tree */}
          <div className="space-y-1.5">
            <h5 className="text-[9px] uppercase font-mono font-bold text-zinc-500 tracking-wider">Directory Catalog</h5>
            <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {allFolders.map(folder => (
                <button
                  key={folder}
                  onClick={() => {
                    if (folder === 'Root') {
                      setCurrentPath(['Root']);
                    } else {
                      setCurrentPath(['Root', folder]);
                    }
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-all ${
                    activeFolder === folder
                      ? 'bg-indigo-600/10 text-indigo-300 font-bold border border-indigo-500/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/15'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder size={12} className="text-zinc-500 shrink-0" />
                    <span className="truncate">{folder}</span>
                  </div>
                  <ChevronRight size={10} className="text-zinc-650" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Storage Quota Info widget */}
        <div className="p-3 bg-white/[0.01] border border-zinc-800/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase text-zinc-500">
            <span>Storage Space</span>
            <span>{usedPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${usedPercent}%` }}></div>
          </div>
          <div className="text-[9px] text-zinc-500 font-mono">
            {totalSizeMb.toFixed(1)} MB of {storageCapGb} GB Used
          </div>
        </div>
      </div>

      {/* MAIN PANEL CONTENT: Catalog Grid or Editors */}
      <div className="flex-1 border border-zinc-800/40 rounded-3xl overflow-hidden bg-zinc-950/10 flex flex-col justify-between">
        
        {openedFile ? (
          // DYNAMIC INLINE PROSE & CODE EDITOR / OR FILE INSPECTOR CARD
          <div className="flex-1 flex flex-col min-h-0 bg-[#0c0d12]/40">
            
            {/* Editor Toolbar Header */}
            <div className="p-4 border-b border-zinc-850/50 bg-[#090a0f] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => {
                    setOpenedFile(null);
                    setOpenWithMode(null);
                  }}
                  className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all border border-zinc-800/40 flex items-center justify-center shrink-0"
                  title="Back to File Drive"
                >
                  <ArrowLeft size={14} />
                </button>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editorName}
                      onChange={(e) => {
                        setEditorName(e.target.value);
                        setEditorSaveStatus('modified');
                      }}
                      className="bg-transparent text-sm font-bold text-zinc-100 border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 outline-none pr-2 font-sans truncate py-0.5"
                    />
                    {editorSaveStatus === 'saving' && (
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase animate-pulse">Saving...</span>
                    )}
                    {editorSaveStatus === 'saved' && (
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Saved</span>
                    )}
                    {editorSaveStatus === 'modified' && (
                      <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">Modified</span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Path: {openedFile.localPath ? `SystemDisk/${openedFile.localPath}` : `Drive/${openedFile.folder}/${openedFile.name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveEditorContent()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Save size={13} />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(openedFile)}
                  className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all border border-zinc-800/40 flex items-center justify-center"
                  title="Download / Export"
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={() => {
                    setOpenedFile(null);
                    setOpenWithMode(null);
                  }}
                  className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 transition-all border border-transparent"
                  title="Close Workspace file"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Editor Workspace Pane */}
            <div className="flex-1 flex min-h-0">
              
              {openedFile.name === 'whiteboard_session.json' ? (
                // DRAWING CANVAS WHITEBOARD WORKSPACE
                <div className="flex-1 flex flex-col bg-zinc-950/40">
                  <div className="p-3 border-b border-zinc-850/40 bg-[#090a0f] flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      
                      {/* Color Picker */}
                      <div className="flex items-center gap-1.5">
                        {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#ffffff', '#000000'].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setBrushColor(color);
                              setIsEraser(false);
                            }}
                            className={`h-5 w-5 rounded-full border transition-all ${
                              brushColor === color && !isEraser ? 'scale-125 border-indigo-500' : 'border-zinc-800'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      <div className="h-4 w-[1px] bg-zinc-800" />

                      {/* Brush Controls */}
                      <div className="flex items-center gap-2">
                        <Palette size={13} className="text-zinc-500" />
                        <input
                          type="range"
                          min="2"
                          max="20"
                          value={brushSize}
                          onChange={(e) => setBrushSize(parseInt(e.target.value))}
                          className="w-20 accent-indigo-500"
                        />
                        <span className="text-[10px] font-mono text-zinc-400 w-6 text-center">{brushSize}px</span>
                      </div>

                      <div className="h-4 w-[1px] bg-zinc-800" />

                      {/* Eraser button */}
                      <button
                        onClick={() => setIsEraser(!isEraser)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isEraser ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <PenTool size={12} />
                        <span>Eraser</span>
                      </button>
                    </div>

                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/10 text-xs font-semibold transition-all"
                    >
                      Clear Whiteboard
                    </button>
                  </div>

                  <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={500}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="rounded-2xl shadow-2xl border border-zinc-800 bg-[#18181b] cursor-crosshair max-w-full"
                    />
                  </div>
                </div>

              ) : ['document', 'text', 'code'].includes(openedFile.type) || openWithMode === 'text' ? (
                // MARKDOWN & PLAIN TEXT WORKSPACE EDITOR
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                  
                  {/* Left textarea editor */}
                  <div className="flex-1 flex flex-col min-h-0 border-r border-zinc-850/50">
                    
                    {/* Inline toolbar controls */}
                    <div className="p-2 border-b border-zinc-850/30 bg-[#090a0f] flex items-center gap-1.5 shrink-0 overflow-x-auto">
                      <button
                        onClick={handleUndo}
                        disabled={editorHistoryIndex <= 0}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-all"
                        title="Undo (Ctrl+Z)"
                      >
                        <Undo2 size={13} />
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={editorHistoryIndex >= editorHistory.length - 1}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-all"
                        title="Redo (Ctrl+Y)"
                      >
                        <Redo2 size={13} />
                      </button>
                      
                      <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                      <button
                        onClick={() => handleEditorChange(editorContent + '**BoldText**')}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all font-bold text-xs"
                        title="Bold Text"
                      >
                        <Bold size={13} />
                      </button>
                      <button
                        onClick={() => handleEditorChange(editorContent + '*ItalicText*')}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all italic text-xs"
                        title="Italic Text"
                      >
                        <Italic size={13} />
                      </button>
                      <button
                        onClick={() => handleEditorChange(editorContent + '\n# Heading 1\n')}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"
                        title="Heading 1"
                      >
                        <Heading1 size={13} />
                      </button>
                      <button
                        onClick={() => handleEditorChange(editorContent + '\n## Heading 2\n')}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"
                        title="Heading 2"
                      >
                        <Heading2 size={13} />
                      </button>
                      <button
                        onClick={() => handleEditorChange(editorContent + '\n- Bullet Item\n')}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"
                        title="Bullet List"
                      >
                        <List size={13} />
                      </button>

                      {openedFile.name.endsWith('.md') && (
                        <>
                          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
                          <button
                            onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                              showMarkdownPreview ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' : 'text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            <BookOpen size={11} />
                            <span>Preview</span>
                          </button>
                        </>
                      )}
                    </div>

                    <textarea
                      value={editorContent}
                      onChange={(e) => handleEditorChange(e.target.value)}
                      className="flex-1 w-full p-4 bg-transparent text-zinc-200 outline-none resize-none text-xs sm:text-sm font-mono leading-relaxed overflow-y-auto custom-scrollbar"
                      placeholder="Start drafting dynamic prose or script code here..."
                    />

                    {/* Editor Footer Status Info bar */}
                    <div className="p-2.5 border-t border-zinc-850/40 bg-[#090a0f] flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
                      <span>Prose Editor (Standard UTF-8)</span>
                      <span>
                        Characters: {editorContent.length} • Words: {editorContent.split(/\s+/).filter(Boolean).length}
                      </span>
                    </div>
                  </div>

                  {/* Right markdown preview pane */}
                  {openedFile.name.endsWith('.md') && showMarkdownPreview && (
                    <div className="flex-1 bg-zinc-950/20 p-6 overflow-y-auto custom-scrollbar prose prose-invert max-w-none text-left">
                      <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300">
                        <div className="p-3 bg-zinc-900/50 border border-zinc-850 rounded-xl mb-4 font-mono text-[10px] uppercase font-bold text-zinc-500">
                          Active Markdown Render Mode
                        </div>
                        {/* Inline custom simple parser to render dynamic titles and lists */}
                        {editorContent.split('\n').map((line, idx) => {
                          if (line.startsWith('# ')) {
                            return <h1 key={idx} className="text-xl sm:text-2xl font-black text-zinc-50 border-b border-zinc-800 pb-2 mt-4">{line.replace('# ', '')}</h1>;
                          } else if (line.startsWith('## ')) {
                            return <h2 key={idx} className="text-lg font-bold text-zinc-100 mt-3">{line.replace('## ', '')}</h2>;
                          } else if (line.startsWith('- ')) {
                            return <li key={idx} className="list-disc pl-2 ml-4 mt-1">{line.replace('- ', '')}</li>;
                          } else if (line.trim() === '') {
                            return <div key={idx} className="h-2" />;
                          } else {
                            return <p key={idx} className="leading-relaxed">{line}</p>;
                          }
                        })}
                      </div>
                    </div>
                  )}

                  {/* Inline CSV Sheet ledger Grid layout */}
                  {openedFile.type === 'spreadsheet' && (
                    <div className="flex-1 bg-[#090a0f]/60 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                      <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#0c0d12]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono">
                              <th className="p-3 border-r border-zinc-800">Index</th>
                              {editorContent.split('\n')[0]?.split(',').map((header, idx) => (
                                <th key={idx} className="p-3 border-r border-zinc-800 capitalize">{header}</th>
                              )) || <th className="p-3">Data columns</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {editorContent.split('\n').slice(1).filter(Boolean).map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-zinc-900/50">
                                <td className="p-3 border-r border-zinc-800 text-zinc-500 font-mono text-[10px]">{rowIdx + 1}</td>
                                {row.split(',').map((cell, cellIdx) => (
                                  <td key={cellIdx} className="p-3 border-r border-zinc-800 text-zinc-300 font-medium">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-4">
                        * Dynamic interactive sheet parser: editable via Plain text pane on the left, updates table immediately.
                      </div>
                    </div>
                  )}
                </div>

              ) : (
                // UNSUPPORTED NATIVE FILE VIEWER & PROPERTIES CARD
                <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950/40">
                  <div className="max-w-md w-full bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative text-center space-y-6">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                      {openedFile.type === 'pdf' && <FileText size={40} className="text-rose-400" />}
                      {openedFile.type === 'image' && <FileImage size={40} className="text-emerald-400" />}
                      {openedFile.type === 'video' && <FileVideo size={40} className="text-sky-400" />}
                      {openedFile.type === 'audio' && <FileAudio size={40} className="text-pink-400" />}
                      {openedFile.type === 'archive' && <FolderClosed size={40} className="text-amber-400" />}
                      {openedFile.type === 'spreadsheet' && <FileSpreadsheet size={40} className="text-teal-400" />}
                      {openedFile.type === 'presentation' && <Presentation size={40} className="text-orange-400" />}
                      {openedFile.type === 'other' && <FileIcon size={40} className="text-indigo-400" />}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-zinc-100 truncate">{openedFile.name}</h3>
                      <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                        NATIVE EXTERNAL {openedFile.type.toUpperCase()} DOCUMENT
                      </p>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/40 space-y-2.5 text-xs font-mono text-left text-zinc-400">
                      <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                        <span className="text-zinc-600">Allocation Type:</span>
                        <span className="text-zinc-300 font-bold capitalize">{openedFile.type}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                        <span className="text-zinc-600">File Capacity:</span>
                        <span className="text-zinc-300">{formatFileSize(openedFile.sizeBytes || openedFile.size)}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-850 pb-1.5">
                        <span className="text-zinc-600">Sync Folder:</span>
                        <span className="text-zinc-300 truncate max-w-[200px]">{openedFile.folder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Registered Date:</span>
                        <span className="text-zinc-300">{openedFile.createdAt}</span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          showToast(`Launching "${openedFile.name}" with default computer application...`);
                          if (openedFile.url) {
                            window.open(openedFile.url, '_blank');
                          }
                        }}
                        className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={13} />
                        <span>Open Native</span>
                      </button>

                      <button
                        onClick={() => setOpenWithMode('text')}
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/50"
                      >
                        <Edit2 size={13} />
                        <span>Open As Text</span>
                      </button>

                      <button
                        onClick={() => handleDownloadFile(openedFile)}
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/50"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => {
                          const urlStr = `${window.location.origin}/lifeos/drive/${openedFile.id}`;
                          navigator.clipboard.writeText(urlStr);
                          showToast("Copied dynamic secure share link to clipboard.");
                        }}
                        className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/50"
                      >
                        <Share2 size={13} />
                        <span>Share link</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-zinc-500 leading-normal font-sans pt-2 border-t border-zinc-850">
                      LifeOS defaults loading of unsupported extensions to native system apps to preserve original file fidelity.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : (

          // GRID/LIST EXPLORER & CONTROLS INTERFACE
          <div className="flex-1 flex flex-col min-h-0 justify-between">
            
            {/* Catalog Action Toolbar Bar */}
            <div className="p-4 border-b border-zinc-850/40 bg-zinc-950/20 space-y-4 shrink-0">
              
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                {/* Left side breadcrumbs & Mount stats */}
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  {currentPath.map((seg, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-zinc-600">/</span>}
                      <button
                        onClick={() => handleBreadcrumbClick(idx)}
                        className={`font-bold transition-all text-xs sm:text-sm hover:text-indigo-400 ${
                          idx === currentPath.length - 1 ? 'text-zinc-100' : 'text-zinc-500'
                        }`}
                      >
                        {seg}
                      </button>
                    </React.Fragment>
                  ))}
                  
                  {isLocalConnected && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-black border border-emerald-500/15 uppercase tracking-widest ml-2">
                      Local Mount active
                    </span>
                  )}
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2.5">
                  
                  {/* Search container */}
                  <div className="relative max-w-xs flex-1 lg:w-48">
                    <Search size={13} className="absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filter files..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Dynamic New Menu dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNewMenu(!showNewMenu)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>New Document</span>
                    </button>

                    {showNewMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 shadow-2xl z-30 space-y-1 text-xs">
                        <div className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest px-2.5 pb-1 border-b border-zinc-800">
                          Documents
                        </div>
                        <button
                          onClick={() => handleCreateNewFile('doc')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                        >
                          <FileText size={12} className="text-indigo-400" />
                          <span>LifeOS Document</span>
                        </button>
                        <button
                          onClick={() => handleCreateNewFile('txt')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                        >
                          <FileIcon size={12} className="text-zinc-400" />
                          <span>Plain Text file</span>
                        </button>
                        <button
                          onClick={() => handleCreateNewFile('md')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                        >
                          <FileCode size={12} className="text-amber-400" />
                          <span>Markdown note</span>
                        </button>
                        <button
                          onClick={() => handleCreateNewFile('csv')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                        >
                          <FileSpreadsheet size={12} className="text-emerald-400" />
                          <span>Finance Ledger CSV</span>
                        </button>

                        <div className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest px-2.5 pt-2 pb-1 border-b border-zinc-800">
                          Creative Media
                        </div>
                        <button
                          onClick={() => handleCreateNewFile('wb')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                        >
                          <PenTool size={12} className="text-purple-400" />
                          <span>Brainstorm Whiteboard</span>
                        </button>

                        <div className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest px-2.5 pt-2 pb-1 border-b border-zinc-800">
                          Folders
                        </div>
                        <button
                          onClick={() => {
                            setShowNewMenu(false);
                            setShowNewFolderInput(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                        >
                          <FolderPlus size={12} className="text-sky-400" />
                          <span>Create Folder</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Folder Creation Input row */}
              {showNewFolderInput && (
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <FolderPlus size={16} className="text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Enter folder identifier name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-zinc-100 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') setShowNewFolderInput(false);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewFolderInput(false)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Multi-selection paste and copy clipboard menu overlay */}
              {selectedIds.length > 0 && (
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-2xl flex items-center justify-between gap-4 animate-slide-up">
                  <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
                    <CheckCircle size={14} className="text-indigo-400" />
                    <span>Selected {selectedIds.length} item(s)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const items = files.filter(f => selectedIds.includes(f.id));
                        setClipboard({ items, action: 'copy' });
                        showToast(`Copied ${selectedIds.length} items to clipboard`);
                      }}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-indigo-400 transition-all flex items-center justify-center"
                      title="Copy Selection (Ctrl+C)"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => {
                        const items = files.filter(f => selectedIds.includes(f.id));
                        setClipboard({ items, action: 'cut' });
                        showToast(`Cut ${selectedIds.length} items to clipboard`);
                      }}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-indigo-400 transition-all flex items-center justify-center"
                      title="Cut Selection (Ctrl+X)"
                    >
                      <Scissors size={13} />
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400 transition-all flex items-center justify-center"
                      title="Delete Selection (Delete)"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-xl text-xs font-semibold border border-zinc-800"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Catalog Grid Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                
                {/* Back directory button (If inside folders) */}
                {currentPath.length > 1 && (
                  <div
                    onDoubleClick={() => handleBreadcrumbClick(currentPath.length - 2)}
                    className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/10 hover:bg-zinc-900/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group text-center aspect-square"
                  >
                    <FolderClosed size={36} className="text-zinc-600 group-hover:scale-110 transition-all" />
                    <span className="text-xs font-semibold text-zinc-500">.. (Parent Directory)</span>
                  </div>
                )}

                {/* Render Directories first */}
                {folderItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onDoubleClick={() => handleFolderDoubleClick(item.name)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          isFolder: true,
                          folderName: item.name
                        });
                      }}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group aspect-square text-center relative ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-300'
                          : 'bg-zinc-900/10 border-zinc-850 hover:bg-zinc-850/40 text-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIds(prev =>
                              prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all accent-indigo-500"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              isFolder: true,
                              folderName: item.name
                            });
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-800 text-zinc-400"
                        >
                          <MoreVertical size={13} />
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center gap-2.5">
                        <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-indigo-400">
                          <Folder size={30} className="fill-indigo-500/10" />
                        </div>
                        <span className="text-xs font-bold font-sans truncate w-full px-2">{item.name}</span>
                      </div>

                      <div className="text-[9px] font-mono text-zinc-600 shrink-0">
                        FOLDER DRIVE
                      </div>
                    </div>
                  );
                })}

                {/* Render filtered files */}
                {filteredAndSortedFiles.length > 0 ? (
                  filteredAndSortedFiles.map(file => {
                    const isSelected = selectedIds.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        onDoubleClick={() => handleOpenFile(file)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            fileId: file.id
                          });
                        }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group aspect-square text-center relative ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-300 shadow-xl'
                            : 'bg-zinc-900/10 border-zinc-850 hover:bg-zinc-850/40 text-zinc-300'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIds(prev =>
                                prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
                              );
                            }}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all accent-indigo-500"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(file.id);
                              }}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-800 text-zinc-500"
                            >
                              <Heart size={12} className={file.isFavorite ? 'text-rose-500 fill-rose-500' : ''} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  fileId: file.id
                                });
                              }}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-800 text-zinc-400"
                            >
                              <MoreVertical size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center gap-2.5">
                          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800/40 text-zinc-400">
                            {file.type === 'image' && <FileImage size={24} className="text-emerald-400" />}
                            {file.type === 'pdf' && <FileText size={24} className="text-rose-400" />}
                            {file.type === 'code' && <FileCode size={24} className="text-purple-400" />}
                            {file.type === 'spreadsheet' && <FileSpreadsheet size={24} className="text-teal-400" />}
                            {file.type === 'presentation' && <Presentation size={24} className="text-orange-400" />}
                            {file.type === 'document' && <FileText size={24} className="text-indigo-400" />}
                            {file.type === 'text' && <FileText size={24} className="text-amber-400" />}
                            {file.type === 'archive' && <FolderClosed size={24} className="text-amber-400" />}
                            {file.type === 'video' && <FileVideo size={24} className="text-sky-400" />}
                            {file.type === 'audio' && <FileAudio size={24} className="text-pink-400" />}
                            {file.type === 'other' && <FileIcon size={24} className="text-zinc-400" />}
                          </div>
                          <span className="text-xs font-bold font-sans truncate w-full px-2" title={file.name}>
                            {file.name}
                          </span>
                        </div>

                        <div className="text-[9px] font-mono text-zinc-500 flex justify-between items-center w-full shrink-0 border-t border-zinc-850/30 pt-1.5 mt-1.5">
                          <span>{formatFileSize(file.sizeBytes || file.size)}</span>
                          <span className="uppercase text-[8px] tracking-wider text-indigo-400">{file.type}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  folderItems.length === 0 && (
                    <div className="col-span-full py-24 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-3">
                      <FolderOpen size={28} className="stroke-1 text-zinc-700 animate-pulse" />
                      <div>
                        <p className="font-bold text-zinc-400 text-sm">Directory is completely empty</p>
                        <p className="text-xs text-zinc-600 mt-1 font-mono">Select 'New Document' or drop local file inputs to allocate storage drives.</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Drag and drop upload banner footer zone */}
            <div
              onDragEnter={(e) => { e.preventDefault(); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleUploadFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-t border-zinc-850/40 bg-[#090a0f]/60 flex items-center justify-between gap-4 shrink-0 cursor-pointer hover:bg-indigo-500/[0.02] transition-all flex-wrap"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFiles(e.target.files);
                  }
                }}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">
                  <Download size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-300">Fast Drag-and-Drop Loader</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Drag files anywhere onto this workspace to register storage allocation.</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                System: Local Storage Allocation • Port 3000
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RENDER DYNAMIC CUSTOM GLASSMORPHIC CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed bg-zinc-900/90 border border-zinc-800 text-zinc-300 rounded-2xl p-2 shadow-2xl z-50 w-44 text-xs font-sans divide-y divide-zinc-800"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isFolder ? (
            <div className="p-1 space-y-1">
              <button
                onClick={() => {
                  handleFolderDoubleClick(contextMenu.folderName || '');
                  setContextMenu(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
              >
                <FolderOpen size={12} />
                <span>Open Folder</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete folder "${contextMenu.folderName}" and all contents?`)) {
                    setFiles(prev => prev.filter(f => f.folder !== contextMenu.folderName));
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-rose-400 flex items-center gap-2"
              >
                <Trash2 size={12} />
                <span>Delete Folder</span>
              </button>
            </div>
          ) : (
            <>
              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) handleOpenFile(file);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <FileText size={12} />
                  <span>Open File</span>
                </button>
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) {
                      setOpenedFile(file);
                      setOpenWithMode('text');
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Edit2 size={12} />
                  <span>Open With Text</span>
                </button>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) {
                      setClipboard({ items: [file], action: 'copy' });
                      showToast(`Copied "${file.name}" to clipboard`);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) {
                      setShowMoveModal(file);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <FolderPlus size={12} />
                  <span>Move File</span>
                </button>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) {
                      toggleFavorite(file.id);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Heart size={12} />
                  <span>Favorite</span>
                </button>
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) {
                      setShowPropertiesId(file.id);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center gap-2"
                >
                  <Info size={12} />
                  <span>Properties</span>
                </button>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) {
                      if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                        setFiles(prev => prev.filter(f => f.id !== file.id));
                        showToast(`Deleted file "${file.name}"`);
                      }
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-rose-400 flex items-center gap-2"
                >
                  <Trash2 size={12} />
                  <span>Delete File</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* MOVE FILE DIALOG MODAL */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-sm">Move File Directory</h3>
            <p className="text-xs text-zinc-500">
              Select destination folder in the LifeOS drive path for: <strong className="text-zinc-300">{showMoveModal.name}</strong>
            </p>

            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {allFolders.map(folder => (
                <button
                  key={folder}
                  onClick={() => handleMoveFile(folder)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-zinc-800 hover:text-zinc-100 transition-all flex items-center gap-2"
                >
                  <Folder size={12} className="text-zinc-500" />
                  <span>{folder}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMoveModal(null)}
              className="w-full py-2.5 bg-zinc-800 text-zinc-400 rounded-2xl text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DETAILED TECHNICAL PROPERTIES DIALOG MODAL */}
      {showPropertiesId && (
        (() => {
          const file = files.find(f => f.id === showPropertiesId);
          if (!file) return null;
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-3xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <Info size={14} className="text-indigo-400" />
                    <span>Resource Properties</span>
                  </h3>
                  <button onClick={() => setShowPropertiesId(null)} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-zinc-500">Name:</span>
                    <span className="text-zinc-300 font-sans truncate max-w-[180px]">{file.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-zinc-500">Identifier ID:</span>
                    <span className="text-zinc-300">{file.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-zinc-500">Type Category:</span>
                    <span className="text-zinc-300 capitalize">{file.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-zinc-500">Storage Size:</span>
                    <span className="text-zinc-300">{formatFileSize(file.sizeBytes || file.size)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 pb-1">
                    <span className="text-zinc-500">Active Location:</span>
                    <span className="text-zinc-300 font-sans">{file.folder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Created At:</span>
                    <span className="text-zinc-300">{file.createdAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPropertiesId(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all"
                >
                  Confirm Okay
                </button>
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
}
