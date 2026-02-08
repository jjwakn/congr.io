import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import {
  CSSProperties,
  ChangeEventHandler,
  MouseEventHandler,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { acceptedExt, checkType, getFileSizeMB } from '../../../utils/file';
import { darkGray, lightGray } from '../../../utils/theme';
import DrawTypes from './DrawTypes';
import ImageAdd from './ImageAdd';
import { UploaderWrapper } from './UploadWrapper';
import useDragging from './useDragging';

const FileUploader = ({
  name,
  hoverTitle,
  types,
  handleChange,
  children,
  maxSize,
  minSize,
  fileOrFiles,
  onSizeError,
  onTypeError,
  onSelect,
  onDrop,
  label,
  multiple,
  required,
  onDraggingStateChange,
  dropMessageStyle,
  showMenu,
  onDelete,
  previewImage,
  previewAlt,
}: {
  name?: string;
  hoverTitle?: ReactNode;
  types?: Array<string>;
  children?: ReactNode;
  maxSize?: number;
  minSize?: number;
  fileOrFiles?: FileList | File | null;
  label?: ReactNode;
  multiple?: boolean;
  required?: boolean;
  onSizeError?: (err: string) => void;
  onTypeError?: (err: string) => void;
  onDrop?: (file: File | FileList) => void;
  onSelect?: (file: File | FileList) => void;
  handleChange?: (file: File | FileList) => void;
  onDraggingStateChange?: (dragging: boolean) => void;
  dropMessageStyle?: CSSProperties;
  showMenu?: boolean;
  onDelete?: () => void;
  previewImage?: string;
  previewAlt?: string;
}) => {
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localFile, setLocalFile] = useState<FileList | File | null>(null);
  const [error, setError] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const file = fileOrFiles ?? localFile;
  const uploaded = Boolean(file || previewImage);

  const { t } = useTranslation();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuMouseDown: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteFile = () => {
    setLocalFile(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onDelete) onDelete();
    handleMenuClose();
  };

  const handleReplaceClick = () => {
    if (inputRef?.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
    handleMenuClose();
  };

  const validateFile = (file: File) => {
    if (types && !checkType({ file, types })) {
      setError(true);
      if (onTypeError) onTypeError(t('components.fileUploader.onTypeError'));
      return false;
    }

    if (maxSize && getFileSizeMB(file.size) > maxSize) {
      setError(true);
      if (onSizeError)
        onSizeError(t('components.fileUploader.onSizeTooBigError'));
      return false;
    }

    if (minSize && getFileSizeMB(file.size) < minSize) {
      setError(true);
      if (onSizeError)
        onSizeError(t('components.fileUploader.onSizeTooSmallError'));
      return false;
    }
    return true;
  };

  const handleChanges = (files: File | FileList): boolean => {
    let checkError = false;
    if (files) {
      if (files instanceof File) {
        checkError = !validateFile(files);
      } else {
        for (const element of files) {
          const file = element;
          checkError = !validateFile(file) || checkError;
        }
      }
      if (checkError) return false;
      if (handleChange) handleChange(files);
      setLocalFile(files);
      setError(false);
      return true;
    }
    return false;
  };

  const blockEvent: MouseEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick: MouseEventHandler<HTMLInputElement> = (e) => {
    e.stopPropagation();

    if (inputRef?.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const allFiles = e.target.files;
    if (!allFiles) return;

    const files = multiple ? allFiles : allFiles[0];
    const success = handleChanges(files);
    if (onSelect && success) onSelect(files);
  };

  const dragging = useDragging({
    labelRef,
    inputRef,
    multiple,
    handleChanges,
    onDrop,
  });

  useEffect(() => {
    onDraggingStateChange?.(dragging);
  }, [dragging, onDraggingStateChange]);

  useEffect(() => {
    if (!fileOrFiles && inputRef.current) inputRef.current.value = '';
  }, [fileOrFiles]);

  const hasCustomZone = Boolean(previewImage || children);
  const showFloatingMenu = Boolean(showMenu && uploaded && hasCustomZone);

  return (
    <UploaderWrapper
      overRide={hasCustomZone}
      ref={labelRef}
      htmlFor={name}
      onClick={blockEvent}
    >
      <input
        onClick={handleClick}
        onChange={handleInputChange}
        accept={acceptedExt(types)}
        ref={inputRef}
        type="file"
        name={name}
        multiple={multiple}
        required={required}
      />
      {!hasCustomZone && showMenu && uploaded && (
        <>
          <IconButton
            id="file-uploader-menu-button"
            aria-controls={anchorEl ? 'file-uploader-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
            data-file-uploader-no-open="true"
            onMouseDown={handleMenuMouseDown}
            onClick={handleMenuOpen}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              },
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="file-uploader-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleReplaceClick}>
              {t('form.common.replace')}
            </MenuItem>
            <MenuItem onClick={handleDeleteFile}>
              {t('form.common.delete')}
            </MenuItem>
          </Menu>
        </>
      )}
      {hasCustomZone && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: previewImage ? 0 : 2,
            width: '100%',
            minHeight: '100px',
            border: ({ palette }) => `4px dotted ${palette.text.secondary}`,
            borderRadius: '8px',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          {showFloatingMenu && (
            <>
              <IconButton
                id="file-uploader-menu-button"
                aria-controls={anchorEl ? 'file-uploader-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
                data-file-uploader-no-open="true"
                onMouseDown={handleMenuMouseDown}
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  backgroundColor: darkGray,
                  '&:hover': {
                    backgroundColor: lightGray,
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="file-uploader-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleReplaceClick}>
                  {t('form.common.replace')}
                </MenuItem>
                <MenuItem onClick={handleDeleteFile}>
                  {t('form.common.delete')}
                </MenuItem>
              </Menu>
            </>
          )}
          {previewImage ? (
            <Box
              component="img"
              src={previewImage}
              alt={previewAlt || 'Preview'}
              sx={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '200px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          ) : (
            children
          )}
        </Box>
      )}
      {dragging && (
        <Box
          style={dropMessageStyle}
          sx={{
            border: `dashed 2px ${darkGray}`,
            borderRadius: '4px',
            backgroundColor: darkGray,
            opacity: 0.5,
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            '& > span': {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-50%)',
            },
          }}
        >
          <span>{hoverTitle ?? t('components.fileUploader.dropHere')}</span>
        </Box>
      )}
      {!hasCustomZone && (
        <>
          <ImageAdd />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexGrow: 1,
              '> span': {
                fontSize: '12px',
                color: ({ palette }) =>
                  error ? palette.error.main : palette.text.secondary,
              },
              '.file-types': {
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                maxWidth: '100px',
              },
            }}
          >
            {error ? (
              <span>{t('components.fileUploader.fileTypeError')}</span>
            ) : (
              <Box
                sx={{
                  span: {
                    textDecoration: 'underline',
                    // fontSize: '14px',
                    color: ({ palette }) => palette.text.secondary,
                  },
                }}
              >
                {!file && !uploaded ? (
                  <>
                    {label ? (
                      <span>{label}</span>
                    ) : (
                      <span>{t('components.fileUploader.uploadDefault')}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>
                      {t('components.fileUploader.uploadedSuccessfully')}
                    </span>{' '}
                    {t('components.fileUploader.uploadAnother')}
                  </>
                )}
              </Box>
            )}

            <DrawTypes types={types} minSize={minSize} maxSize={maxSize} />
          </Box>
        </>
      )}
    </UploaderWrapper>
  );
};
export default FileUploader;
