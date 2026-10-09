import AuthBrand from './AuthBrand'

function BackArrow() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M12.5 4.5 7 10l5.5 5.5M7.5 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default function SignInHeader({ onBack }) {
  return <>
    <button onClick={onBack} className="absolute right-0 top-0 hidden cursor-pointer items-center gap-2 text-sm font-medium text-black md:flex" aria-label="Go back">
      <BackArrow /><span>Go back</span>
    </button>
    <div className="mb-4 flex items-center justify-between md:mb-6">
      <AuthBrand />
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-black md:hidden" aria-label="Go back">
        <BackArrow /><span>Go back</span>
      </button>
    </div>
  </>
}
