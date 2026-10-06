export default function GlassButton({ children, className = '', ...props }) {
  return <button className={`glass-btn ${className}`.trim()} {...props}>{children}</button>
}
