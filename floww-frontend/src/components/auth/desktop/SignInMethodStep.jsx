import { WalletIcon, EmailIcon } from '../../shared/icons/AnimatedIcons'
import DiagonalArrow from '../shared/DiagonalArrow'

function IconBox({ children }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[#B3B3B3] transition-colors group-hover:text-black group-active:text-black">{children}</span>
}

function WalletOption({ intent, onChoose }) {
  return <button onClick={() => onChoose('wallet')} className="group relative flex w-full items-center gap-4 rounded-xl border border-white bg-white/75 p-3.5 pr-10 text-left shadow-sm backdrop-blur-md transition-all hover:border-[#F0F0F0] hover:bg-[#FBFBFB] hover:shadow-md active:bg-[#F7F7F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8D8D8]"><IconBox><WalletIcon className="h-5 w-5" /></IconBox><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{intent === 'signup' ? 'Create an account with Wallet' : 'Log in with Wallet'}</span><span className="mt-1 block text-xs text-slate-500">MetaMask · WalletConnect</span></span><DiagonalArrow /></button>
}

function EmailOption({ intent, onChoose }) {
  return <button onClick={() => onChoose('email')} className="group relative flex w-full items-center gap-4 rounded-xl border border-white bg-white/75 p-3.5 pr-10 text-left shadow-sm backdrop-blur-md transition-all hover:border-[#F0F0F0] hover:bg-[#FBFBFB] hover:shadow-md active:bg-[#F7F7F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D8D8D8]"><IconBox><EmailIcon className="h-5 w-5" /></IconBox><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{intent === 'signup' ? 'Create an account with Email' : 'Log in with Email'}</span><span className="mt-1 block text-xs text-slate-500">One-time email verification code</span></span><DiagonalArrow /></button>
}

export default function SignInMethodStep({ intent, onChoose, onToggleIntent }) {
  return <>
    <div><h2 className="text-[34px] font-semibold tracking-tight md:text-4xl">{intent === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p className="mt-2 mb-3 text-sm leading-6 text-slate-500 md:mt-3 md:mb-0">{intent === 'signup' ? 'Choose how you’d like to sign up.' : 'Choose your sign-in method.'}</p></div>
    <div className="space-y-2.5 md:mt-8"><WalletOption intent={intent} onChoose={onChoose} /><EmailOption intent={intent} onChoose={onChoose} /></div>
    <button type="button" onClick={onToggleIntent} className="mt-4 block w-full bg-transparent text-center text-xs text-slate-500 transition-colors hover:text-black">{intent === 'signup' ? <>Already have an account? <strong className="font-semibold text-black">Log in</strong></> : <>New to Floww? <strong className="font-semibold text-black">Sign up</strong></>}</button>
    <p className="mt-3 text-center text-xs leading-5 text-slate-400 md:mt-5">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
  </>
}
