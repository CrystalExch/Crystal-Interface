import { Globe, MessageCircle, Twitter } from 'lucide-react';
import {forwardRef} from 'react';

import { tokenData, TokenSymbol } from '../tokenInfo';

import closebutton from '../../../../../assets/close_button.png';

import './TokenInfoPopupContent.css';

const TokenInfoPopupContent = forwardRef<
  HTMLDivElement,
  { symbol: TokenSymbol; setpopup: (val: number) => void }
>(({ symbol, setpopup }, ref) => {
  const info = tokenData[symbol];

  if (!info) return null;

  return (
    <div
      ref={ref}
      className="tokenselectbg token-info-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="tokenselect-close-button" onClick={() => setpopup(0)}>
        <img src={closebutton} className="close-button-icon" />
      </button>

      <div className="token-info-modal-content">
        <img src={info.image} className="token-info-modal-image" />
        <h3 className="token-info-modal-title">{info.name}</h3>
        <p className="token-info-modal-description">{info.description}</p>

        <div className="token-info-modal-links">
          {info.website && (
            <a
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="token-info-modal-link"
            >
              <Globe size={14} />
              {t('landing')}
            </a>
          )}

          {info.twitter && (
            <a
              href={info.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="token-info-modal-link"
            >
              <Twitter size={14} />
              Twitter
            </a>
          )}

          {info.discord && (
            <a
              href={info.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="token-info-modal-link"
            >
              <MessageCircle size={14} />
              Discord
            </a>
          )}
        </div>
      </div>
    </div>
  );
})

export default TokenInfoPopupContent;
