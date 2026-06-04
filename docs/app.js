/**
 * Granny Exchange — Solana Swap App
 * Creates $GRANNY token on devnet and enables swapping.
 */

const DEVNET_URL = 'https://api.devnet.solana.com';
const GRANNY_DECIMALS = 9;
const TOTAL_SUPPLY = 1_000_000_000;

let connection = null;
let wallet = null;       // Phantom provider
let grannyMint = null;   // PublicKey of $GRANNY token
let direction = 'sol-to-granny';
let swapQuote = null;

const $ = id => document.getElementById(id);
const els = {
  connectBtn: $('connect-btn'), heroConnect: $('hero-connect'),
  disconnect: $('disconnect-btn'), flip: $('flip-btn'),
  input: $('input-amount'), output: $('output-amount'),
  inBadge: $('in-badge'), outBadge: $('out-badge'),
  action: $('action-btn'), status: $('status-box'),
  impact: $('price-impact'), walletAddr: $('wallet-addr'),
  notConnected: $('not-connected'), swapInterface: $('swap-interface'),
  tokenStatus: $('token-status'),
};

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = 'status-box ' + (type || 'info');
  els.status.classList.remove('hidden');
}
function hideStatus() { els.status.classList.add('hidden'); }
function trunc(a) { return a ? a.slice(0,4)+'...'+a.slice(-4) : ''; }
function updateBadges() {
  const s = direction === 'sol-to-granny';
  els.inBadge.innerHTML = '<span class="token-symbol">' + (s ? 'SOL' : 'GRANNY') + '</span>';
  els.outBadge.innerHTML = '<span class="token-symbol">' + (s ? 'GRANNY' : 'SOL') + '</span>';
}
function setBtn(text, dis) { els.action.textContent = text; els.action.disabled = !!dis; }
function getProvider() { return (window.solana && window.solana.isPhantom) ? window.solana : null; }

async function connectWallet() {
  const p = getProvider();
  if (!p) {
    showStatus('Install Phantom wallet first', 'err');
    window.open('https://phantom.app/', '_blank');
    return;
  }
  try {
    const resp = await p.connect();
    wallet = {
      publicKey: resp.publicKey,
      signTransaction: p.signTransaction.bind(p),
      signAllTransactions: p.signAllTransactions?.bind(p),
    };
    connection = new solanaWeb3.Connection(DEVNET_URL, 'confirmed');

    els.notConnected.classList.add('hidden');
    els.swapInterface.classList.remove('hidden');
    els.walletAddr.textContent = trunc(wallet.publicKey.toBase58());
    els.connectBtn.classList.add('hidden');

    showStatus('Connected! Checking token...', 'succ');
    await checkToken();
  } catch (e) {
    showStatus('Failed: ' + e.message, 'err');
  }
}

async function disconnectWallet() {
  const p = getProvider();
  if (p) { try { await p.disconnect(); } catch (e) {} }
  wallet = null; connection = null; grannyMint = null;
  els.notConnected.classList.remove('hidden');
  els.swapInterface.classList.add('hidden');
  els.connectBtn.classList.remove('hidden');
  hideStatus();
}

async function checkToken() {
  // Check if we already created this token (saved in localStorage)
  const saved = localStorage.getItem('granny_mint');
  if (saved) {
    try {
      grannyMint = new solanaWeb3.PublicKey(saved);
      const info = await connection.getAccountInfo(grannyMint);
      if (info) {
        els.tokenStatus.textContent = '[OK] Token active on devnet';
        els.tokenStatus.style.color = 'var(--green)';
        setBtn('Get Quote');
        hideStatus();
        return;
      }
    } catch (e) {
      localStorage.removeItem('granny_mint');
    }
  }
  // Need to create token
  await createToken();
}

async function createToken() {
  if (!wallet) { showStatus('Connect wallet first', 'err'); return; }

  try {
    showStatus('Creating $GRANNY SPL token on devnet...', 'info');

    // Generate mint keypair
    const mintKeypair = solanaWeb3.Keypair.generate();
    grannyMint = mintKeypair.publicKey;

    const TOKEN_PROGRAM = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const SYSVAR_RENT = new solanaWeb3.PublicKey('SysvarRent111111111111111111111111111111111');

    // Get rent exemption for mint account (82 bytes)
    const rent = await connection.getMinimumBalanceForRentExemption(82);

    // 1. Create mint account
    const createIx = solanaWeb3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: grannyMint,
      lamports: rent,
      space: 82,
      programId: TOKEN_PROGRAM,
    });

    // 2. Initialize mint
    // Instruction data: [1, decimals, mintAuthority(32), option, freezeAuthority(32)]
    const initData = Buffer.alloc(82);
    initData[0] = 1; // initializeMint instruction index
    initData[1] = GRANNY_DECIMALS;
    wallet.publicKey.toBuffer().copy(initData, 2); // mint authority at offset 2
    // freeze authority at offset 34 (option byte + 32 bytes)
    const FREEZE_AUTH_OFFSET = 34;
    initData[FREEZE_AUTH_OFFSET] = 1; // has freeze authority
    wallet.publicKey.toBuffer().copy(initData, FREEZE_AUTH_OFFSET + 1);

    const initMintIx = new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: grannyMint, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_RENT, isSigner: false, isWritable: false },
      ],
      programId: TOKEN_PROGRAM,
      data: initData.slice(0, 67),
    });

    // Build and send transaction
    const { blockhash } = await connection.getRecentBlockhash();
    const tx = new solanaWeb3.Transaction().add(createIx).add(initMintIx);
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;
    tx.sign(mintKeypair);

    // Sign with Phantom
    const signed = await wallet.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid);

    // Save mint address
    localStorage.setItem('granny_mint', grannyMint.toBase58());

    els.tokenStatus.textContent = '[OK] Token created at ' + trunc(grannyMint.toBase58());
    els.tokenStatus.style.color = 'var(--green)';
    showStatus('$GRANNY token created! Mint: ' + trunc(grannyMint.toBase58()), 'succ');
    setBtn('Get Quote');

    // Now mint the supply to the user's wallet
    await mintSupply();

  } catch (e) {
    showStatus('Create failed: ' + e.message, 'err');
    console.error(e);
  }
}

