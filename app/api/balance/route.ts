import { NextRequest, NextResponse } from 'next/server';

const STRK_CONTRACT = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// balanceOf selector
const BALANCE_OF_SELECTOR = '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e';

const RPC_URLS = [
  'https://rpc.starknet-testnet.lava.build',
  'https://free-rpc.nethermind.io/sepolia-juno/',
  'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
];

async function fetchFromRPC(rpcUrl: string, address: string) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'starknet_call',
      params: [
        {
          contract_address: STRK_CONTRACT,
          entry_point_selector: BALANCE_OF_SELECTOR,
          calldata: [address],
        },
        'latest',
      ],
      id: 1,
    }),
  });

  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'No address' }, { status: 400 });

  for (const rpcUrl of RPC_URLS) {
    try {
      console.log('Trying RPC:', rpcUrl);
      const data = await fetchFromRPC(rpcUrl, address);
      console.log('RPC response:', JSON.stringify(data));

      if (data?.result && data.result.length >= 2) {
        const low = BigInt(data.result[0]);
        const high = BigInt(data.result[1]);
        const total = low + high * BigInt('0x100000000000000000000000000000000');
        const formatted = (Number(total) / Math.pow(10, 18)).toFixed(4);
        console.log('Balance:', formatted, 'from', rpcUrl);
        return NextResponse.json({ balance: formatted, rpc: rpcUrl });
      }
    } catch (err: any) {
      console.warn('RPC failed:', rpcUrl, err.message);
    }
  }

  return NextResponse.json({ balance: '0.0000', error: 'All RPCs failed' });
}