import { useEffect, useState, useRef, useContext, useLayoutEffect, useCallback } from 'react'
import moment from 'moment';
import {
  FaFolderOpen,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";
import {
  IoMdArrowBack
} from "react-icons/io";
import {
  MdExplore
} from 'react-icons/md';
import { LuUpload } from "react-icons/lu";
import Cookies from 'js-cookie';
import convertToBytes from '../../utils/convertToBytes';
import ExplorerRightclickMenu from '../ExplorerRightclickMenu/ExplorerRightclickMenu';
import ExplorerContext from '../../utils/ExplorerContext';
import { type DirectoryItem } from '../../types/DirectoryItem';
import { type ExplorerContextType } from '../../types/ExplorerContextType';
import LoadingComponent from '../LoadingComponent/LoadingComponent';
import { RiAddLargeFill } from "react-icons/ri";
import { DirectoryItemIcon } from '../../utils/DirectoryItemIcon';

const FileExplorer: React.FC = () => {
  const [draggedItem, setDraggedItem] = useState<DirectoryItem | null>();
  const [draggedItems, setDraggedItems] = useState<DirectoryItem[]>([]);
  const [dropTarget, setDropTarget] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>(() => {
    const saved = localStorage.getItem("explorer_sort_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse sort config", e);
      }
    }
    return { key: 'date', direction: 'desc' };
  });
  const childElements = useRef<Array<HTMLDivElement>>([]);
  const previousDirRef = useRef<HTMLButtonElement | null>(null);
  const [selectedChildEl, setSelectedChildEl] = useState<number | null>(null);
  const directoryRef = useRef<HTMLDivElement | null>(null)
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const {
    path, directory, setDirectory, directoryInfo, moveItem, itemInfo, setItemInfo, readDir, getParent, setShowCreateItemMenu, downloading, permissions, unzipping, waitingResponse, contextMenu, deleteItem, setContextMenu, scrollIndex, isDirLoading: isLoading, setShowFileViewer, setShowUploadMenu, selectedItems, setSelectedItems, clearSelection, isBulkActionLoading, bulkMove, bulkDelete
  } = useContext<ExplorerContextType>(ExplorerContext)

  const updateSort = useCallback((key: string, direction: string) => {
    let sortedItems = [...directory ?? []];

    switch (key) {
      case 'name':
        sortedItems.sort((a, b) =>
          direction === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        );
        break;
      case 'date':
        sortedItems.sort((a, b) =>
          direction === 'asc'
            ? new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime()
            : new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime()
        );
        break;
      case 'size':
        sortedItems.sort((a, b) =>
          direction === 'asc'
            ? convertToBytes(a.size) - convertToBytes(b.size)
            : convertToBytes(b.size) - convertToBytes(a.size)
        );
        break;
    }

    setDirectory(sortedItems.map((file, index) => ({ ...file, id: index })));
  }, [directory])

  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    updateSort(key, direction)

    const newConfig = { key, direction };
    setSortConfig(newConfig);
    localStorage.setItem("explorer_sort_config", JSON.stringify(newConfig));
  }, [sortConfig, updateSort]);

  const getSortIcon = useCallback((key: string) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc'
      ? <FaSortUp className="text-blue-400" />
      : <FaSortDown className="text-blue-400" />;
  }, [sortConfig]);

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement, MouseEvent>, element: DirectoryItem | null) {
    event.preventDefault()
    if (!element) {
      setItemInfo(directoryInfo)
      const decreaseIndex: number = directoryInfo?.isDirectory ? 50 : 150;
      setContextMenu({ show: true, x: event.pageX, y: (window.innerHeight - event.pageY) < 180 ? event.pageY - decreaseIndex : event.pageY })
      return
    }
    if (!waitingResponse && !downloading && !unzipping) {
      setItemInfo(element);
      const decreaseIndex: number = element?.isDirectory ? 50 : 150;
      setContextMenu({ show: true, x: event.pageX, y: (window.innerHeight - event.pageY) < 180 ? event.pageY - decreaseIndex : event.pageY })
    }
  }

  useLayoutEffect(() => {
    if (directoryRef.current && directory.length > 0) {
      directoryRef.current.scrollTop = scrollIndex.current;
    }
  }, [directory])

  useLayoutEffect(() => {
    if (!isLoading) {
      updateSort(sortConfig.key, sortConfig.direction)
    }
  }, [isLoading])

  const toggleSelection = (item: DirectoryItem, event: React.MouseEvent) => {
    if (isBulkActionLoading) return;

    if (event.ctrlKey || event.metaKey) {
      setSelectedItems((prev: DirectoryItem[]) => {
        const isSelected = prev.some(i => i.id === item.id);
        if (isSelected) {
          return prev.filter(i => i.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    }
    else if (event.shiftKey && lastClickedIndex !== null && directory.length > 0) {
      const currentIndex = directory.findIndex(i => i.id === item.id);
      const start = Math.min(lastClickedIndex, currentIndex);
      const end = Math.max(lastClickedIndex, currentIndex);
      const rangeItems = directory.slice(start, end + 1);
      setSelectedItems(rangeItems);
    }
    else {
      setSelectedItems([item]);
      setLastClickedIndex(directory.findIndex(i => i.id === item.id));
    }
  };

  const handleDeleteKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Delete' || itemInfo?.id == -1 || !permissions?.delete) {
      return
    }

    if (selectedItems.length > 2) {
      bulkDelete();
    } else {
      deleteItem(itemInfo)
    }
  }, [itemInfo, permissions, selectedItems]);

  const handleFileDoubleClick = useCallback((element: DirectoryItem) => {
    if (element.isDirectory) {
      readDir(false, element.path)
    } else {
      const previewExtensions = [
        'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
        'mp4', 'webm', 'ogg', 'mov', 'avi',
        'mp3', 'wav', 'flac', 'm4a', 'opus'
      ];

      const extension = element.name.split('.').pop()?.toLowerCase();

      if (extension && previewExtensions.includes(extension)) {
        setShowFileViewer(true);
      } else {
        window.open(`/editor/${encodeURIComponent(element.path)}`, '_blank', 'rel=noopener noreferrer');
      }
    }
  }, [readDir, setShowFileViewer])

  useEffect(() => {
    window.addEventListener('keydown', handleDeleteKeyDown);

    return () => {
      window.removeEventListener('keydown', handleDeleteKeyDown);
    };
  }, [handleDeleteKeyDown]);

  useEffect(() => {
    if (dropTarget) {
      moveItem(draggedItem?.path, dropTarget)
      setDraggedItem(null);
      setDropTarget("");
    }
  }, [dropTarget])

  useEffect(() => {
    if (itemInfo?.id || itemInfo?.id === 0) {
      setSelectedChildEl(itemInfo.id);
    } else {
      setSelectedChildEl(null)
    }
  }, [itemInfo])

  useEffect(() => {
    childElements.current = []
    setSelectedChildEl(null);
  }, [directory])

  function addToChildElements(e: HTMLDivElement | undefined | null) {
    if (!e) return;
    if (e && !childElements.current.includes(e)) {
      childElements.current.push(e);
    }
  }

  const getDisplaySize = (element: DirectoryItem) => {
    if (element.isDirectory && Cookies.get("mode") !== "Quality mode") {
      return "";
    }
    if (element.size === "N/A" && (Cookies.get("mode") === "Quality mode" || !element.isDirectory)) {
      return "0 Bytes";
    }
    return element.size;
  };

  const handleDragStart = (e: React.DragEvent, element: DirectoryItem) => {
    if (selectedItems.length > 1 && selectedItems.some(i => i.id === element.id)) {
      setDraggedItems([...selectedItems]);
      e.dataTransfer.setData('text/plain', JSON.stringify(selectedItems.map(i => i.path)));
      e.dataTransfer.effectAllowed = 'move';
    } else if (!(selectedItems.length > 1)) {
      setDraggedItem(element);
      setDraggedItems([element]);
      e.dataTransfer.setData('text/plain', element.path);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetElement: DirectoryItem) => {
    e.preventDefault();
    
    if (childElements.current[targetElement.id]?.classList.contains("border-emerald-400")) {
      childElements.current[targetElement.id]?.classList.remove("border-emerald-400")
      childElements.current[targetElement.id]?.classList.add("border-gray-600")
    }

    if (draggedItems.length > 1 && targetElement.isDirectory) {
      bulkMove(targetElement.path);
      setDraggedItems([]);
      setDraggedItem(null);
    }
    else if (draggedItems.length === 1 && draggedItems[0]?.path === targetElement.path) {
      setDraggedItems([]);
      setDraggedItem(null);
      return
    }
    else if (targetElement.isDirectory && draggedItem) {
      setDropTarget(targetElement.path);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, element: DirectoryItem) => {
    e.preventDefault();
    if (e.relatedTarget && childElements.current[element.id]?.contains(e.relatedTarget as Node)) {
      return;
    }
    if (element.isDirectory) {
      childElements.current[element.id]?.classList.remove("border-gray-600")
      childElements.current[element.id]?.classList.add("border-emerald-400")
    }
  };

  const handleDragLeave = (e: React.DragEvent, element: DirectoryItem) => {
    e.preventDefault();
    if (e.relatedTarget && childElements.current[element.id]?.contains(e.relatedTarget as Node)) {
      return;
    }
    if (childElements.current[element.id]?.classList.contains("border-emerald-400")) {
      childElements.current[element.id]?.classList.remove("border-emerald-400")
      childElements.current[element.id]?.classList.add("border-gray-600")
    }
  };

  return (
    <div className='flex flex-col bg-gray-800 gap-1 overflow-auto rounded-xl shadow-2xl w-full md:w-3/5 mx-auto max-w-6xl min-h-[500px] max-h-[500px] 2xl:min-h-[700px] h-[700px] 2xl:max-h-[800px] p-4 md:p-8 lg:p-2 2xl:p-8'>
      {/* Header Section */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500 rounded-lg">
            <MdExplore size={24} className="text-white" />
          </div>
          <div>
            <h1 className='text-xl md:text-2xl font-bold text-white'>File Explorer</h1>
            <p className='text-gray-400 text-sm md:text-base'>Browse and manage your files</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className='flex gap-2'>
          {isLoading ? <LoadingComponent /> : null}

          {(directory && path != "./") && (
            <button
              className='flex items-center gap-2 bg-gray-700 hover:bg-gray-600 hover:border-gray-600 text-white p-2 md:p-3 rounded-lg transition-colors border-2 border-gray-700'
              ref={previousDirRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (previousDirRef.current?.classList.contains("border-emerald-400")) {
                  previousDirRef.current?.classList.remove("border-emerald-400")
                  previousDirRef.current?.classList.add("border-gray-600")
                }
                if (draggedItems.length > 1) {
                  bulkMove(getParent(path));
                  setDraggedItems([]);
                  setDraggedItem(null);
                } else if (draggedItem?.isDirectory) {
                  let parentOfDir = draggedItem.parentPath;
                  parentOfDir = getParent(parentOfDir.slice(0, -1));
                  moveItem(draggedItem.path, parentOfDir)
                } else if (draggedItem) {
                  moveItem(draggedItem?.path, getParent(getParent(draggedItem?.path)))
                }
              }}
              onDragEnter={(e) => {
                if (e.relatedTarget && previousDirRef.current?.contains(e.relatedTarget as Node)) {
                  return;
                }
                previousDirRef.current?.classList.remove("border-gray-600")
                previousDirRef.current?.classList.add("border-emerald-400")
              }}
              onDragLeave={(e) => {
                if (e.relatedTarget && previousDirRef.current?.contains(e.relatedTarget as Node)) {
                  return;
                }
                previousDirRef.current?.classList.remove("border-emerald-400")
                previousDirRef.current?.classList.add("border-gray-600")
              }}
              onClick={() => readDir(true)}
              title="Go back"
            >
              <IoMdArrowBack size={18} />
            </button>
          )}

          {directoryInfo && (
            <button
              className='flex items-center gap-2 p-2 md:p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors'
              onClick={() => setItemInfo(directoryInfo)}
              title="Current folder info"
            >
              <FaFolderOpen size={18} />
              <span className="max-w-[120px] md:max-w-[200px] truncate">{directoryInfo.name}</span>
            </button>
          )}

          {permissions?.upload_files ? (
            <button
              className='flex items-center gap-2 p-2 md:p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors'
              onClick={() => setShowUploadMenu(true)}
              title="Upload files"
            >
              <LuUpload size={18} />
            </button>
          ) : (
            <button
              className='flex items-center gap-2 opacity-60 cursor-not-allowed p-2 md:p-3 bg-gray-700 text-white rounded-lg transition-colors'
              title="No permission to upload files"
              disabled
            >
              <LuUpload size={18} />
            </button>
          )}

          {permissions?.create ? (
            <button
              className='flex items-center gap-2 p-2 md:p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors'
              onClick={() => setShowCreateItemMenu(true)}
              title="Create a new item"
            >
              <RiAddLargeFill size={18} />
            </button>
          ) : (
            <button
              className='flex items-center gap-2 opacity-60 cursor-not-allowed p-2 md:p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors'
              onClick={() => setShowCreateItemMenu(true)}
              title="No permission to create a new item"
              disabled
            >
              <RiAddLargeFill size={18} />
            </button>
          )}
        </div>
      </div>

      {selectedItems.length > 1 && (
        <div className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-1.5 text-sm">
          <span className="text-gray-300">
            {selectedItems.length} items selected
          </span>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-white transition-colors text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      <hr className="border-gray-500" />

      {/* Table Header */}
      <div className='hidden md:grid grid-cols-12 gap-4 px-4 text-sm py-1 bg-gray-700 rounded-lg'>
        <div className="col-span-1"></div>
        <button
          className="col-span-5 flex items-center gap-2 text-gray-300 font-thin hover:text-white transition-colors"
          onClick={() => handleSort('name')}
        >
          Name {getSortIcon('name')}
        </button>
        <button
          className="col-span-3 flex items-center gap-2 text-gray-300 font-thin hover:text-white transition-colors"
          onClick={() => handleSort('date')}
        >
          Modified {getSortIcon('date')}
        </button>
        <button
          className="col-span-3 flex items-center gap-2 text-gray-300 font-thin hover:text-white transition-colors justify-end"
          onClick={() => handleSort('size')}
        >
          Size {getSortIcon('size')}
        </button>
      </div>

      {/* Mobile Sort Header */}
      <div className='md:hidden flex justify-between items-center p-2 bg-gray-700 rounded-lg'>
        <button
          className="flex items-center gap-1 text-gray-300 font-semibold hover:text-white transition-colors text-sm"
          onClick={() => handleSort('name')}
        >
          Name {getSortIcon('name')}
        </button>
        <span className='text-gray-400 text-sm'>{directory.length} items</span>
      </div>

      {/* Files List */}
      <div
        ref={directoryRef}
        className='flex flex-col gap-1 overflow-y-auto p-1'
        onContextMenu={(e) => handleContextMenu(e, null)}
        onScroll={(e) => {
          if (contextMenu.show) {
            setContextMenu({ show: false, x: contextMenu.x, y: contextMenu.y })
          }
          if (directory.length > 0) {
            scrollIndex.current = e.currentTarget.scrollTop;
          }
        }}
      >
        {contextMenu.show && (
          <ExplorerRightclickMenu
            x={contextMenu.x}
            y={contextMenu.y}
          />
        )}

        {directory.length > 0 ? (
          directory.map((element) => {
            const isSelected = selectedItems.some(i => i.id === element.id);

            return (
              <div
                ref={addToChildElements}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center p-2 md:p-0.5 bg-gray-700 rounded-lg border-2 transition-all cursor-pointer group
                  ${selectedChildEl === element.id
                    ? 'border-gray-200'
                    : isSelected && selectedItems.length > 1
                      ? 'border-gray-200'
                      : 'border-gray-600 hover:border-gray-400 hover:bg-gray-550'
                  }`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, element)}
                onDrop={(e) => handleDrop(e, element)}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, element)}
                onDragLeave={(e) => handleDragLeave(e, element)}
                key={element.id}
                onClick={(event) => {
                  setContextMenu({ show: false, x: 0, y: 0 })

                  if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    toggleSelection(element, event);
                    setSelectedChildEl(element.id);
                  }
                  else if (selectedItems.length > 1) {
                    toggleSelection(element, event);
                    setSelectedChildEl(element.id);
                  }
                  else {
                    setSelectedItems([element]);
                    setLastClickedIndex(directory.findIndex(i => i.id === element.id));
                    setSelectedChildEl(element.id);
                    if (!waitingResponse && !downloading && !unzipping) {
                      setItemInfo(element);
                    }
                  }
                }}
                onContextMenu={(event) => {
                  event.stopPropagation();
                  if (!selectedItems.some(i => i.id === element.id)) {
                    setSelectedItems([element]);
                  }
                  handleContextMenu(event, element)
                }}
                onDoubleClick={() => {
                  if (selectedItems.length === 1 && selectedItems[0]?.id === element.id) {
                    handleFileDoubleClick(element);
                  }
                }}
              >
                {/* Mobile Layout */}
                <div className="flex items-center gap-3 md:hidden w-full">
                  <div className="flex-shrink-0">
                    <DirectoryItemIcon itemInfo={element} logoSize={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium group-hover:text-cyan-200 transition-colors truncate text-sm">
                      {element.name}
                    </div>
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                      <span>{moment(element.dateModified).format("MMM DD")}</span>
                      <span>{getDisplaySize(element)}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:contents">
                  <div className="col-span-1 flex justify-center">
                    <DirectoryItemIcon itemInfo={element} logoSize={22} />
                  </div>
                  <div className="col-span-5">
                    <div className="text-white font-medium group-hover:text-cyan-200 transition-colors truncate">
                      {element.name}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-gray-300 text-sm">
                      {moment(element.dateModified).format("MMM DD, YYYY")}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {moment(element.dateModified).format("HH:mm")}
                    </div>
                  </div>
                  <div className="col-span-3 text-right">
                    <div className="text-gray-300 text-sm font-medium">
                      {getDisplaySize(element)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FaFolderOpen size={48} className="mb-4 opacity-50 md:size-16" />
            <h2 className="text-lg md:text-xl font-semibold mb-2">Empty Folder</h2>
            <p className="text-center text-sm md:text-base">This folder doesn't contain any files or folders</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileExplorer