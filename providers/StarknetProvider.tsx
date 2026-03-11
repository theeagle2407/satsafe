'use client';
import { StarknetConfig, jsonRpcProvider, useInjectedConnectors, argent, braavos } from '@starknet-react/core';
import { sepolia } from '@starknet-react/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function provider() {
  return jsonRpcProvider({
    rpc: () => ({ nodeUrl: 'https://rpc.starknet-testnet.lava.build' }),
  });
}

function StarknetConfigWrapper({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'always',
    order: 'alphabetical',
  });

  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={provider()}
      connectors={connectors}
      autoConnect={false}
    >
      {children}
    </StarknetConfig>
  );
}

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfigWrapper>{children}</StarknetConfigWrapper>
    </QueryClientProvider>
  );
}