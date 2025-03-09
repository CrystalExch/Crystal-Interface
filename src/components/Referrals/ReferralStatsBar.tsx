import customRound from '../../utils/customRound';
import './ReferralStatsBar.css';

interface Token {
  ticker: string;
  image: string;
}

interface ReferralStatsBarProps {
  tokenList: Token[];
  claimableFees: Record<string, number>;
  totalClaimableFees: number;
}

const ReferralStatsBar = ({
  tokenList,
  claimableFees,
  totalClaimableFees,
}: ReferralStatsBarProps) => {
  return (
    <div className="stats-bar-container">
      <div className="stats-bar-wrapper">
        <div className="stats-bar-grid">
          {tokenList.slice(1, 3 + 1).map((token, index) => (
            <div key={index} className="stats-bar-item">
              <div className="stats-token-info">
                <img src={token.image} className="stats-token-icon" />
                <div className="stats-token-details">
                  <span className="stats-token-value">
                    {customRound(claimableFees[token.ticker] || 0, 3)}
                  </span>
                  <span className="stats-token-name">{token.ticker}</span>
                </div>
              </div>
              {index < 2 && <div className="stats-divider desktop-only" />}
            </div>
          ))}
          <div className="stats-bar-item mobile-total">
            <div className="stats-token-info">
              <div className="stats-total-info">
                <span className="stats-total-label">Total Claim</span>
                <span className="stats-total-value">
                  ${totalClaimableFees ? totalClaimableFees.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="stats-bar-total desktop-only">
          <div className="stats-total-info">
            <span className="stats-total-label">Total Claim</span>
            <span className="stats-total-value">
              ${totalClaimableFees ? totalClaimableFees.toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralStatsBar;
