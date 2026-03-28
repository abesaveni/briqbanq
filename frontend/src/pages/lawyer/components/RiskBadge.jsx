/** Figma: Low #00C853, Medium #FFCC00, High #FF8C00 */
const STYLES = {
  'lowrisk': 'bg-[#E8F5E9] text-emerald-500',
  'mediumrisk': 'bg-[#FFF8E1] text-[#F9A825]',
  'highrisk': 'bg-[#FFE0B2] text-[#FF8C00]',
}

export default function RiskBadge({ risk }) {
  const key = String(risk || '').toLowerCase().replace(/\s+/g, '')
  const className = STYLES[key] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {risk}
    </span>
  )
}
