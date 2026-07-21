export function setupExamAntiCheat(isExamActive: boolean, onTabUnfocus?: () => void) {
  if (!isExamActive) return () => {};

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+V
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const handleCopyPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handleVisibilityChange = () => {
    if (document.hidden && onTabUnfocus) {
      onTabUnfocus();
    }
  };

  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('copy', handleCopyPaste);
  window.addEventListener('paste', handleCopyPaste);
  window.addEventListener('cut', handleCopyPaste);
  window.addEventListener('dragstart', handleDragStart);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('copy', handleCopyPaste);
    window.removeEventListener('paste', handleCopyPaste);
    window.removeEventListener('cut', handleCopyPaste);
    window.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
