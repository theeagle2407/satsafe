'use client';

import { Shield, Lock, TrendingUp, ChevronRight, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo */}
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}>
            <span style={{ fontSize: '22px' }}>🔐</span>
          </div>
          <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>SatSafe</span>
        </div>
        <Link href="/app" style={{ padding: '10px 24px', backgroundColor: '#f97316', color: 'white', fontWeight: '700', borderRadius: '12px', textDecoration: 'none', fontSize: '15px' }}>
          Launch App →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
        {/* Big Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '24px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(249,115,22,0.5)', fontSize: '48px' }}>
            🔐
          </div>
        </div>

        <h1 style={{ fontSize: '64px', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-2px' }}>
          Save Privately.<br />
          <span style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Earn Silently.
          </span>
        </h1>

        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.7' }}>
          The first private Bitcoin savings vault on Starknet. Your balance, earnings, and activity are shielded with zero-knowledge proofs - completely invisible to the outside world.
        </p>

        <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 36px', backgroundColor: '#f97316', color: 'white', fontWeight: '800', borderRadius: '14px', textDecoration: 'none', fontSize: '17px', boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}>
          Start Saving Privately →
        </Link>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', maxWidth: '500px', margin: '64px auto 0' }}>
          {[
            { value: 'ZK', label: 'Zero Knowledge Proofs' },
            { value: '100%', label: 'Non-Custodial' },
            { value: '0%', label: 'Counterparty Risk' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#f97316' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 48px 80px' }}>
        <h2 style={{ fontSize: '40px', fontWeight: '900', textAlign: 'center', marginBottom: '48px', letterSpacing: '-1px' }}>Why SatSafe?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { icon: '🙈', title: 'Shielded Balance', desc: 'Your savings balance is completely private. No one — not even blockchain explorers — can see how much you have saved.' },
            { icon: '📈', title: 'Private Yield', desc: 'Earn yield on your stablecoin savings without revealing your earnings. Your financial growth stays your business.' },
            { icon: '🔒', title: 'Savings Lock', desc: 'Lock your savings for a set period to build financial discipline. Unlock early penalties ensure you stay committed to your goals.' },
            { icon: '🛡️', title: 'ZK Privacy Layer', desc: "Built on Starknet's zero-knowledge cryptographic infrastructure. Your transactions are verified without revealing any private data." },
          ].map((item) => (
            <div key={item.title} style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 48px 80px' }}>
        <h2 style={{ fontSize: '40px', fontWeight: '900', textAlign: 'center', marginBottom: '48px', letterSpacing: '-1px' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }}>
          {[
            { step: '01', title: 'Connect Wallet', desc: 'Connect your Starknet wallet — Ready Wallet, Braavos, or OKX.' },
            { step: '02', title: 'Choose Token', desc: 'Select USDC or USDT to save in stable, inflation-resistant assets.' },
            { step: '03', title: 'Set Goal & Lock', desc: 'Set your savings target and lock period. The longer you lock, the more you earn.' },
            { step: '04', title: 'Earn Privately', desc: 'Your vault generates yield while keeping your balance completely private.' },
          ].map((item) => (
            <div key={item.step} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'rgba(249,115,22,0.25)', marginBottom: '12px' }}>{item.step}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: '60px 48px 80px' }}>
        <div style={{ backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '24px', padding: '60px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-1px' }}>Ready to save privately?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: '1.6' }}>Join thousands saving in stablecoins with complete financial privacy on Starknet.</p>
          <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 36px', backgroundColor: '#f97316', color: 'white', fontWeight: '800', borderRadius: '14px', textDecoration: 'none', fontSize: '17px' }}>
            Launch App →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🔐</div>
          <span style={{ fontWeight: '800', color: 'rgba(255,255,255,0.6)' }}>SatSafe</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', margin: 0 }}>Built on Starknet · PL Genesis Hackathon 2026</p>
      </footer>

    </div>
  );
}