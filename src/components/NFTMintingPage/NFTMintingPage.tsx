import React, { useState, useEffect, useCallback } from 'react';
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

const NFT_ADDRESS = '0x7DCCd0e0Bfa8828f00D7Ba057Ba64c31eAB36e3a';
const MAX_SUPPLY = 1000;

interface AddressData {
  tokenId: string;
  amount: string;
}

const NFTMintingPage: React.FC<NFTMintingPageProps> = ({
  address,
  sendUserOperationAsync,
  waitForTxReceipt,
  setChain,
}) => {
  const [tree, setTree] = useState<StandardMerkleTree<any[]> | null>(null);
  const [addressMap, setAddressMap] = useState<Record<string, AddressData> | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [proof, setProof] = useState<`0x${string}`[]>([]);
  const [tokenId, setTokenId] = useState<bigint>(0n);
  const [amount, setAmount] = useState<bigint>(0n);
  const [hasMinted, setHasMinted] = useState(false);
  const [isElig, setIsElig] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [currentSupply, setCurrentSupply] = useState(0);
  const [meta, setMeta] = useState<{ name: string; desc: string; img: string } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cache = await caches.open('nft-tree-cache');
      const fetchCached = async (path: string) => {
        const cached = await cache.match(path);
        if (cached) return cached;
        const res = await fetch(path, { cache: 'no-cache' });
        if (res.ok) await cache.put(path, res.clone());
        return res;
      };
      try {
        let treeRes = await fetchCached('/tree.json');
        let mapRes = await fetchCached('/addressMap.json');
        if (!mapRes.ok) {
          await cache.delete('/tree.json');
          await cache.delete('/addressMap.json');
          treeRes = await fetchCached('/tree.json');
          mapRes = await fetchCached('/addressMap.json');
        }
        const treeJson = await treeRes.json();
        const mapJson = await mapRes.json();
        if (!cancelled) {
          setAddressMap(mapJson);
          setTree(StandardMerkleTree.load(treeJson));
        }
      } catch (e) {
        console.error('failed to load tree or map', e);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!address || !tree || !addressMap) {
      setIsElig(false);
      setProof([]);
      setTokenId(0n);
      setAmount(0n);
      return;
    }
    const key = address.toLowerCase();
    const data = addressMap[key];
    if (!data) {
      setIsElig(false);
      return;
    }
    const id = BigInt(data.tokenId);
    const amt = BigInt(data.amount);
    setTokenId(id);
    setAmount(amt);
    let pr: any[] = [];
    try {
      pr = tree.getProof([key, id, amt]);
    } catch {}
    setProof(pr as `0x${string}`[]);
    setIsElig(pr.length > 0);

    (async () => {
      try {
        const [claimedRes, totalRes, uriRes] = (await readContracts(config, {
          contracts: [
            { abi: CrystalNFTAbi, address: NFT_ADDRESS, functionName: 'claimed', args: [address] },
            { abi: CrystalNFTAbi, address: NFT_ADDRESS, functionName: 'totalMinted', args: [] },
            { abi: CrystalNFTAbi, address: NFT_ADDRESS, functionName: 'tokenURI', args: [id] },
          ],
        })) as any[];

        setHasMinted(claimedRes.result as boolean);
        setCurrentSupply(Number(totalRes.result as bigint));
        const uri: string = uriRes.result;
        const j = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(r => r.json());
        setMeta({ name: j.name, desc: j.description, img: j.image.replace('ipfs://', 'https://ipfs.io/ipfs/') });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [address, tree, addressMap]);

  const handleClaim = useCallback(async () => {
    if (!isElig || hasMinted || proof.length === 0) return;
    await setChain();
    setIsMinting(true);
    try {
      const data = encodeFunctionData({
        abi: CrystalNFTAbi,
        functionName: 'claim',
        args: [tokenId, amount, proof],
      });
      const op = await sendUserOperationAsync({ uo: { target: NFT_ADDRESS, data, value: amount } });
      await waitForTxReceipt(op.hash);
      setHasMinted(true);
    } catch (e) {
      console.error('claim failed', e);
    } finally {
      setIsMinting(false);
    }
  }, [isElig, hasMinted, proof, tokenId, amount]);

  const supplySold = currentSupply;
  const percentageSold = MAX_SUPPLY > 0 ? (supplySold / MAX_SUPPLY) * 100 : 0;
  const buttonDisabled = loadingData || !isElig || hasMinted || isMinting || supplySold >= MAX_SUPPLY;
  const buttonLabel = loadingData
    ? 'Loading…'
    : isMinting ? 'Claiming…'
    : hasMinted ? 'Claimed'
    : !isElig ? 'Not Eligible'
    : supplySold >= MAX_SUPPLY ? 'Sold Out'
    : 'Claim';

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
          <div className="nft-title-overlay" />
        </div>

        <div className="nft-swapmodal">
          <div className="nft-header">
            <h1 className="nft-tokenselectheader1">Claim Your NFT &amp; MON</h1>
            <p className="nft-tokenselectheader2">Your allocated NFT and native token rewards.</p>
          </div>

          <div className="nft-content">
            <div className="nft-details">
              <h2 className="nft-name">{meta?.name ?? `#${tokenId}`}</h2>
              <p className="nft-description">{meta?.desc ?? 'Claim your rewards'}</p>

              <div className="nft-supply-container">
                <div className="nft-supply-text">
                  <span>{supplySold} / {MAX_SUPPLY}</span>
                  <span className="nft-supply-percentage">{percentageSold.toFixed(1)}% claimed</span>
                </div>
                <div className="nft-supply-bar">
                  <div className="nft-supply-progress" style={{ width: `${percentageSold}%` }} />
                </div>
              </div>

              <div className="nft-price-container">
                <div className="nft-label-container">Amount</div>
                <div className="nft-value-container">{(Number(amount) / 1e18).toFixed(4)} MON</div>
              </div>
            </div>

            <button
              className={`nft-swap-button ${isMinting ? 'nft-signing' : ''}`}
              onClick={handleClaim}
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
