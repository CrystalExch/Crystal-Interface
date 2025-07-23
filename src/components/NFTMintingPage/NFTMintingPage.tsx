import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { readContracts } from '@wagmi/core';
import { encodeFunctionData } from 'viem';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

import { config } from '../../wagmi';
import { CrystalNFTAbi } from '../../abis/CrystalNFTAbi';
import './NFTMintingPage.css';

interface NFTMintingPageProps {
  address: `0x${string}` | undefined;
  sendUserOperationAsync: any;
  waitForTxReceipt: any;
  setChain: any;
}

const NFT_ADDRESS = '0x8950E4E054E5DB80ab382f3DC389d54189dF4A5a';
const MAX_SUPPLY = 1000;

const NFTMintingPage: React.FC<NFTMintingPageProps> = ({
  address,
  sendUserOperationAsync,
  waitForTxReceipt,
  setChain,
}) => {
  const [tree, setTree] = useState<StandardMerkleTree<any[]> | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [proof, setProof] = useState<`0x${string}`[]>([]);
  const [isElig, setIsElig] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [currentSupply, setCurrentSupply] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [meta, setMeta] = useState<{ name: string; desc: string; img: string } | null>(null);
  const [metaLoad, setMetaLoad] = useState(false);
  const [addrList, setAddrList] = useState<string[]|null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cache = await caches.open('nft-tree-cache');

        const fetchCached = async (path: string) => {
          const cached = await cache.match(path);
          if (cached) return cached;
          const res = await fetch(path, { cache: 'no-cache' });
          cache.put(path, res.clone());
          return res;
        };

        const treeRes = await fetchCached('/tree.json');
        const treeJson = await treeRes.json();
        const { StandardMerkleTree } = await import('@openzeppelin/merkle-tree');
        const loadedTree = StandardMerkleTree.load(treeJson);
        if (!cancelled) setTree(loadedTree);

        const addrRes = await fetchCached('/addresses.json');
        const addrJson = await addrRes.json();
        if (!cancelled) setAddrList(addrJson);
      } catch (err) {
        console.error('failed to load merkle tree or addresses', err);
      } finally {
        if (!cancelled) setTreeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const ipfsToHttp = (u: string | undefined) => u && u.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/' + u.slice(7) : u ?? '';

  useEffect(() => {
    if (!address || !addrList) return;

    const idx = addrList.findIndex(a => a.toLowerCase() === address.toLowerCase());
    if (idx === -1) { 
      setMeta(null); 
      return; 
    }

    const id = idx + 1;
    setMetaLoad(true);
    async function fetchCurrentSupply() {
      try {
        const [totalMintedResult, uri] = (await readContracts(config, {
          contracts: [
            {
              abi: CrystalNFTAbi,
              address: NFT_ADDRESS,
              functionName: 'totalMinted',
              args: [],
            },
            {
              abi: CrystalNFTAbi,
              address: NFT_ADDRESS,
              functionName: 'tokenURI',
              args: [BigInt(id)],
            }
          ],
        })) as any[];

        const j = await fetch(ipfsToHttp(uri.result as string)).then(r => r.json());
        
        const rawDesc = j.description ?? '';
        const roundedDesc = rawDesc.replace(
          /(\d+\.\d+)/g,
          (match: string) => Math.round(parseFloat(match)).toLocaleString()
        );

        setMeta({
          name: j.name ?? `Crystal NFT #${id}`,
          desc: roundedDesc,
          img : ipfsToHttp(j.image ?? ''),
        });
        const mintedCount = (totalMintedResult.result as bigint) || 0n;
        setCurrentSupply(Number(mintedCount));
      } catch (err) {
        console.error('failed to read totalMinted()', err);
        setMeta(null);
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
        setHasMinted(false);
        setIsElig(false);
      }
    })();
  }, [address, tree]);

  const handleMint = useCallback(async () => {
    if (!isElig || hasMinted || proof.length === 0) return;
    await setChain();
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
      console.error('Mint failed:', err);
    } finally {
      setIsMinting(false);
    }
  }, [isElig, hasMinted, proof, sendUserOperationAsync, waitForTxReceipt]);

  const supplySold = currentSupply;
  const percentageSold = MAX_SUPPLY > 0 ? (supplySold / MAX_SUPPLY) * 100 : 0;

  const buttonDisabled =
    treeLoading ||
    metaLoad ||
    !tree ||
    !isElig ||
    hasMinted ||
    isMinting ||
    supplySold >= MAX_SUPPLY;

  const buttonLabel = treeLoading
    ? t('loading')
    : isMinting
    ? t('minting')
    : hasMinted
    ? t('alreadyMinted')
    : !isElig
    ? t('notEligible')
    : supplySold >= MAX_SUPPLY
    ? t('soldOut')
    : t('mintTitle');

  return (
    <div className="nft-scroll-wrapper">
      <div className="nft-main-content-wrapper">
        <div className="nft-image-container">
          {!imageLoaded && <div className="nft-image-placeholder" />}
          <img
            src={meta?.img}
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
              <h2 className="nft-name">
                {'Crystal Season 0 Finalists\' NFT'}
              </h2>
              <p className="nft-description">
                {meta?.desc ?? t('mintDesc')}
              </p>

              <div className="nft-supply-container">
                <div className="nft-supply-text">
                  <span>
                    {supplySold} / {MAX_SUPPLY}
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
