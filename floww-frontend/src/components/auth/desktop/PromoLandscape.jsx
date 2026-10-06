import LandscapeCard from './LandscapeCard'
import PromoAssetLogos from './PromoAssetLogos'
import PromoPaymentLogos from './PromoPaymentLogos'
import PromoCopy from './PromoCopy'

export default function PromoLandscape() {
  return <aside className="order-2 flex min-h-0 items-center pr-0 md:order-1"><LandscapeCard><div className="promo-assets" aria-label="Supported cryptocurrencies"><PromoAssetLogos /><PromoPaymentLogos /></div><PromoCopy /></LandscapeCard></aside>
}
