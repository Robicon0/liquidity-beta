/**
 * DeFi Protocol Configuration
 * Contains LP protocol information, contract addresses, and event signatures
 */

/**
 * Event signatures for LP detection
 */
export const LP_EVENT_SIGNATURES = {
  // Uniswap V2 & Forks
  MINT: '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f', // Mint(address,uint256,uint256)
  BURN: '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496', // Burn(address,uint256,uint256,address)

  // Uniswap V3
  MINT_V3: '0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde', // Mint(address,address,int24,int24,uint128,uint256,uint256)
  BURN_V3: '0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c', // Burn(address,int24,int24,uint128,uint256,uint256)
  COLLECT: '0x70935338e69775456a85ddef226c395fb668b63fa0115f5f20610b388e6ca9c0', // Collect(address,address,int24,int24,uint128,uint128)

  // Curve
  ADD_LIQUIDITY: '0x26f55a85081d24974e85c6c00045d0f0453991e95873f52bff0d21af4079a768', // AddLiquidity(address,uint256[],uint256[],uint256,uint256)
  REMOVE_LIQUIDITY: '0x5ad056f2e28a8cec232015406b843668c1e36cda598127ec3b8c59b8c72773a0', // RemoveLiquidity(address,uint256[],uint256[],uint256)

  // Balancer V2
  POOL_BALANCE_CHANGED: '0xe5ce249087ce04f05a957192435400fd97868dba0e6a4b4c049abf8af80dae78', // PoolBalanceChanged

  // Generic Transfer (for LP tokens)
  TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer(address,address,uint256)
};

/**
 * Protocol Definitions
 */
export const PROTOCOLS = {
  uniswapV2: {
    name: 'Uniswap V2',
    type: 'amm',
    version: 'v2',
    logo: '🦄',
    color: '#FF007A',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    contracts: {
      ethereum: {
        factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
      },
      polygon: {
        factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
        router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'
      }
    },
    lpTokenDetection: {
      methodId: '0x0dfe1681', // token0()
      methodId2: '0xd21220a7'  // token1()
    }
  },

  uniswapV3: {
    name: 'Uniswap V3',
    type: 'concentrated',
    version: 'v3',
    logo: '🦄',
    color: '#FF007A',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    contracts: {
      ethereum: {
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
      },
      polygon: {
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
      }
    },
    nftBased: true
  },

  sushiswap: {
    name: 'SushiSwap',
    type: 'amm',
    version: 'v2',
    logo: '🍣',
    color: '#FA52A0',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    contracts: {
      ethereum: {
        factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
        router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
      },
      polygon: {
        factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
        router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
      }
    }
  },

  curve: {
    name: 'Curve Finance',
    type: 'stableswap',
    version: 'v1',
    logo: '🌊',
    color: '#40649F',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'],
    contracts: {
      ethereum: {
        registry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
        addressProvider: '0x0000000022D53366457F9d5E68Ec105046FC4383'
      }
    },
    specialized: true
  },

  balancerV2: {
    name: 'Balancer V2',
    type: 'weighted',
    version: 'v2',
    logo: '⚖️',
    color: '#1E1E1E',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
    contracts: {
      ethereum: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
      },
      polygon: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
      }
    }
  },

  pancakeswap: {
    name: 'PancakeSwap',
    type: 'amm',
    version: 'v2',
    logo: '🥞',
    color: '#D1884F',
    chains: ['bsc', 'ethereum'],
    contracts: {
      bsc: {
        factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
        router: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
      }
    }
  },

  aerodrome: {
    name: 'Aerodrome',
    type: 'amm',
    version: 'v2',
    logo: '✈️',
    color: '#0047FF',
    chains: ['base'],
    contracts: {
      base: {
        factory: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
        router: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43'
      }
    }
  }
};

/**
 * Known LP Token Signatures
 * Used to identify if a contract is an LP token
 */
export const LP_TOKEN_PATTERNS = {
  uniswapV2: ['0x0dfe1681', '0xd21220a7'], // token0(), token1()
  balancer: ['0xf3b9569f'], // getPoolId()
  curve: ['0xb4b577ad']  // coins(uint256)
};

/**
 * Get protocol by name
 * @param {string} name - Protocol name
 * @returns {Object|null} Protocol configuration
 */
export function getProtocol(name) {
  return PROTOCOLS[name] || null;
}

/**
 * Get all protocols supporting a specific chain
 * @param {string} chainName - Chain name
 * @returns {Object[]} Array of protocols
 */
export function getProtocolsByChain(chainName) {
  return Object.entries(PROTOCOLS)
    .filter(([_, protocol]) => protocol.chains.includes(chainName))
    .map(([key, protocol]) => ({ key, ...protocol }));
}

/**
 * Check if an address matches a known protocol contract
 * @param {string} address - Contract address
 * @param {string} chainName - Chain name
 * @returns {Object|null} Protocol match or null
 */
export function matchProtocolContract(address, chainName) {
  const lowerAddr = address.toLowerCase();

  for (const [key, protocol] of Object.entries(PROTOCOLS)) {
    const chainContracts = protocol.contracts[chainName];
    if (!chainContracts) continue;

    for (const contractAddr of Object.values(chainContracts)) {
      if (contractAddr.toLowerCase() === lowerAddr) {
        return { protocolKey: key, ...protocol };
      }
    }
  }

  return null;
}
