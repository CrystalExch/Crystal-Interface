import React from 'react';

import './SocialLinks.css';

import twitter from '../../assets/twitter.svg'

const SocialLinks: React.FC = () => {
  return (
    <div className="social-links">
      <a
        href="https://x.com/CrystalExch"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link-twitter"
      >
        X / {t('twitter')}
      </a>
      <a
        href="https://docs.crystal.exchange"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link-docs"
      >
        {t('docs')}
      </a>
      <a
        href="https://discord.gg/CrystalExch"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link-discord"
      >
        {t('getHelp')}
      </a>
    </div>
  );
};

export default SocialLinks;
