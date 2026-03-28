export default function HeroSection({
  urgencyBadge,
  address,
  location,
  heroImage,
  thumbnails = [],
  propertyValue,
  outstandingDebt,
  expectedReturn,
}) {
  const formatK = (n) => (n != null ? `$${Math.round(Number(n) / 1000)}k` : '—')
  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden mb-8">
      {heroImage ? (
        <img
          src={heroImage}
          alt="Property"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1d2375] to-[#2d3a9a]" />
      )}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-8">
        <div>
          {urgencyBadge && (
            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded mb-4">
              {urgencyBadge}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{address || '—'}</h1>
          <div className="flex items-center text-white text-base md:text-lg">
            <span className="mr-2">📍</span>
            <span>{location || '—'}</span>
          </div>
          {thumbnails.length > 0 && (
            <div className="flex space-x-2 mt-4">
              {thumbnails.slice(0, 3).map((img, index) => (
                <div key={index} className="w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden border-2 border-white/50">
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-slate-600 mb-1">Property Value</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{formatK(propertyValue)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-slate-600 mb-1">Outstanding Debt</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{formatK(outstandingDebt)}</p>
          </div>
          <div className="bg-emerald-500 rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-white mb-1">Expected Return</p>
            <p className="text-xl md:text-2xl font-bold text-white">
              {expectedReturn != null ? `${expectedReturn}%` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
