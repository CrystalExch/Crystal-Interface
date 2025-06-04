import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData } from 'viem';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

import { config } from '../../wagmi';
import { CrystalNFTAbi } from '../../abis/CrystalNFTAbi';
import treeJson from './tree.json';
import LeaderboardBanner from '../../assets/nft.jpg';
import './NFTMintingPage.css';

interface NFTMintingPageProps {
  address: `0x${string}` | undefined;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
}

const NFT_ADDRESS = '0xa15123E8b9C4BE639b380c48B75705475367b294';
const MAX_SUPPLY = 38777;

function proofForAddress(tree: StandardMerkleTree<any[]>, addr: string) {
  try {
    return tree.getProof([addr.toLowerCase()]) as `0x${string}`[];
  } catch {
    return [];
  }
}

const NFTMintingPage: React.FC<NFTMintingPageProps> = ({
  address,
  sendUserOperationAsync,
  waitForTxReceipt,
}) => {
  const tree = useMemo(() => StandardMerkleTree.load(treeJson as any), []);
  const nftData = useMemo(
    () => ({
      name: 'Crystal x BlockNads',
      description: t('mintDesc'),
      imageUrl: LeaderboardBanner,
      totalSupply: MAX_SUPPLY,
    }),
    [],
  );
  const [currentSupply, setCurrentSupply] = useState<number>(0);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [proof, setProof] = useState<`0x${string}`[]>([]);
  const [isElig, setIsElig] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    async function fetchCurrentSupply() {
      try {
        const [totalMintedResult] = (await readContracts(config, {
          contracts: [
            {
              abi: CrystalNFTAbi,
              address: NFT_ADDRESS,
              functionName: 'totalMinted',
              args: [],
            },
          ],
      })) as any[];

        const mintedCount = (totalMintedResult.result as bigint) || 0n;
        setCurrentSupply(Number(mintedCount));
      } catch (err) {
        console.error('failed to read totalMinted()', err);
        setCurrentSupply(0);
      }
    }

    fetchCurrentSupply();
  }, [address, hasMinted]);

  useEffect(() => {
    if (!address) {
      setProof([]);
      setIsElig(false);
      setHasMinted(false);
      return;
    }

    const newProof = proofForAddress(tree, address);
    setProof(newProof);
    if (newProof.length === 0) {
      setIsElig(false);
      setHasMinted(false);
      return;
    }

    (async () => {
      try {
        const [mintedFlag, eligFlag] = (await readContracts(config, {
          contracts: [
            {
              abi: CrystalNFTAbi,
              address: NFT_ADDRESS,
              functionName: 'hasMinted',
              args: [address],
            },
            {
              abi: CrystalNFTAbi,
              address: NFT_ADDRESS,
              functionName: 'checkWhitelist',
              args: [address, newProof],
            },
          ],
        })) as any[];

        setHasMinted(mintedFlag.result as boolean);
        setIsElig(eligFlag.result as boolean);
      } catch (err) {
        console.error('eligibility read failed', err);
        setHasMinted(false);
        setIsElig(false);
      }
    })();
  }, [address, tree]);

  const handleImageLoad = () => setImageLoaded(true);

  const handleMint = useCallback(async () => {
    if (!isElig || hasMinted || proof.length === 0) return;

    setIsMinting(true);
    try {
      const uo = {
        target: NFT_ADDRESS as `0x${string}`,
        data: encodeFunctionData({
          abi: CrystalNFTAbi,
          functionName: 'mint',
          args: [proof],
        }),
        value: 0n,
      };
      const op = await sendUserOperationAsync({ uo });
      await waitForTxReceipt(op.hash);
      setHasMinted(true);
    } catch (err) {
      console.error('mint failed:', err);
    } finally {
      setIsMinting(false);
    }
  }, [isElig, hasMinted, proof, sendUserOperationAsync, waitForTxReceipt]);

  const supplySold = currentSupply;
  const totalSupply = nftData.totalSupply;
  const percentageSold = totalSupply > 0 ? (supplySold / totalSupply) * 100 : 0;

  const buttonDisabled =
    !isElig || hasMinted || isMinting || supplySold >= totalSupply;
  const buttonLabel = isMinting
    ? t('minting')
    : hasMinted
    ? t('alreadyMinted')
    : !isElig
    ? t('notEligible')
    : supplySold >= totalSupply
    ? t('soldOut')
    : t('mintTitle');

  return (
    <div className="nft-scroll-wrapper">
      <div className="nft-main-content-wrapper">
        <div className="nft-image-container">
          {!imageLoaded && <div className="nft-image-placeholder" />}
          <img
            src={nftData.imageUrl}
            className={`nft-image ${
              imageLoaded ? 'nft-image-loaded' : ''
            }`}
            onLoad={handleImageLoad}
          />
          <div className="nft-title-overlay">
            <h1 className="nft-static-title">{nftData.name}</h1>
          </div>
        </div>

        <div className="nft-swapmodal">
          <div className="nft-header">
            <h1 className="nft-tokenselectheader1">{t('mintTitle')}</h1>
            <p className="nft-tokenselectheader2">{t('mintSubtitle')}</p>
          </div>

          <div className="nft-content">
            <div className="nft-details">
              <h2 className="nft-name">{nftData.name}</h2>
              <p className="nft-description">{nftData.description}</p>

              <div className="nft-supply-container">
                <div className="nft-supply-text">
                  <span>
                    {supplySold} / {totalSupply}
                  </span>
                  <span className="nft-supply-percentage">
                    {percentageSold.toFixed(1)}% {t('minted')}
                  </span>
                </div>
                <div className="nft-supply-bar">
                  <div
                    className="nft-supply-progress"
                    style={{ width: `${percentageSold}%` }}
                  />
                </div>
              </div>

              <div className="nft-price-container">
                <div className="nft-label-container">{t('price')}</div>
                <div className="nft-value-container">{t('free')}</div>
              </div>
            </div>

            <button
              className={`nft-swap-button ${
                isMinting ? 'nft-signing' : ''
              }`}
              onClick={handleMint}
              disabled={buttonDisabled}
            >
              {isMinting && <div className="nft-loading-spinner" />}
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTMintingPage;