async function mintSupply() {
  if (!wallet || !grannyMint) return;

  try {
    showStatus('Minting ' + TOTAL_SUPPLY.toLocaleString() + ' $GRANNY tokens...', 'info');

    const TOKEN_PROGRAM = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

    // Create ATA for the user
    const { createAssociatedTokenAccount, mintTo } = splToken;

    // Get or create associated token account
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction },
      grannyMint,
      wallet.publicKey,
      false,
      'confirmed',
      {},
      TOKEN_PROGRAM
    );

    // Mint total supply
    const mintAmount = BigInt(TOTAL_SUPPLY) * BigInt(10 ** GRANNY_DECIMALS);
    await mintTo(
      connection,
      { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction },
      grannyMint,
      ata.address,
      wallet.publicKey,
      mintAmount,
      [],
      { commitment: 'confirmed' },
      TOKEN_PROGRAM
    );

    els.tokenStatus.textContent = '[OK] ' + TOTAL_SUPPLY.toLocaleString() + ' $GRANNY minted';
    showStatus('All set! ' + TOTAL_SUPPLY.toLocaleString() + ' $GRANNY tokens minted. You can now swap.', 'succ');

  } catch (e) {
    showStatus('Minting failed: ' + e.message, 'err');
    console.error(e);
  }
}

function getQuote() {
  const val = parseFloat(els.input.value);
  if (!val || val <= 0) { showStatus('Enter a valid amount', 'err'); return; }
  setBtn('Getting quote...', true);
  try {
    // Placeholder rate: 1 SOL = 1000 GRANNY
    const out = direction === 'sol-to-granny' ? val * 1000 : val / 1000;
    swapQuote = { in: val, out: out };
    els.output.textContent = out.toLocaleString(undefined, { maximumFractionDigits: 2 });
    els.output.style.color = 'var(--text)';
    els.impact.classList.add('hidden');
    const iT = direction === 'sol-to-granny' ? 'SOL' : 'GRANNY';
    const oT = direction === 'sol-to-granny' ? 'GRANNY' : 'SOL';
    setBtn('Swap ' + iT + ' to ' + oT);
    hideStatus();
  } catch (e) {
    showStatus('Quote failed: ' + e.message, 'err');
    setBtn('Get Quote');
  }
}

function executeSwap() {
  if (!swapQuote || !wallet) return;
  setBtn('Swapping...', true);
  showStatus('Swap preview ready! Full Jupiter integration coming soon.', 'succ');
  els.input.value = '';
  els.output.textContent = '\u2014';
  els.output.style.color = 'var(--muted)';
  swapQuote = null;
  setBtn('Get Quote');
}

// Events
els.connectBtn.addEventListener('click', connectWallet);
els.heroConnect.addEventListener('click', connectWallet);
els.disconnect.addEventListener('click', disconnectWallet);
els.flip.addEventListener('click', () => {
  direction = direction === 'sol-to-granny' ? 'granny-to-sol' : 'sol-to-granny';
  updateBadges();
  els.input.value = '';
  els.output.textContent = '\u2014';
  els.output.style.color = 'var(--muted)';
  swapQuote = null;
  els.impact.classList.add('hidden');
  hideStatus();
  setBtn('Get Quote');
});
els.input.addEventListener('input', () => {
  swapQuote = null;
  els.output.textContent = '\u2014';
  els.output.style.color = 'var(--muted)';
  els.impact.classList.add('hidden');
  hideStatus();
  const v = parseFloat(els.input.value);
  setBtn(v > 0 ? 'Get Quote' : 'Enter Amount', !(v > 0));
});
els.action.addEventListener('click', () => {
  if (swapQuote) executeSwap(); else getQuote();
});

updateBadges();
const prov = getProvider();
if (prov && prov.isConnected) connectWallet();
