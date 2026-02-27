import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import './PWABadge.css';
import { httpRequest } from './utils/http';

function PWABadge() {
  const { t } = useTranslation();

  // check for updates every hour
  const period = 60 * 60 * 1000;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(period, swUrl, r);
      } else if (r?.installing) {
        r.installing.addEventListener('statechange', (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === 'activated') registerPeriodicSync(period, swUrl, r);
        });
      }
    },
  });

  function close() {
    setNeedRefresh(false);
  }

  return (
    <div className="PWABadge" role="alert" aria-labelledby="toast-message">
      {needRefresh && (
        <div className="PWABadge-toast">
          <div className="PWABadge-message">
            <span id="toast-message">{t('pwa.updateAvailable')}</span>
          </div>
          <div className="PWABadge-buttons">
            <button
              className="PWABadge-toast-button"
              onClick={() => updateServiceWorker(true)}
            >
              {t('pwa.reload')}
            </button>
            <button className="PWABadge-toast-button" onClick={() => close()}>
              {t('pwa.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  if (period <= 0) return;

  setInterval(async () => {
    try {
      if ('onLine' in navigator && !navigator.onLine) return;

      const resp = await httpRequest<Response>({
        service: { url: swUrl, method: 'GET' },
        responseType: 'raw',
        headers: {
          cache: 'no-store',
          'cache-control': 'no-cache',
        },
        requestInit: {
          cache: 'no-store',
        },
      });

      if (resp?.status === 200) await r.update();
    } catch {
      // Ignore transient update checks.
    }
  }, period);
}
