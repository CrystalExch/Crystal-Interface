import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData } from 'viem';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

import { config } from '../../wagmi';
import { CrystalNFTAbi } from '../../abis/CrystalNFTAbi';
import LeaderboardBanner from '../../assets/nft.jpg';
import './NFTMintingPage.css';

interface NFTMintingPageProps {
  address: `0x${string}` | undefined;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
}

const NFT_ADDRESS = '0x690268345e92230404776ED960Ed82284a62a20d';
const MAX_SUPPLY = 10000;

const NFTMintingPage: React.FC<NFTMintingPageProps> = ({
  address,
  sendUserOperationAsync,
  waitForTxReceipt,
}) => {
  const [tree, setTree] = useState<StandardMerkleTree<any[]> | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/tree.json', { cache: 'force-cache' });
        const json = await res.json();
        const loadedTree = StandardMerkleTree.load(json);
        setTree(loadedTree);
      } catch (err) {
        console.error('failed to load tree.json', err);
      } finally {
        setTreeLoading(false);
      }
    })();
  }, []);

  const [proof, setProof] = useState<`0x${string}`[]>([]);
  const [isElig, setIsElig] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [currentSupply, setCurrentSupply] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const nftData = useMemo(
    () => ({
      name: 'Crystal x BlockNads',
      description: t('mintDesc'),
      imageUrl: LeaderboardBanner,
      totalSupply: MAX_SUPPLY,
    }),
    [],
  );

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
    if (!address || !tree) {
      setProof([]);
      setIsElig(false);
      setHasMinted(false);
      return;
    }

    let newProof: `0x${string}`[] = [];
    try {
      newProof = tree.getProof([address.toLowerCase()]) as `0x${string}`[];
    } catch {}
    setProof(newProof);

    (async () => {
      if (newProof.length === 0) {
        setIsElig(false);
        setHasMinted(false);
        return;
      }
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
  const percentageSold =
    nftData.totalSupply > 0 ? (supplySold / nftData.totalSupply) * 100 : 0;

  const buttonDisabled =
    treeLoading ||
    !tree ||
    !isElig ||
    hasMinted ||
    isMinting ||
    supplySold >= nftData.totalSupply;

  const buttonLabel = treeLoading
    ? t('loading')
    : isMinting
    ? t('minting')
    : hasMinted
    ? t('alreadyMinted')
    : !isElig
    ? t('notEligible')
    : supplySold >= nftData.totalSupply
    ? t('soldOut')
    : t('mintTitle');

  return (
    <div className="nft-scroll-wrapper">
      <div className="nft-main-content-wrapper">
        <div className="nft-image-container">
          {!imageLoaded && <div className="nft-image-placeholder" />}
          <img
            src={nftData.imageUrl}
            className={`nft-image ${imageLoaded ? 'nft-image-loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="nft-title-overlay">
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
                    {supplySold} / {nftData.totalSupply}
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
