import { useState } from 'react';
import './EarnVaults.css';

interface Vault {
  market: string;
  depositAPR: string;
  totalDeposited: string;
  borrowAPR: string;
  totalBorrowed: string;
  balance: string;
}

interface Token {
  ticker: string;
  image: string;
}

interface EarnVaultsProps {
  tokenList: Token[];
}

const vaults: Vault[] = [
  {
    market: "USDC",
    depositAPR: "2.88%",
    totalDeposited: "22,817,442 USDC",
    borrowAPR: "4.84%",
    totalBorrowed: "195,382 USDC",
    balance: "0 USDC"
  },
  {
    market: "wBTC",
    depositAPR: "0.00%",
    totalDeposited: "344 wBTC",
    borrowAPR: "1.02%",
    totalBorrowed: "41 wBTC",
    balance: "0 wBTC"
  },
  {
    market: "wETH",
    depositAPR: "0.72%",
    totalDeposited: "2,742 wETH",
    borrowAPR: "1.05%",
    totalBorrowed: "422 wETH",
    balance: "0 wETH"
  },
  {
    market: "ARB",
    depositAPR: ".45%",
    totalDeposited: "530,587 ARB",
    borrowAPR: "2.27%",
    totalBorrowed: "132,382 ARB",
    balance: "0 ARB"
  },
]; 

const EarnVaults = ({ tokenList }: EarnVaultsProps) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>("");

  const openDepositModal = (market: string) => {
    setSelectedMarket(market);
    setShowDepositModal(true);
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setSelectedMarket("");
  };

  const openBorrowModal = (market: string) => {
    setSelectedMarket(market);
    setShowBorrowModal(true);
  };

  const closeBorrowModal = () => {
    setShowBorrowModal(false);
    setSelectedMarket("");
  };

  return (
    <div className="earn-vaults-page">
      <div>
        <table className="earn-vault-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>Deposit APR</th>
              <th>Total Deposited</th>
              <th>Borrow APR</th>
              <th>Total Borrowed</th>
              <th>Your Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vaults.map((vault, idx) => {
              const matchingToken = tokenList.find(
                (token) => token.ticker.toLowerCase() === vault.market.toLowerCase()
              );
              return (
                <tr key={idx}>
                  <td className="earn-market-cell">
                    {matchingToken && (
                      <img
                        src={matchingToken.image}
                        alt={`${vault.market} logo`}
                        className="earn-market-icon"
                      />
                    )}
                    <span>{vault.market}</span>
                  </td>
                  <td>{vault.depositAPR}</td>
                  <td>{vault.totalDeposited}</td>
                  <td>{vault.borrowAPR}</td>
                  <td>{vault.totalBorrowed}</td>
                  <td>{vault.balance}</td>
                  <td className="earn-action-buttons">
                    <button
                      className="earn-deposit-btn"
                      onClick={() => openDepositModal(vault.market)}
                    >
                      Deposit
                    </button>
                    <button
                      className="earn-borrow-btn"
                      onClick={() => openBorrowModal(vault.market)}
                    >
                      Borrow
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDepositModal && (
        <div className="earn-modal-overlay">
          <div className="earn-modal-content">
            <button className="earn-close-button" onClick={closeDepositModal}>
              ✕
            </button>
            <h2 className="earn-modal-title">Source</h2>
            <p className="earn-modal-subtitle">
              Choose a deposit source for {selectedMarket}.
            </p>
            <div className="earn-deposit-options">
              <div className="earn-deposit-option">
                <div className="earn-option-info">
                  <strong>Connect Exchange</strong>
                  <div className="earn-option-limit">No limit • 2min</div>
                </div>
                <div className="earn-option-icons">
                  <span style={{ marginRight: '5px' }}>🌐</span>
                  <span>🪙</span>
                </div>
              </div>
              <div className="earn-deposit-option">
                <div className="earn-option-info">
                  <strong>Use card</strong>
                  <div className="earn-option-limit">$10,000 limit • 5min</div>
                </div>
                <div className="earn-option-icons">
                  <span style={{ marginRight: '5px' }}>💳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBorrowModal && (
        <div className="earn-modal-overlay">
          <div className="earn-modal-content">
            <button className="earn-close-button" onClick={closeBorrowModal}>
              ✕
            </button>
            <h2 className="earn-modal-title">Borrow &amp; Withdraw</h2>
            <p className="earn-borrow-description">
              Withdrawing Borrowed Funds<br />
              You can borrow assets against your existing collateral.
              Borrowing increases your margin usage and account risk.
            </p>
            <div className="earn-toggle-row">
              <label htmlFor="enableBorrowing">Enable borrowing</label>
              <input
                id="enableBorrowing"
                type="checkbox"
                style={{ marginLeft: '10px' }}
              />
            </div>
            <div className="earn-borrow-inputs">
              <div className="earn-select-row">
                <label htmlFor="borrowToken">Token</label>
                <select id="borrowToken" defaultValue={selectedMarket}>
                  <option value="USDC">USDC</option>
                  <option value="wETH">wETH</option>
                  <option value="wBTC">wBTC</option>
                </select>
              </div>
              <div className="earn-amount-row">
                <label htmlFor="borrowAmount">Amount</label>
                <input
                  id="borrowAmount"
                  type="number"
                  placeholder="0.00"
                  step="any"
                />
              </div>
              <div className="earn-max-row">Max with borrow: 0</div>
            </div>
            <div className="earn-borrow-percentage-buttons">
              <button>25%</button>
              <button>50%</button>
              <button>75%</button>
              <button>100%</button>
            </div>
            <div className="earn-summary-row">
              <label>Summary</label>
              <input type="text" placeholder="Enter Amount" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarnVaults;
