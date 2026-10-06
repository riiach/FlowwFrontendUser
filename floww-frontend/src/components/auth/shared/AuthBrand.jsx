export default function AuthBrand({ logoSrc = '/floww_logo.png', name = 'Floww', className = '' }) {
  return <div className={`brand-row ${className}`}><img className="brand-mark" src={logoSrc} alt="" /><span>{name}</span></div>
}
