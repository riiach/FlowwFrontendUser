export default function MobileAuthBackgroundCard({ children, className = '', ...props }) {
  return <section className={`mobile-auth-screen ${className}`.trim()} {...props}>{children}</section>
}
