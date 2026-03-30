"use client";

import { useState, useCallback } from "react";
import { useEmojiData } from "@/hooks/useEmojiData";
import { useSelection } from "@/hooks/useSelection";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { EmojiGrid } from "@/components/EmojiGrid";
import { SelectionBar } from "@/components/SelectionBar";
import { UploadDialog } from "@/components/UploadDialog";
import { FolderPicker, getSavedEmojiDir } from "@/components/FolderPicker";
import { Spinner } from "@/components/Spinner";

export default function Home() {
  const {
    emojis,
    groups,
    total,
    loading,
    error,
    activeGroup,
    setActiveGroup,
    searchQuery,
    setSearchQuery,
    emojiDir,
    handleDirectoryChange,
    hideUploaded,
    handleToggleHideUploaded,
    existingEmojis,
    fetchingExisting,
  } = useEmojiData();

  const {
    toggle,
    selectAll,
    deselectAll,
    clear,
    isSelected,
    count,
    filenames: selectedFilenames,
  } = useSelection();

  const [showUpload, setShowUpload] = useState(false);

  const handleSelectAllVisible = useCallback(() => {
    selectAll(emojis.map((e) => e.filename));
  }, [emojis, selectAll]);

  const handleDeselectAllVisible = useCallback(() => {
    deselectAll(emojis.map((e) => e.filename));
  }, [emojis, deselectAll]);

  return (
    <div className="h-screen flex flex-col">
      <header className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center gap-4">
        <h1 className="text-lg font-bold whitespace-nowrap">Emojinator</h1>
        <FolderPicker
          onDirectoryChange={handleDirectoryChange}
          currentDir={emojiDir || getSavedEmojiDir()}
        />
        <div className="flex-1 max-w-md">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={hideUploaded}
            onChange={(e) => handleToggleHideUploaded(e.target.checked)}
            className="rounded border-zinc-600"
          />
          Hide uploaded
          {fetchingExisting && (
            <span className="animate-pulse">...</span>
          )}
          {hideUploaded && existingEmojis && (
            <span className="text-zinc-500">
              ({existingEmojis.size.toLocaleString()})
            </span>
          )}
        </label>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400 animate-pulse text-lg">
            Loading emojis...
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <p className="text-lg mb-2">No emojis found</p>
            <p className="text-sm">
              Set the folder path above to a directory containing emoji images
              (.png, .gif, .jpg)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <Sidebar
            groups={groups}
            total={total}
            activeGroup={activeGroup}
            onSelectGroup={setActiveGroup}
            filteredCount={emojis.length}
          />
          <main className="flex-1 flex flex-col min-h-0 p-2 overflow-hidden">
            <EmojiGrid
              emojis={emojis}
              isSelected={isSelected}
              onToggle={toggle}
            />
          </main>
        </div>
      )}

      <SelectionBar
        count={count}
        onClear={clear}
        onUpload={() => setShowUpload(true)}
        onSelectAllVisible={handleSelectAllVisible}
        onDeselectAllVisible={handleDeselectAllVisible}
        visibleCount={emojis.length}
      />

      {showUpload && (
        <UploadDialog
          filenames={selectedFilenames}
          onClose={() => setShowUpload(false)}
        />
      )}

      {loading && <Spinner message="Scanning emojis..." />}
      {fetchingExisting && <Spinner message="Fetching existing emojis from Slack..." />}
    </div>
  );
}
