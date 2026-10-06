import StatusIconBox from './StatusIconBox'

function CheckBadge() {
  return <StatusIconBox><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="m5 12 4 4L19 6" /></svg></StatusIconBox>
}

export default function VerificationCompleteCard({ detail }) {
  return <div className="mt-8 rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-5"><div className="flex items-center gap-3"><CheckBadge /><div><p className="text-sm font-semibold">Verification complete</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div></div>
}
