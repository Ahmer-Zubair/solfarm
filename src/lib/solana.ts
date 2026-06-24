import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { IDL } from './idl'

// Replace with your deployed program ID after `anchor deploy`
export const PROGRAM_ID = new PublicKey(
  '11111111111111111111111111111111'
)

export const CHUNK_SIZE = 16
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function mockSignature(): string {
  return Array.from({ length: 88 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function delay(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

export function getChunkCoords(worldX: number, worldY: number) {
  return {
    chunkX: Math.floor(worldX / CHUNK_SIZE),
    chunkY: Math.floor(worldY / CHUNK_SIZE),
    localX: ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    localY: ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  }
}

export async function getBlockPDA(
  x: number,
  y: number,
  chunkX: number,
  chunkY: number
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('block'),
      Buffer.from(new Int32Array([x]).buffer),
      Buffer.from(new Int32Array([y]).buffer),
      Buffer.from(new Int32Array([chunkX]).buffer),
      Buffer.from(new Int32Array([chunkY]).buffer),
    ],
    PROGRAM_ID
  )
}

export function getProgram(provider: AnchorProvider): Program {
  return new Program(IDL as any, PROGRAM_ID, provider)
}

export async function txPlaceBlock(
  provider: AnchorProvider | null,
  worldX: number,
  worldY: number,
  blockType: number
): Promise<string> {
  if (!provider?.wallet?.publicKey) {
    await delay(220)
    return mockSignature()
  }

  const program = getProgram(provider)
  const { chunkX, chunkY, localX, localY } = getChunkCoords(worldX, worldY)
  const [blockPDA] = await getBlockPDA(localX, localY, chunkX, chunkY)

  const tx = await program.methods
    .placeBlock(localX, localY, chunkX, chunkY, blockType)
    .accounts({
      blockAccount: blockPDA,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: 'confirmed' })

  return tx
}

export async function txMineBlock(
  provider: AnchorProvider | null,
  worldX: number,
  worldY: number
): Promise<string> {
  if (!provider?.wallet?.publicKey) {
    await delay(180)
    return mockSignature()
  }

  const program = getProgram(provider)
  const { chunkX, chunkY, localX, localY } = getChunkCoords(worldX, worldY)
  const [blockPDA] = await getBlockPDA(localX, localY, chunkX, chunkY)

  const tx = await program.methods
    .mineBlock(localX, localY, chunkX, chunkY)
    .accounts({
      blockAccount: blockPDA,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: 'confirmed' })

  return tx
}

export async function txMintBlockNFT(
  provider: AnchorProvider | null,
  worldX: number,
  worldY: number
): Promise<string> {
  if (!provider?.wallet?.publicKey) {
    await delay(340)
    return mockSignature()
  }

  const program = getProgram(provider)
  const { chunkX, chunkY, localX, localY } = getChunkCoords(worldX, worldY)
  const [blockPDA] = await getBlockPDA(localX, localY, chunkX, chunkY)
  const mintKeypair = web3.Keypair.generate()

  const [tokenAccountPDA] = PublicKey.findProgramAddressSync(
    [
      provider.wallet.publicKey.toBuffer(),
      Buffer.from('token'),
      mintKeypair.publicKey.toBuffer(),
    ],
    PROGRAM_ID
  )

  const tx = await program.methods
    .mintBlockNft(localX, localY, chunkX, chunkY)
    .accounts({
      blockAccount: blockPDA,
      mint: mintKeypair.publicKey,
      tokenAccount: tokenAccountPDA,
      player: provider.wallet.publicKey,
      tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      systemProgram: SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([mintKeypair])
    .rpc({ commitment: 'confirmed' })

  return tx
}

export async function fetchChainBlock(
  connection: Connection,
  worldX: number,
  worldY: number
): Promise<{ owner: string; blockType: number; isMinted: boolean } | null> {
  try {
    const provider = new AnchorProvider(
      connection,
      { publicKey: PublicKey.default } as unknown as AnchorProvider['wallet'],
      {}
    )
    const program = getProgram(provider)
    const { chunkX, chunkY, localX, localY } = getChunkCoords(worldX, worldY)
    const [blockPDA] = await getBlockPDA(localX, localY, chunkX, chunkY)
    const account = await (program.account as unknown as {
      blockAccount: { fetch: (pda: PublicKey) => Promise<{
        owner: PublicKey
        blockType: number
        isMinted: boolean
      }> }
    }).blockAccount.fetch(blockPDA)
    return {
      owner: account.owner.toBase58(),
      blockType: account.blockType,
      isMinted: account.isMinted,
    }
  } catch {
    return null
  }
}

export function shortKey(key: string | PublicKey): string {
  const value = typeof key === 'string' ? key : key.toBase58()
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

export function lamportsToSol(lamports: number): string {
  return (lamports / 1e9).toFixed(4)
}
