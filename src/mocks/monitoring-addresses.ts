// Publicly disclosed address examples, reused only in the demo ledger.
// They are NOT attributed to the fictional Aegis platform names; no balances or
// transactions from these disclosures are imported into analytics.
const binanceSource = 'https://www.binance.com/en-NZ/blog/community/2895840147147652626'
const coinSwitchSource =
  'https://coinswitch.co/building-blocks/coinswitch-publishes-fifth-edition-of-proof-of-reserves/'

export const monitoringAddressExamples: Record<
  string,
  { source: string; addresses: readonly string[]; explorer: string }
> = {
  TRON: {
    source: binanceSource,
    explorer: 'https://tronscan.org/#/address/',
    addresses: [
      'TV6MuMXfmLbBqPZvBHdwFsDnQeVfnmiuSi',
      'TMuA6YqfCeX8EhbfYEg5y7S4DqzSJireY9',
      'TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb',
      'TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe',
      'TAzsQ9Gx8eqFNFSKbeXrbi45CuVPHzA8wr',
      'TQrY8tryqsYVCYS3MFbtffiPp2ccyn4STm',
      'TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G',
      'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS',
    ],
  },
  BSC: {
    source: binanceSource,
    explorer: 'https://bscscan.com/address/',
    addresses: [
      '0xf977814e90da44bfa03b6295a0616a897441acec',
      '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
      '0x5a52e96bacdabb82fd05763e25335261b270efcb',
      '0x3c783c21a0383057d128bae431894a5c19f9cf06',
    ],
  },
  ETH: {
    source: binanceSource,
    explorer: 'https://etherscan.io/address/',
    addresses: [
      '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
      '0xf977814e90da44bfa03b6295a0616a897441acec',
      '0x5a52e96bacdabb82fd05763e25335261b270efcb',
      '0x28c6c06298d514db089934071355e5743bf21d60',
      '0x9696f59e4d72e237be84ffd425dcad154bf96976',
      '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
      '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
      '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
      '0x4976a4a02f38326660d17bf34b431dc6e2eb2327',
      '0xa344c7ada83113b3b56941f6e85bf2eb425949f3',
      '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
    ],
  },
  SOL: {
    source: coinSwitchSource,
    explorer: 'https://solscan.io/account/',
    addresses: ['GwJSaDzMcQgvLMXzt1a8vrBFCbgEhGm5wUq8pNi6zbAy'],
  },
}

export function monitoringExampleAddress(chain: string, seed: number): string {
  const addresses = monitoringAddressExamples[chain]?.addresses
  if (!addresses?.length) throw new Error(`Missing public address examples for ${chain}`)
  return addresses[(seed >>> 0) % addresses.length]!
}
