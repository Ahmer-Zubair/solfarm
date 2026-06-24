export type SolfarmIDL = {
  version: '0.1.0'
  name: 'solfarm'
  instructions: [
    {
      name: 'placeBlock'
      accounts: [
        { name: 'blockAccount'; isMut: true; isSigner: false },
        { name: 'player'; isMut: true; isSigner: true },
        { name: 'systemProgram'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'x'; type: 'i32' },
        { name: 'y'; type: 'i32' },
        { name: 'chunkX'; type: 'i32' },
        { name: 'chunkY'; type: 'i32' },
        { name: 'blockType'; type: 'u8' }
      ]
    },
    {
      name: 'mineBlock'
      accounts: [
        { name: 'blockAccount'; isMut: true; isSigner: false },
        { name: 'player'; isMut: true; isSigner: true },
        { name: 'systemProgram'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'x'; type: 'i32' },
        { name: 'y'; type: 'i32' },
        { name: 'chunkX'; type: 'i32' },
        { name: 'chunkY'; type: 'i32' }
      ]
    },
    {
      name: 'mintBlockNft'
      accounts: [
        { name: 'blockAccount'; isMut: true; isSigner: false },
        { name: 'mint'; isMut: true; isSigner: true },
        { name: 'tokenAccount'; isMut: true; isSigner: false },
        { name: 'player'; isMut: true; isSigner: true },
        { name: 'tokenProgram'; isMut: false; isSigner: false },
        { name: 'systemProgram'; isMut: false; isSigner: false },
        { name: 'rent'; isMut: false; isSigner: false }
      ]
      args: [
        { name: 'x'; type: 'i32' },
        { name: 'y'; type: 'i32' },
        { name: 'chunkX'; type: 'i32' },
        { name: 'chunkY'; type: 'i32' }
      ]
    }
  ]
  accounts: [
    {
      name: 'BlockAccount'
      type: {
        kind: 'struct'
        fields: [
          { name: 'owner'; type: 'publicKey' },
          { name: 'x'; type: 'i32' },
          { name: 'y'; type: 'i32' },
          { name: 'chunkX'; type: 'i32' },
          { name: 'chunkY'; type: 'i32' },
          { name: 'blockType'; type: 'u8' },
          { name: 'placedAt'; type: 'i64' },
          { name: 'isMinted'; type: 'bool' },
          { name: 'mintAddress'; type: { option: 'publicKey' } }
        ]
      }
    }
  ]
  errors: [
    { code: 6000; name: 'BlockOccupied'; msg: 'Block position is already occupied' },
    { code: 6001; name: 'BlockEmpty'; msg: 'No block at this position' },
    { code: 6002; name: 'NotOwner'; msg: 'You do not own this block' },
    { code: 6003; name: 'AlreadyMinted'; msg: 'This block is already minted as an NFT' }
  ]
}

export const IDL: SolfarmIDL = {
  version: '0.1.0',
  name: 'solfarm',
  instructions: [
    {
      name: 'placeBlock',
      accounts: [
        { name: 'blockAccount', isMut: true, isSigner: false },
        { name: 'player', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: [
        { name: 'x', type: 'i32' },
        { name: 'y', type: 'i32' },
        { name: 'chunkX', type: 'i32' },
        { name: 'chunkY', type: 'i32' },
        { name: 'blockType', type: 'u8' }
      ]
    },
    {
      name: 'mineBlock',
      accounts: [
        { name: 'blockAccount', isMut: true, isSigner: false },
        { name: 'player', isMut: true, isSigner: true },
        { name: 'systemProgram', isMut: false, isSigner: false }
      ],
      args: [
        { name: 'x', type: 'i32' },
        { name: 'y', type: 'i32' },
        { name: 'chunkX', type: 'i32' },
        { name: 'chunkY', type: 'i32' }
      ]
    },
    {
      name: 'mintBlockNft',
      accounts: [
        { name: 'blockAccount', isMut: true, isSigner: false },
        { name: 'mint', isMut: true, isSigner: true },
        { name: 'tokenAccount', isMut: true, isSigner: false },
        { name: 'player', isMut: true, isSigner: true },
        { name: 'tokenProgram', isMut: false, isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
        { name: 'rent', isMut: false, isSigner: false }
      ],
      args: [
        { name: 'x', type: 'i32' },
        { name: 'y', type: 'i32' },
        { name: 'chunkX', type: 'i32' },
        { name: 'chunkY', type: 'i32' }
      ]
    }
  ],
  accounts: [
    {
      name: 'BlockAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'owner', type: 'publicKey' },
          { name: 'x', type: 'i32' },
          { name: 'y', type: 'i32' },
          { name: 'chunkX', type: 'i32' },
          { name: 'chunkY', type: 'i32' },
          { name: 'blockType', type: 'u8' },
          { name: 'placedAt', type: 'i64' },
          { name: 'isMinted', type: 'bool' },
          { name: 'mintAddress', type: { option: 'publicKey' } }
        ]
      }
    }
  ],
  errors: [
    { code: 6000, name: 'BlockOccupied', msg: 'Block position is already occupied' },
    { code: 6001, name: 'BlockEmpty', msg: 'No block at this position' },
    { code: 6002, name: 'NotOwner', msg: 'You do not own this block' },
    { code: 6003, name: 'AlreadyMinted', msg: 'This block is already minted as an NFT' }
  ]
}

