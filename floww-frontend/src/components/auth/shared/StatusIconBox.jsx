export default function StatusIconBox({ children, className = '' }) {
  return <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E8E8E8] bg-white text-black ${className}`}>{children}</span>
}
