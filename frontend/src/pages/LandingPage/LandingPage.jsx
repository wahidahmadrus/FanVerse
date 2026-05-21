import CTASection from '../../sections/CTASection/CTASection.jsx'
import FeaturesSection from '../../sections/FeaturesSection/FeaturesSection.jsx'
import HeroSection from '../../sections/HeroSection/HeroSection.jsx'
import HowItWorksSection from '../../sections/HowItWorksSection/HowItWorksSection.jsx'
import WhyItMattersSection from '../../sections/WhyItMattersSection/WhyItMattersSection.jsx'
import { mockMemories } from '../../data/memories.js'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="page-shell landing-page">
      <HeroSection memories={mockMemories} />
      <HowItWorksSection />
      <WhyItMattersSection />
      <FeaturesSection />
      <CTASection />
    </div>
  )
}

export default LandingPage
