import { Box } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BrandingFormCard from './BrandingFormCard';
import BrandingInstructionsCard from './BrandingInstructionsCard';
import BrandingPreviewCard from './BrandingPreviewCard';
import { BackgroundMode, BrandingPreviewItem, GeneratedBrandingAssets } from './types';

type BrandingUtilsModule = typeof import('@utils/branding');

let brandingUtilsPromise: Promise<BrandingUtilsModule> | null = null;
const loadBrandingUtils = (): Promise<BrandingUtilsModule> => {
  if (!brandingUtilsPromise) {
    brandingUtilsPromise = import('@utils/branding');
  }
  return brandingUtilsPromise;
};

const buildPreviewItems = (
  assets: GeneratedBrandingAssets,
  t: (key: string) => string,
  createPngObjectUrl: BrandingUtilsModule['createPngObjectUrl'],
): BrandingPreviewItem[] => [
  {
    id: 'icon',
    label: t('brandingGenerator.previews.icon'),
    path: t('brandingGenerator.previews.iconPath'),
    url: createPngObjectUrl(assets.icon512),
  },
  {
    id: 'favicon',
    label: t('brandingGenerator.previews.favicon'),
    path: t('brandingGenerator.previews.faviconPath'),
    url: createPngObjectUrl(assets.favicon32),
  },
];

const BrandingPage = () => {
  const { t } = useTranslation();
  const [smallLogo, setSmallLogo] = useState<File | null>(null);
  const [bigLogo, setBigLogo] = useState<File | null>(null);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('transparent');
  const [roundedCorners, setRoundedCorners] = useState(true);
  const [cornerRadiusPercent, setCornerRadiusPercent] = useState(30);
  const [appName, setAppName] = useState('Congr.io');
  const [shortName, setShortName] = useState('Congr.io');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<BrandingPreviewItem[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  const replacePreviewItems = useCallback((nextItems: BrandingPreviewItem[]) => {
    previewUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    previewUrlsRef.current = nextItems.map((item) => item.url);
    setPreviewItems(nextItems);
  }, []);

  useEffect(() => {
    document.title = t('brandingGenerator.title');
  }, [t]);

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = [];
    },
    [],
  );

  const canGenerate = useMemo(() => Boolean(smallLogo && bigLogo) && !isGenerating, [smallLogo, isGenerating, bigLogo]);

  const handleSmallLogoChange = useCallback((file: File | null) => {
    setSmallLogo(file);
    setError('');
    setSuccess('');
  }, []);

  const handleBigLogoChange = useCallback((file: File | null) => {
    setBigLogo(file);
    setError('');
    setSuccess('');
  }, []);

  const createPreviewItems = useCallback(
    async (assets: GeneratedBrandingAssets) => {
      const { createPngObjectUrl } = await loadBrandingUtils();
      return buildPreviewItems(assets, t, createPngObjectUrl);
    },
    [t],
  );

  useEffect(() => {
    if (!smallLogo || !bigLogo) {
      setPreviewError('');
      setIsPreviewLoading(false);
      replacePreviewItems([]);
      return;
    }

    let isCancelled = false;

    const generatePreviews = async () => {
      setPreviewError('');
      setIsPreviewLoading(true);

      try {
        const { generateBrandingAssets } = await loadBrandingUtils();
        const assets = await generateBrandingAssets({
          smallLogoFile: smallLogo,
          bigLogoFile: bigLogo,
          backgroundMode,
          roundedCorners,
          cornerRadiusPercent,
          appName,
          shortName,
        });

        const nextItems = await createPreviewItems(assets);
        if (isCancelled) return;
        replacePreviewItems(nextItems);
        setPreviewError('');
      } catch (value) {
        if (isCancelled) return;

        const message = value instanceof Error ? value.message : t('brandingGenerator.errors.generateFailed');
        setPreviewError(message);
        replacePreviewItems([]);
      } finally {
        if (!isCancelled) {
          setIsPreviewLoading(false);
        }
      }
    };

    void generatePreviews();

    return () => {
      isCancelled = true;
    };
  }, [
    appName,
    backgroundMode,
    cornerRadiusPercent,
    smallLogo,
    bigLogo,
    replacePreviewItems,
    roundedCorners,
    shortName,
    t,
    createPreviewItems,
  ]);

  const handleGenerate = useCallback(() => {
    if (!smallLogo || !bigLogo) {
      setError(t('brandingGenerator.errors.missingFiles'));
      return;
    }

    setError('');
    setSuccess('');
    setIsGenerating(true);

    const generateAndDownload = async () => {
      try {
        const { createZipBlob, downloadBlob, generateBrandingAssets } = await loadBrandingUtils();
        const assets = await generateBrandingAssets({
          smallLogoFile: smallLogo,
          bigLogoFile: bigLogo,
          backgroundMode,
          roundedCorners,
          cornerRadiusPercent,
          appName,
          shortName,
        });

        const nextItems = await createPreviewItems(assets);
        replacePreviewItems(nextItems);
        setPreviewError('');

        const zip = createZipBlob([
          { path: 'branding/logo-small.png', data: assets.smallLogoPng },
          { path: 'branding/logo-big.png', data: assets.bigLogoPng },
          { path: 'icons/icon-192.png', data: assets.icon192 },
          { path: 'icons/icon-512.png', data: assets.icon512 },
          { path: 'icons/apple-touch-icon.png', data: assets.appleTouchIcon },
          { path: 'favicon.ico', data: assets.faviconIco },
          { path: 'manifest.webmanifest', data: assets.manifestBytes },
        ]);

        downloadBlob(zip, 'branding-assets.zip');
        setSuccess(t('brandingGenerator.success.generated'));
      } catch (value) {
        const message = value instanceof Error ? value.message : t('brandingGenerator.errors.generateFailed');
        setError(message);
      } finally {
        setIsGenerating(false);
      }
    };

    void generateAndDownload();
  }, [
    appName,
    backgroundMode,
    cornerRadiusPercent,
    smallLogo,
    bigLogo,
    roundedCorners,
    shortName,
    t,
    createPreviewItems,
    replacePreviewItems,
  ]);

  return (
    <Box
      sx={{
        minHeight: '100%',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 2,
        alignItems: 'stretch',
        backgroundColor: ({ palette }) => palette.background.paper,
      }}
    >
      <Box sx={{ flex: { xs: '1 1 auto', lg: '1 1 60%' }, minWidth: 0 }}>
        <BrandingFormCard
          smallLogo={smallLogo}
          bigLogo={bigLogo}
          backgroundMode={backgroundMode}
          roundedCorners={roundedCorners}
          cornerRadiusPercent={cornerRadiusPercent}
          appName={appName}
          shortName={shortName}
          error={error}
          success={success}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          onSmallLogoChange={handleSmallLogoChange}
          onBigLogoChange={handleBigLogoChange}
          onBackgroundModeChange={setBackgroundMode}
          onRoundedCornersChange={setRoundedCorners}
          onCornerRadiusPercentChange={setCornerRadiusPercent}
          onAppNameChange={setAppName}
          onShortNameChange={setShortName}
          onGenerate={handleGenerate}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: { xs: '1 1 auto', lg: '1 1 40%' },
          minWidth: 0,
        }}
      >
        <BrandingPreviewCard previews={previewItems} isLoading={isPreviewLoading} error={previewError} />
        <BrandingInstructionsCard />
      </Box>
    </Box>
  );
};

export default BrandingPage;
