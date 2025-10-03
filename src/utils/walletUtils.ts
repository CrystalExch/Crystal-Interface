export interface SubWallet {
  address: string;
  privateKey: string;
}

/**
 * Deduplicates wallet array by address (case-insensitive)
 * Keeps the first occurrence of each unique address
 */
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

/**
 * Safely saves wallets to localStorage with deduplication
 */
export const saveWalletsToStorage = (wallets: SubWallet[]): SubWallet[] => {
  const deduplicated = deduplicateWallets(wallets);
  localStorage.setItem('crystal_sub_wallets', JSON.stringify(deduplicated));
  return deduplicated;
};

/**
 * Loads wallets from localStorage with automatic deduplication
 */
export const loadWalletsFromStorage = (): SubWallet[] => {
  const stored = localStorage.getItem('crystal_sub_wallets');
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    const deduplicated = deduplicateWallets(parsed);
    
    // If we found duplicates, save the cleaned version
    if (deduplicated.length !== parsed.length) {
      localStorage.setItem('crystal_sub_wallets', JSON.stringify(deduplicated));
    }
    
    return deduplicated;
  } catch {
    return [];
  }
};

/**
 * Adds a wallet with duplicate checking
 */
export const addWallet = (
  existingWallets: SubWallet[], 
  newWallet: SubWallet
): { wallets: SubWallet[], added: boolean, error?: string } => {
  const normalizedNewAddress = newWallet.address.toLowerCase();
  const normalizedNewKey = newWallet.privateKey.toLowerCase();

  // Check for duplicates
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