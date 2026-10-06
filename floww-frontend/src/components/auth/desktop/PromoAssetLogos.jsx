const assets = [['Bitcoin', '/crypto-assets/bitcoin.svg'], ['Ethereum', '/crypto-assets/ethereum.svg'], ['Solana', '/crypto-assets/solana.svg'], ['USDC', '/crypto-assets/usdc-white.svg']]

export default function PromoAssetLogos() {
  return <div className="promo-assets-row">{assets.map(([name, src]) => <span key={name}><img src={src} alt="" /><strong>{name}</strong></span>)}</div>
}
