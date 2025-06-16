import React from 'react';

import './SocialLinks.css';

import twitter from '../../../assets/twitter.png'
import discord from '../../../assets/discord.png'

const SocialLinks: React.FC = () => {
  return (
    <div className="social-links">
      <a
        href="https://x.com/CrystalExch"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link-twitter"
      >
        <img src={twitter} className="discord-footer-icon" />
      </a>
      <a
        href="https://docs.crystal.exchange"
        target="_blank"
        rel="noopener noreferrer"
        className="social-link-docs"
      >
        <img src={discord} className="discord-footer-icon" />
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
