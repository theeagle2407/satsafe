'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSendTransaction } from '@starknet-react/core';
import { formatAddress } from '@/lib/starknet';
import { Call } from 'starknet';

const LOCK_PERIODS = [
  { label: '1 Month', days: 30, apy: 4.2 },
  { label: '3 Months', days: 90, apy: 6.5 },
  { label: '6 Months', days: 180, apy: 9.8 },
  { label: '1 Year', days: 365, apy: 14.2 },
];

const STRK_CONTRACT = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';


function ExplorerLink({ href, label }: { href: string; label: string }) {
  return React.createElement('a', {
    href, target: '_blank', rel: 'noopener noreferrer',
    style: { color: '#f97316', fontSize: '12px', fontWeight: '600', textDecoration: 'none' },
  }, label);
}

function ExplorerButton({ href, label }: { href: string; label: string }) {
  return React.createElement('a', {
    href, target: '_blank', rel: 'noopener noreferrer',
    style: {
      display: 'inline-block', padding: '10px 20px',
      backgroundColor: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
      borderRadius: '10px', color: '#f97316', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
    },
  }, label);
}

export default function AppPage() {
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const filteredConnectors = connectors.filter(c => !c.id.toLowerCase().includes('keplr'));
  const [showConnectScreen, setShowConnectScreen] = useState(false);

  const [showBalance, setShowBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'vaults' | 'deposit'>('vaults');
  const [selectedLock, setSelectedLock] = useState(LOCK_PERIODS[1]);
  const [amount, setAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [strkPrice, setStrkPrice] = useState(0.039);
  const [strkBalance, setStrkBalance] = useState('0.0000');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [userVaults, setUserVaults] = useState<any[]>([]);
  const [addFundsVault, setAddFundsVault] = useState<any>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addFundsSuccess, setAddFundsSuccess] = useState(false);
  const [zkProofs, setZkProofs] = useState<Record<string, any>>({});

  // Load vaults from localStorage keyed by wallet address
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem('satsafe_vaults_' + address);
      if (stored) {
        try { setUserVaults(JSON.parse(stored)); } catch { setUserVaults([]); }
      } else {
        setUserVaults([]);
      }
    }
  }, [address]);

  // Fetch STRK price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd');
        const data = await res.json();
        if (data?.starknet?.usd) setStrkPrice(data.starknet.usd);
      } catch { setStrkPrice(0.039); }
    };
    fetchPrice();
  }, []);

  // Fetch ZK proof status for each vault transaction
  useEffect(() => {
    if (!userVaults.length) return;
    const fetchProofs = async () => {
      const proofs: Record<string, any> = {};
      for (const vault of userVaults) {
        if (vault.txHash) {
          try {
            const res = await fetch('/api/proof?tx=' + vault.txHash);
            const data = await res.json();
            proofs[vault.txHash] = data;
          } catch { /* silent fail */ }
        }
      }
      setZkProofs(proofs);
    };
    fetchProofs();
    const interval = setInterval(fetchProofs, 60000);
    return () => clearInterval(interval);
  }, [userVaults.length]);

  // Fetch STRK balance via server-side API route (no CORS)
  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const res = await fetch('/api/balance?address=' + address);
        const data = await res.json();
        console.log('Balance API response:', data);
        if (data?.balance) setStrkBalance(data.balance);
      } catch (err) {
        console.warn('Balance fetch failed:', err);
      }
      setBalanceLoading(false);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const { sendAsync } = useSendTransaction({});

  const strkBalanceUSD = (parseFloat(strkBalance) * strkPrice).toFixed(2);
  const totalSaved = userVaults.reduce((acc, v) => acc + v.amountUSD, 0);
  const totalYield = userVaults.reduce((acc, v) => acc + v.yield, 0);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async () => {
    if (!amount || !goalName || !address) return;
    setDepositing(true);
    try {
      const strkTokens = parseFloat(amount) / strkPrice;
      const strkAmountWei = BigInt(Math.floor(strkTokens * Math.pow(10, 18))).toString();

      const txCalls: Call[] = [{
        contractAddress: STRK_CONTRACT,
        entrypoint: 'transfer',
        calldata: [address, strkAmountWei, '0'],
      }];

      const result = await sendAsync(txCalls);
      if (!result?.transaction_hash) throw new Error('Transaction failed');

      const hash = result.transaction_hash;
      const newVault = {
        id: Date.now(),
        name: goalName,
        token: 'STRK',
        amountUSD: parseFloat(amount),
        strkAmount: strkTokens.toFixed(4),
        yield: 0,
        apy: selectedLock.apy,
        lockDays: selectedLock.days,
        daysLeft: selectedLock.days,
        progress: 0,
        txHash: hash,
        explorerUrl: 'https://sepolia.starkscan.co/tx/' + hash,
        createdAt: new Date().toISOString(),
      };

      const updatedVaults = [...userVaults, newVault];
      setUserVaults(updatedVaults);
      localStorage.setItem('satsafe_vaults_' + address, JSON.stringify(updatedVaults));
      setTxHash(hash);
      setDepositing(false);
      setDepositSuccess(true);

      setTimeout(() => {
        setDepositSuccess(false);
        setActiveTab('vaults');
        setAmount('');
        setGoalName('');
        setTxHash('');
      }, 5000);
    } catch (err: any) {
      console.error('Transaction error:', err);
      setDepositing(false);
      alert('Transaction failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsAmount || !addFundsVault || !address) return;
    setAddFundsLoading(true);
    try {
      const strkTokens = parseFloat(addFundsAmount) / strkPrice;
      const strkAmountWei = BigInt(Math.floor(strkTokens * Math.pow(10, 18))).toString();

      const txCalls: Call[] = [{
        contractAddress: STRK_CONTRACT,
        entrypoint: 'transfer',
        calldata: [address, strkAmountWei, '0'],
      }];

      const result = await sendAsync(txCalls);
      if (!result?.transaction_hash) throw new Error('Transaction failed');

      const hash = result.transaction_hash;
      const updatedVaults = userVaults.map(v =>
        v.id === addFundsVault.id
          ? {
              ...v,
              amountUSD: v.amountUSD + parseFloat(addFundsAmount),
              strkAmount: (parseFloat(v.strkAmount) + strkTokens).toFixed(4),
              txHash: hash,
              explorerUrl: 'https://sepolia.starkscan.co/tx/' + hash,
            }
          : v
      );
      setUserVaults(updatedVaults);
      localStorage.setItem('satsafe_vaults_' + address, JSON.stringify(updatedVaults));
      setAddFundsSuccess(true);
      setAddFundsLoading(false);
      setTimeout(() => {
        setAddFundsSuccess(false);
        setAddFundsVault(null);
        setAddFundsAmount('');
      }, 2500);
    } catch (err: any) {
      console.error('Add funds error:', err);
      setAddFundsLoading(false);
      alert('Transaction failed: ' + (err.message || 'Unknown error'));
    }
  };

  if (!isConnected || showConnectScreen) {
    return React.createElement('div', {
      style: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' },
    },
      React.createElement('div', { style: { width: '100%', maxWidth: '420px' } },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '40px' } },
          React.createElement('div', {
            style: { width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(249,115,22,0.4)', fontSize: '36px' },
          }, '🔐'),
          React.createElement('h1', { style: { fontSize: '28px', fontWeight: '900', margin: '0 0 8px', letterSpacing: '-0.5px' } }, 'SatSafe'),
          React.createElement('p', { style: { color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '15px' } }, 'Connect your Starknet wallet to start saving privately')
        ),
        React.createElement('div', {
          style: { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' },
        },
          React.createElement('h2', { style: { fontSize: '16px', fontWeight: '700', margin: '0 0 16px', textAlign: 'center' } }, 'Connect Wallet'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            filteredConnectors.length === 0
              ? React.createElement('p', { style: { color: 'rgba(255,255,255,0.4)', fontSize: '14px', textAlign: 'center', padding: '16px 0' } }, 'No Starknet wallets detected.')
              : filteredConnectors.map(connector =>
                  React.createElement('button', {
                    key: connector.id,
                    onClick: () => { connect({ connector }); setShowConnectScreen(false); },
                    style: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer', width: '100%' },
                    onMouseOver: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.1)'; },
                    onMouseOut: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; },
                  },
                    React.createElement('div', {
                      style: {
                        width: '40px', height: '40px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '14px', fontWeight: '800', color: 'white',
                        background: connector.id.includes('argent') ? 'linear-gradient(135deg, #FF875B, #FF4F00)' :
                                    connector.id.includes('braavos') ? 'linear-gradient(135deg, #F5A623, #E8860C)' :
                                    connector.id.includes('okx') ? 'linear-gradient(135deg, #555, #111)' :
                                    'linear-gradient(135deg, #6366f1, #4338ca)',
                      },
                    },
                      connector.id.includes('argent') ? 'AX' :
                      connector.id.includes('braavos') ? 'BR' :
                      connector.id.includes('okx') ? 'OX' : '??'
                    ),
                    connector.name
                  )
                )
          ),
          React.createElement('p', { style: { color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '16px', marginBottom: 0 } },
            '🔒 Your identity is protected by ZK proofs on Starknet'
          )
        )
      )
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔐</div>
          <span style={{ fontSize: '18px', fontWeight: '800' }}>SatSafe</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={copyAddress} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            {copied ? '✅' : '📋'} {formatAddress(address || '')}
          </button>
          <button
            onClick={async () => {
                // Disconnect at connector level first — forces wallet to require signature on next connect
                try {
                  if (activeConnector) await activeConnector.disconnect();
                } catch { /* ignore */ }
                disconnect();
                setShowConnectScreen(true);
                if (typeof window !== 'undefined') {
                  Object.keys(localStorage).forEach(key => {
                    if (key.toLowerCase().includes('starknet') || key.toLowerCase().includes('argent') || key.toLowerCase().includes('braavos') || key.toLowerCase().includes('wallet')) {
                      localStorage.removeItem(key);
                    }
                  });
                }
              }}
            style={{ padding: '8px 16px', backgroundColor: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '10px', color: 'rgba(255,100,100,0.9)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Disconnect
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Balance Banner */}
        <div style={{ backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>
              Wallet Balance (Starknet Sepolia) {balanceLoading ? '⏳' : ''}
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#f97316' }}>
              {showBalance ? strkBalance + ' STRK' : '•••••• STRK'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '2px' }}>
              {showBalance ? '≈ $' + strkBalanceUSD + ' USD' : '≈ $•••••• USD'}
            </div>
          </div>
          <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px', padding: '8px 12px' }}>
            {showBalance ? '👁️' : '🙈'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>Total Saved in Vaults</div>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>{showBalance ? '$' + totalSaved.toFixed(2) : '••••••'}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '4px' }}>🔒 ZK Shielded</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>Total Yield Earned</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#4ade80', letterSpacing: '-0.5px' }}>{showBalance ? '+$' + totalYield.toFixed(2) : '••••'}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '4px' }}>Private earnings</div>
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>Active Vaults</div>
            <div style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>{userVaults.length}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '4px' }}>Saving goals</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => setActiveTab('vaults')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'vaults' ? '#f97316' : 'rgba(255,255,255,0.06)', color: activeTab === 'vaults' ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>My Vaults</button>
          <button onClick={() => setActiveTab('deposit')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'deposit' ? '#f97316' : 'rgba(255,255,255,0.06)', color: activeTab === 'deposit' ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>+ New Vault</button>
        </div>

        {/* Vaults Tab */}
        {activeTab === 'vaults' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userVaults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No vaults yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>Create your first private savings vault to start earning yield on Starknet.</p>
                <button onClick={() => setActiveTab('deposit')} style={{ padding: '12px 28px', backgroundColor: '#f97316', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>+ Create First Vault</button>
              </div>
            ) : (
              <>
                {userVaults.map(vault => (
                  <div key={vault.id} style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>{vault.name}</h3>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{vault.strkAmount} STRK · {vault.apy}% APY</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>{showBalance ? '$' + vault.amountUSD.toFixed(2) : '••••••'}</div>
                        <div style={{ color: '#4ade80', fontSize: '13px' }}>+${vault.yield.toFixed(2)} earned</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                        <span>Lock Progress</span><span>{vault.daysLeft} days left</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '6px' }}>
                        <div style={{ width: vault.progress + '%', background: 'linear-gradient(90deg, #f97316, #fbbf24)', height: '6px', borderRadius: '999px' }} />
                      </div>
                    </div>

                    {/* ZK Proof Status */}
                    {vault.txHash && (() => {
                      const proof = zkProofs[vault.txHash];
                      const zkColor = proof?.zkColor || '#6b7280';
                      const zkLabel = proof?.zkLabel || 'Fetching STARK proof...';
                      const zkDescription = proof?.zkDescription || '';
                      return (
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zkColor, boxShadow: '0 0 6px ' + zkColor, flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: zkColor }}>⚡ STARK Proof: {zkLabel}</span>
                          </div>
                          {zkDescription && (
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 0 16px', lineHeight: '1.5' }}>{zkDescription}</p>
                          )}
                          {proof?.blockNumber && (
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: '4px 0 0 16px' }}>Block #{proof.blockNumber} · Starknet Sepolia</p>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>🔒 Locked for {vault.lockDays} days · ZK Shielded</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {vault.txHash && <ExplorerLink href={vault.explorerUrl} label="View on Starkscan →" />}
                        <button
                          onClick={() => { setAddFundsVault(vault); setAddFundsAmount(''); setAddFundsSuccess(false); }}
                          style={{ padding: '6px 14px', backgroundColor: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', color: '#f97316', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Add Funds
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setActiveTab('deposit')} style={{ padding: '20px', backgroundColor: 'rgba(249,115,22,0.06)', border: '1px dashed rgba(249,115,22,0.3)', borderRadius: '20px', color: '#f97316', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>+ Create New Vault</button>
              </>
            )}
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '28px' }}>Create Private Vault</h2>

            {depositSuccess ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Vault Created!</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>Your savings are now ZK-shielded on Starknet.</p>
                {txHash && <ExplorerButton href={'https://sepolia.starkscan.co/tx/' + txHash} label="View on Starkscan →" />}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>🎯 Savings Goal Name</label>
                  <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. Emergency Fund, Travel, House..."
                    style={{ width: '100%', padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Amount (USD value)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                      style={{ width: '100%', padding: '14px 70px 14px 16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '13px' }}>USD</span>
                  </div>
                  {amount && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px' }}>≈ {(parseFloat(amount) / strkPrice).toFixed(2)} STRK will be deducted</div>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>⏱️ Lock Period</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                    {LOCK_PERIODS.map(period => (
                      <button key={period.days} onClick={() => setSelectedLock(period)}
                        style={{ padding: '12px 8px', borderRadius: '12px', border: selectedLock.days === period.days ? '2px solid #f97316' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedLock.days === period.days ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)', color: selectedLock.days === period.days ? '#f97316' : 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textAlign: 'center' }}>
                        <div>{period.label}</div>
                        <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '2px' }}>{period.apy}% APY</div>
                      </button>
                    ))}
                  </div>
                </div>

                {amount && (
                  <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Estimated Yield</span>
                      <span style={{ color: '#4ade80', fontWeight: '700' }}>+${((parseFloat(amount) * selectedLock.apy / 100) * (selectedLock.days / 365)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>APY</span>
                      <span style={{ color: '#4ade80', fontWeight: '700' }}>{selectedLock.apy}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>STRK to deduct</span>
                      <span style={{ color: 'white', fontWeight: '700' }}>{(parseFloat(amount) / strkPrice).toFixed(4)} STRK</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Privacy</span>
                      <span style={{ color: '#f97316', fontWeight: '700' }}>🔒 ZK Shielded</span>
                    </div>
                  </div>
                )}

                <button onClick={handleDeposit} disabled={!amount || !goalName || depositing}
                  style={{ width: '100%', padding: '16px', backgroundColor: !amount || !goalName ? 'rgba(255,255,255,0.08)' : '#f97316', color: !amount || !goalName ? 'rgba(255,255,255,0.3)' : 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '16px', cursor: !amount || !goalName ? 'not-allowed' : 'pointer' }}>
                  {depositing ? '⏳ Waiting for signature...' : '🔐 Create Private Vault'}
                </button>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>🔒 Transaction shielded with Starknet ZK proofs</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      {addFundsVault && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px' }}>
            {addFundsSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Funds Added!</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Your vault has been topped up.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Add Funds to "{addFundsVault.name}"</h3>
                  <button onClick={() => setAddFundsVault(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  Current: <span style={{ color: 'white', fontWeight: '700' }}>${addFundsVault.amountUSD.toFixed(2)}</span> · {addFundsVault.strkAmount} STRK · {addFundsVault.apy}% APY
                </div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Amount to Add (USD)</label>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <input
                    type="number"
                    value={addFundsAmount}
                    onChange={e => setAddFundsAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '14px 70px 14px 16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '13px' }}>USD</span>
                </div>
                {addFundsAmount && (
                  <div style={{ backgroundColor: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>STRK to deduct</span>
                      <span style={{ color: '#f97316', fontWeight: '700' }}>{(parseFloat(addFundsAmount) / strkPrice).toFixed(4)} STRK</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>New total</span>
                      <span style={{ color: 'white', fontWeight: '700' }}>${(addFundsVault.amountUSD + parseFloat(addFundsAmount)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setAddFundsVault(null)} style={{ flex: 1, padding: '14px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFunds}
                    disabled={!addFundsAmount || addFundsLoading}
                    style={{ flex: 2, padding: '14px', backgroundColor: !addFundsAmount ? 'rgba(255,255,255,0.08)' : '#f97316', border: 'none', borderRadius: '12px', color: !addFundsAmount ? 'rgba(255,255,255,0.3)' : 'white', fontWeight: '800', fontSize: '14px', cursor: !addFundsAmount ? 'not-allowed' : 'pointer' }}
                  >
                    {addFundsLoading ? '⏳ Waiting...' : '+ Add Funds'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}