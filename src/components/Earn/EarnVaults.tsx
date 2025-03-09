import React from 'react';
import './EarnVaults.css';

interface Vault {
  title: string;
  apy: string;
  totalDeposits: string;
  risk: string;
  token: string;
}

const vaults: Vault[] = [
  { title: "ETH Vault", apy: "5.2%", totalDeposits: "1,234 ETH", risk: "Low", token: "ETH" },
  { title: "DAI Vault", apy: "3.8%", totalDeposits: "567,890 DAI", risk: "Medium", token: "DAI" },
  { title: "USDC Vault", apy: "4.1%", totalDeposits: "789,012 USDC", risk: "Low", token: "USDC" }
];

const EarnVaults: React.FC = () => {
  const deposit = (token: string) => {
    alert(`Deposit function for ${token} coming soon!`);
    // Integrate your backend or smart contract logic here
  };

  return (
    <div className="earn-vaults-page">
      <header className="header">
        <h1>Earn Vaults</h1>
        <p>Maximize your earnings by staking your assets</p>
      </header>
      <div className="earn-container">
        <div className="vaults-grid">
          {vaults.map((vault, index) => (
            <div key={index} className="vault-card">
              <div className="vault-title">{vault.title}</div>
              <div className="vault-details">
                <p>APY: {vault.apy}</p>
                <p>Total Deposits: {vault.totalDeposits}</p>
                <p>Risk Level: {vault.risk}</p>
              </div>
              <div className="vault-action">
                <button onClick={() => deposit(vault.token)}>Deposit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarnVaults;
