// src/components/admin/case/PropertyImagesTab.jsx
import { useRef, useState } from 'react'
import { useCaseContext } from '../../../context/CaseContext'
import { casesService } from '../../../api/dataService'
import { Image as ImageIcon, Sparkles, Upload, Eye, Trash2, Plus, Loader2, Check, X } from 'lucide-react'

const AI_SUGGESTED_IMAGES = [
    { url: 'https://picsum.photos/seed/prop-front/400/300', label: 'Front Exterior' },
    { url: 'https://picsum.photos/seed/prop-living/400/300', label: 'Living Room' },
    { url: 'https://picsum.photos/seed/prop-kitchen/400/300', label: 'Kitchen' },
    { url: 'https://picsum.photos/seed/prop-bedroom/400/300', label: 'Bedroom' },
    { url: 'https://picsum.photos/seed/prop-backyard/400/300', label: 'Backyard' },
    { url: 'https://picsum.photos/seed/prop-bathroom/400/300', label: 'Bathroom' },
]

export default function PropertyImagesTab() {
    const { caseData, updateCase } = useCaseContext()
    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [showAiPanel, setShowAiPanel] = useState(false)
    const [selectedAiImages, setSelectedAiImages] = useState([])

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length || !caseData?._id) return
        setUploading(true)
        const uploaded = []
        for (const file of files) {
            const res = await casesService.uploadCaseImage(caseData._id, file)
            if (res.success) {
                const url = res.data?.url || res.data?.image_url || res.data
                if (url) uploaded.push({ url: typeof url === 'string' ? url : String(url) })
            }
        }
        if (uploaded.length) {
            updateCase({ images: [...(caseData.images || []), ...uploaded] })
        }
        setUploading(false)
        e.target.value = ''
    }

    const toggleAiImage = (url) => {
        setSelectedAiImages(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        )
    }

    const addSelectedImages = () => {
        const newImages = selectedAiImages
            .filter(url => !caseData.images.some(img => img.url === url))
            .map(url => ({ url }))
        if (newImages.length) {
            updateCase({ images: [...(caseData.images || []), ...newImages] })
        }
        setSelectedAiImages([])
        setShowAiPanel(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Property Gallery</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Upload or manage property photos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowAiPanel(p => !p); setSelectedAiImages([]) }}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                            showAiPanel
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Suggest
                    </button>
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors cursor-pointer">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            </div>

            {/* AI Suggest Panel */}
            {showAiPanel && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <p className="text-sm font-semibold text-indigo-900">AI Suggested Images</p>
                        </div>
                        <button onClick={() => { setShowAiPanel(false); setSelectedAiImages([]) }} className="text-indigo-400 hover:text-indigo-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-indigo-600">Select images to add to the property gallery</p>
                    <div className="grid grid-cols-3 gap-2">
                        {AI_SUGGESTED_IMAGES.map((img) => {
                            const isSelected = selectedAiImages.includes(img.url)
                            const isAdded = caseData.images.some(i => i.url === img.url)
                            return (
                                <button
                                    key={img.url}
                                    onClick={() => !isAdded && toggleAiImage(img.url)}
                                    disabled={isAdded}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                        isAdded ? 'opacity-40 cursor-default border-gray-200' :
                                        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent hover:border-indigo-300'
                                    }`}
                                >
                                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                                        <span className="text-[10px] text-white font-medium">{img.label}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    {isAdded && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    {selectedAiImages.length > 0 && (
                        <button
                            onClick={addSelectedImages}
                            className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Add {selectedAiImages.length} Image{selectedAiImages.length > 1 ? 's' : ''} to Gallery
                        </button>
                    )}
                </div>
            )}

            {caseData.images.length === 0 ? (
                <label className="h-48 bg-white border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/20 transition-colors cursor-pointer">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-sm font-medium text-gray-500">No images uploaded yet</p>
                    <p className="text-xs text-gray-400">Click to upload property photos</p>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
                </label>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Upload slot */}
                    <label className="aspect-video bg-gray-50 border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                        <Plus className="w-5 h-5" />
                        <span className="text-xs font-medium">Add Photo</span>
                        <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
                    </label>

                    {caseData.images.map((img, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group border border-gray-200">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={img.url} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                                    <Eye className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => updateCase({ images: caseData.images.filter((_, j) => j !== i) })}
                                    className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
