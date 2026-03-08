import { RefObject, useCallback, useEffect, useState } from 'react';

let draggingCount = 0;

const useDragging = ({
  labelRef,
  inputRef,
  multiple,
  handleChanges,
  onDrop,
}: {
  labelRef: RefObject<HTMLLabelElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  multiple?: boolean;
  handleChanges: (files: File | FileList) => boolean;
  onDrop?: (file: File | FileList) => void;
}): boolean => {
  const [dragging, setDragging] = useState(false);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-file-uploader-no-open="true"]')) {
        return;
      }

      inputRef.current?.click();
    },
    [inputRef],
  );

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    draggingCount++;

    if (!e.dataTransfer?.items.length) return;

    setDragging(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    draggingCount--;

    if (draggingCount > 0) return;

    setDragging(false);
  }, []);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      draggingCount = 0;

      const eventFiles = e.dataTransfer?.files;

      if (!eventFiles || !eventFiles.length) return;

      const files = multiple ? eventFiles : eventFiles[0];
      const success = handleChanges(files);

      if (onDrop && success) onDrop(files);
    },
    [handleChanges, multiple, onDrop],
  );
  useEffect(() => {
    const label = labelRef.current;
    if (!label) return;

    label.addEventListener('click', handleClick);
    label.addEventListener('dragenter', handleDragIn);
    label.addEventListener('dragleave', handleDragOut);
    label.addEventListener('dragover', handleDrag);
    label.addEventListener('drop', handleDrop);
    return () => {
      label.removeEventListener('click', handleClick);
      label.removeEventListener('dragenter', handleDragIn);
      label.removeEventListener('dragleave', handleDragOut);
      label.removeEventListener('dragover', handleDrag);
      label.removeEventListener('drop', handleDrop);
    };
  }, [handleClick, handleDragIn, handleDragOut, handleDrag, handleDrop, labelRef]);

  return dragging;
};

export default useDragging;
