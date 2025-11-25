export interface SubWallet {
  address: string;
  privateKey: string;
}


const getWalletsStorageKey = (scaAddress: string | undefined): string => {
  if (!scaAddress) return 'crystal_sub_wallets_default';
  return `crystal_sub_wallets_${scaAddress.toLowerCase()}`;
};


export const getSelectedWalletsStorageKey = (scaAddress: string | undefined): string => {
  if (!scaAddress) return 'crystal_selected_wallets_default';
  return `crystal_selected_wallets_${scaAddress.toLowerCase()}`;
};

export const deduplicateWallets = (wallets: SubWallet[]): SubWallet[] => {
  const seen = new Set<string>();
  const deduplicated: SubWallet[] = [];

  for (const wallet of wallets) {
    const normalizedAddress = wallet.address.toLowerCase();
    
    if (!seen.has(normalizedAddress)) {
      seen.add(normalizedAddress);
      deduplicated.push(wallet);
    }
  }

  return deduplicated;
};

export const saveWalletsToStorage = (wallets: SubWallet[], scaAddress: string | undefined): SubWallet[] => {
  const deduplicated = deduplicateWallets(wallets);
  const storageKey = getWalletsStorageKey(scaAddress);
  localStorage.setItem(storageKey, JSON.stringify(deduplicated));
  return deduplicated;
};

export const loadWalletsFromStorage = (scaAddress: string | undefined): SubWallet[] => {
  const storageKey = getWalletsStorageKey(scaAddress);
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    const deduplicated = deduplicateWallets(parsed);
    
    if (deduplicated.length !== parsed.length) {
      localStorage.setItem(storageKey, JSON.stringify(deduplicated));
    }
    
    return deduplicated;
  } catch {
    return [];
  }
};

export const loadSelectedWalletsFromStorage = (scaAddress: string | undefined): Set<string> => {
  try {
    const storageKey = getSelectedWalletsStorageKey(scaAddress);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const addresses = JSON.parse(saved);
      if (Array.isArray(addresses) && addresses.length > 0) {
        return new Set(addresses);
      }
    }
  } catch (error) {
    console.error('Error loading selected wallets:', error);
  }
  return new Set();
};

export const saveSelectedWalletsToStorage = (selectedWallets: Set<string>, scaAddress: string | undefined): void => {
  try {
    const storageKey = getSelectedWalletsStorageKey(scaAddress);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(selectedWallets)));
  } catch (error) {
    console.error('Error saving selected wallets:', error);
  }
};

export const addWallet = (
  existingWallets: SubWallet[], 
  newWallet: SubWallet
): { wallets: SubWallet[], added: boolean, error?: string } => {
  const normalizedNewAddress = newWallet.address.toLowerCase();
  const normalizedNewKey = newWallet.privateKey.toLowerCase();

  const duplicateAddress = existingWallets.find(
    w => w.address.toLowerCase() === normalizedNewAddress
  );
  const duplicateKey = existingWallets.find(
    w => w.privateKey.toLowerCase() === normalizedNewKey
  );

  if (duplicateAddress) {
    return { 
      wallets: existingWallets, 
      added: false, 
      error: 'A wallet with this address already exists' 
    };
  }

  if (duplicateKey) {
    return { 
      wallets: existingWallets, 
      added: false, 
      error: 'This wallet is already imported' 
    };
  }

  const updatedWallets = [...existingWallets, newWallet];
  return { wallets: updatedWallets, added: true };
};