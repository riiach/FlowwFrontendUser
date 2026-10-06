import VerificationCompleteCard from '../shared/VerificationCompleteCard'

export default function ConfirmationStep({ detail, onContinue, onRestart }) {
  return <><h2 className="text-3xl font-semibold tracking-tight">You’re all set</h2><p className="mt-2 text-sm leading-6 text-slate-500">Your session is verified. You can now continue to Floww.</p><VerificationCompleteCard detail={detail} /><button onClick={onContinue} className="mt-6 h-12 w-full rounded-xl bg-[#3A3A3A] text-sm font-medium text-white shadow-lg transition-all duration-700 hover:bg-[#5C5C5C]">Continue to Floww</button><button onClick={onRestart} className="mt-3 h-11 w-full rounded-xl text-sm font-medium text-slate-500 transition-all hover:bg-[#FBFBFB]">Sign in another way</button></>
}
