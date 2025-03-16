import React, { useEffect } from 'react';

import { settings } from './settings.ts';
import { useLanguage } from './contexts/LanguageContext';
import { useSharedContext } from './contexts/SharedContext';

const GlobalInitializer: React.FC = () => {
  const { activechain } = useSharedContext();
  const { t } = useLanguage();

  (globalThis as any).activechain = activechain;
  (globalThis as any).t = t;
  (globalThis as any).markets = settings.chainConfig[activechain].markets;
  (globalThis as any).explorer = settings.chainConfig[activechain].explorer;

  useEffect(() => {
    const images = import.meta.glob('./src/assets/**/*.{png,jpg,jpeg,svg,gif}');

    Object.keys(images).forEach((path) => {
      (images[path] as () => Promise<{ default: string }>)()
        .then((mod) => {
          const img = new Image();
          img.src = mod.default;
        })
        .catch(() => {
          const img = new Image();
          img.src = path;
        });
    });
  }, [activechain]);

  return null;
};

export default GlobalInitializer;
