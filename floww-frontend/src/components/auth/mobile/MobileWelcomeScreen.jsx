import MobileWelcomeBrand from './MobileWelcomeBrand'
import WelcomeActions from './WelcomeActions'
import LandscapeCard from '../desktop/LandscapeCard'
import PromoAssetLogos from '../desktop/PromoAssetLogos'
import PromoPaymentLogos from '../desktop/PromoPaymentLogos'
import PromoCopy from '../desktop/PromoCopy'

export default function MobileWelcomeScreen({ onLogin, onSignup }) {
  return <LandscapeCard><div className="promo-assets" aria-label="Supported cryptocurrencies"><PromoAssetLogos /><PromoPaymentLogos /></div><MobileWelcomeBrand /><PromoCopy><WelcomeActions onLogin={onLogin} onSignup={onSignup} /></PromoCopy></LandscapeCard>
}
