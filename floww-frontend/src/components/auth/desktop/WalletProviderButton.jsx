import DiagonalArrow from '../shared/DiagonalArrow'
import WalletProviderIcon from '../shared/WalletProviderIcon'

export default function WalletProviderButton({ provider, description, onClick }) {
  return <button onClick={onClick} className="group relative flex w-full items-center gap-3 rounded-xl border border-[#EEEEEE] bg-white/75 p-3.5 text-left shadow-sm backdrop-blur-md transition-all hover:border-[#E3E3E3] hover:bg-[#FBFBFB] hover:shadow-md"><WalletProviderIcon provider={provider} className="h-6 w-6 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{provider}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><DiagonalArrow /></button>
}
