import { useState, useEffect } from 'react'
import PageHeader from './integration-architecture/PageHeader'
import TopInfoBoxes from './integration-architecture/TopInfoBoxes'
import PlatformArchitecture from './integration-architecture/PlatformArchitecture'
import CoreModules from './integration-architecture/CoreModules'
import SpecializedModules from './integration-architecture/SpecializedModules'
import PricingModel from './integration-architecture/PricingModel'
import TechnicalImplementation from './integration-architecture/TechnicalImplementation'
import RealWorldExample from './integration-architecture/RealWorldExample'
import ImplementationRoadmap from './integration-architecture/ImplementationRoadmap'
import CompatibilityMatrix from './integration-architecture/CompatibilityMatrix'
import OperatorRecommendations from './integration-architecture/OperatorRecommendations'

export default function IntegrationArchitecture() {
  const [integrationData] = useState({})
  const [loading] = useState(false)
  const [error] = useState(null)

  useEffect(() => {
    // In production, fetch integration data from API
    // fetchIntegrationData().then(setIntegrationData).catch(setError)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const hasData =
    integrationData?.coreModules?.length > 0 ||
    integrationData?.specializedModules?.length > 0

  if (!hasData) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔌</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Integrations Available</h3>
          <p className="text-sm text-slate-600">Integration data is currently unavailable.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-0">
      <PageHeader />

      <TopInfoBoxes />

      <PlatformArchitecture />

      <CoreModules modules={integrationData.coreModules} />

      <SpecializedModules modules={integrationData.specializedModules} />

      <PricingModel
        pricing={integrationData.pricingTiers}
        coreModules={integrationData.coreModules}
      />

      <TechnicalImplementation />

      <RealWorldExample />

      <ImplementationRoadmap phases={integrationData.implementationPhases} />

      <CompatibilityMatrix
        matrix={integrationData.compatibilityMatrix}
        specializedModules={integrationData.specializedModules}
      />

      <OperatorRecommendations recommendations={integrationData.recommendations} />
    </div>
  )
}
