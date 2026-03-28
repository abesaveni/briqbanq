export default function PropertyGallery({ images = [] }) {
  if (images.length === 0) return null
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Gallery</h2>
      <div className="grid grid-cols-2 gap-4">
        {images.slice(0, 4).map((image, index) => (
          <div key={index} className="rounded-lg overflow-hidden h-48 md:h-64">
            <img
              src={image}
              alt={`Property view ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
