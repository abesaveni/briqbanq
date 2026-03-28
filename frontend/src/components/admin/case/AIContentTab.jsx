// src/components/admin/case/AIContentTab.jsx
import { useState } from 'react'
import { Sparkles, Loader2, Save } from 'lucide-react'

export default function AIContentTab() {
    const [loadingStates, setLoadingStates] = useState({
        marketing: false,
        highlights: false,
        location: false
    })

    const [content, setContent] = useState({
        marketing: '',
        highlights: '',
        location: ''
    })

    const generateAI = (type) => {
        setLoadingStates(prev => ({ ...prev, [type]: true }))

        // Mock simulation
        setTimeout(() => {
            let result = ''
            if (type === 'marketing') result = 'Step into luxury with this stunning penthouse offering breathtaking panoramic views of Sydney Harbour. Featuring impeccably designed open-plan living, private balconies, and proximity to first-class amenities.'
            if (type === 'highlights') result = '• 15% immediate equity buffer\n• Projected 7.2% annual yield\n• Prime metropolitan location\n• Long-term stable tenant potential'
            if (type === 'location') result = 'Potts Point remains one of Sydney\'s most resilient real estate markets, benefiting from limited new supply and sustained demand from high-net-worth professionals.'

            setContent(prev => ({ ...prev, [type]: result }))
            setLoadingStates(prev => ({ ...prev, [type]: false }))
        }, 1500)
    }

    const textareaCls = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors resize-none min-h-[120px]"

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-indigo-900">AI Content Generator</p>
                    <p className="text-xs text-indigo-600">Generate professional marketing copy and investor insights in seconds</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Marketing Description */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-medium text-gray-500">Marketing Description</label>
                        <button
                            onClick={() => generateAI('marketing')}
                            disabled={loadingStates.marketing}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loadingStates.marketing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI Generate
                        </button>
                    </div>
                    <textarea
                        rows={4}
                        value={content.marketing}
                        onChange={(e) => setContent({ ...content, marketing: e.target.value })}
                        placeholder="Focus on the property's unique selling points..."
                        className={textareaCls}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Investment Highlights */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-medium text-gray-500">Investment Highlights</label>
                            <button
                                onClick={() => generateAI('highlights')}
                                disabled={loadingStates.highlights}
                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {loadingStates.highlights ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                AI Generate
                            </button>
                        </div>
                        <textarea
                            rows={5}
                            value={content.highlights}
                            onChange={(e) => setContent({ ...content, highlights: e.target.value })}
                            placeholder="Bullet points for investors..."
                            className={textareaCls}
                        />
                    </div>

                    {/* Location & Market Notes */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-medium text-gray-500">Location &amp; Market Notes</label>
                            <button
                                onClick={() => generateAI('location')}
                                disabled={loadingStates.location}
                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {loadingStates.location ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                AI Generate
                            </button>
                        </div>
                        <textarea
                            rows={5}
                            value={content.location}
                            onChange={(e) => setContent({ ...content, location: e.target.value })}
                            placeholder="Market data and suburb stats..."
                            className={textareaCls}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
