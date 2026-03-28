import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useState, useEffect } from "react";
import useCountdown from "../../hooks/useCountdown";
import { BedDouble, Bath, Car, Home, MapPin, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import PropTypes from 'prop-types';

/**
 * AuctionHero: The visual centerpiece of the Auction Room.
 * Features a dynamic carousel, live status, and auction countdown.
 */
export default function AuctionHero({ deal }) {
  const [currentImage, setCurrentImage] = useState("");
  const [imgIndex, setImgIndex] = useState(0);
  const countdown = useCountdown(deal?.auctionEnd);

  // Sync internal state with prop changes
  useEffect(() => {
    if (deal?.images?.length > 0) {
      setCurrentImage(deal.images[0]);
      setImgIndex(0);
    } else if (deal?.image) {
      setCurrentImage(deal.image);
    }
  }, [deal]);

  if (!deal) return null;

  const images = Array.isArray(deal.images) ? deal.images : (deal.image ? [deal.image] : []);

  const handleNext = () => {
    const nextIndex = (imgIndex + 1) % images.length;
    setImgIndex(nextIndex);
    setCurrentImage(images[nextIndex]);
  };

  const handlePrev = () => {
    const prevIndex = (imgIndex - 1 + images.length) % images.length;
    setImgIndex(prevIndex);
    setCurrentImage(images[prevIndex]);
  };

  return (
    <div className="relative group overflow-hidden rounded-3xl shadow-xl">

      {/* Main Large Image */}
      <div className="relative h-[250px] md:h-[350px] lg:h-[450px] w-full">
        <img
          src={currentImage || PROPERTY_PLACEHOLDER}
          className="w-full h-full object-cover"
          alt={deal.title || "Property Main View"}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg transition-all z-10"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg transition-all z-10"
        >
          <ChevronRight size={16} />
        </button>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 md:top-5 md:left-5">
          {deal.status?.toLowerCase() === "sold" ? (
            <div className="bg-slate-900 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              Sold
            </div>
          ) : (["buy now", "active", "buy-now"].includes(deal.status?.toLowerCase())) ? (
            <div className="bg-green-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              Buy Now
            </div>
          ) : (["coming soon", "upcoming", "coming-soon"].includes(deal.status?.toLowerCase())) ? (
            <div className="bg-blue-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              Coming Soon
            </div>
          ) : (["live", "auction", "live auction"].includes(deal.status?.toLowerCase())) ? (
            <div className="bg-red-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs flex items-center gap-1.5 shadow-xl tracking-wide uppercase">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></span>
              Live Auction
            </div>
          ) : (["scheduled", "upcoming"].includes(deal.status?.toLowerCase())) ? (
            <div className="bg-amber-500 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              Auction Scheduled
            </div>
          ) : deal.status?.toLowerCase() === "paused" ? (
            <div className="bg-gray-500 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              Auction Paused
            </div>
          ) : deal.status?.toLowerCase() === "ended" ? (
            <div className="bg-slate-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              Auction Ended
            </div>
          ) : (
            <div className="bg-gray-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[9px] md:text-xs shadow-xl tracking-wide uppercase">
              {deal.status || "Unknown"}
            </div>
          )}
        </div>

        {/* Bottom Left Info Overlay */}
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 right-4 md:right-auto">
          <div className="space-y-0 relative">
            {/* Thumbnails row - hidden on mobile */}
            <div className="hidden md:flex gap-2 mb-3">
              {images.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentImage(img); setImgIndex(i); }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${currentImage === img ? 'border-white scale-105 shadow-xl' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-2xl leading-tight">
                {deal.title}
              </h1>
              <div className="flex items-center gap-1.5 text-white/90 font-bold tracking-tight px-0.5">
                <MapPin size={12} className="text-white" />
                <span className="text-[10px] md:text-xs">{deal.suburb}, {deal.state} {deal.postcode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8 pt-3 px-0.5">
            <Spec icon={<BedDouble size={16} />} label={`${deal.bedrooms || deal.propertyDetails?.bedrooms || 0}`} />
            <Spec icon={<Bath size={16} />} label={`${deal.bathrooms || deal.propertyDetails?.bathrooms || 0}`} />
            <Spec icon={<Car size={16} />} label={`${deal.parking || deal.propertyDetails?.parking || 0}`} />
          </div>
        </div>

        {/* Countdown Box - Only show if Live Auction */}
        {["live", "auction", "live auction"].includes(deal.status?.toLowerCase()) && (
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-red-700/90 backdrop-blur-md px-3 py-2 md:px-5 md:py-4 rounded-xl text-white shadow-2xl border border-white/10 min-w-fit">
            <div className="flex items-center justify-center gap-2 mb-2 border-b border-white/10 pb-2">
              <Clock size={12} className="text-white" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white">Ends In</span>
            </div>

            <div className="flex gap-3 md:gap-4 justify-center">
              <TimeDigit value={countdown.days} label="D" />
              <TimeDigit value={countdown.hours} label="H" />
              <TimeDigit value={countdown.minutes} label="M" />
              <TimeDigit value={countdown.seconds} label="S" />
            </div>
          </div>
        )}

        {/* Scheduled banner - show if auction is scheduled/upcoming */}
        {(["scheduled", "upcoming"].includes(deal.status?.toLowerCase())) && (
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-amber-600/90 backdrop-blur-md px-3 py-2 md:px-5 md:py-4 rounded-xl text-white shadow-2xl border border-white/10 min-w-fit">
            <div className="flex items-center justify-center gap-2 mb-2 border-b border-white/10 pb-2">
              <Clock size={12} className="text-white" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white">Opens In</span>
            </div>
            <div className="flex gap-3 md:gap-4 justify-center">
              <TimeDigit value={countdown.days} label="D" />
              <TimeDigit value={countdown.hours} label="H" />
              <TimeDigit value={countdown.minutes} label="M" />
              <TimeDigit value={countdown.seconds} label="S" />
            </div>
            <p className="text-[8px] font-bold text-white/70 text-center mt-2 uppercase tracking-widest">Bidding opens soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ icon, label }) {
  return (
    <div className="flex items-center gap-2 md:gap-3 text-white">
      <div className="opacity-95">{icon}</div>
      <span className="text-sm md:text-lg font-bold tracking-tight">{label}</span>
    </div>
  );
}

Spec.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired
};

function TimeDigit({ value, label }) {
  return (
    <div className="text-center">
      <div className="bg-black/20 rounded-lg py-1 md:py-2 px-1 text-base md:text-2xl font-black tabular-nums min-w-[35px] md:min-w-[50px] shadow-inner border border-white/5">
        {String(value).padStart(2, '0')}
      </div>
      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest mt-1 md:mt-2 text-white/50">{label}</p>
    </div>
  );
}

TimeDigit.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired
};

AuctionHero.propTypes = {
  deal: PropTypes.shape({
    title: PropTypes.string,
    suburb: PropTypes.string,
    state: PropTypes.string,
    postcode: PropTypes.string,
    type: PropTypes.string,
    auctionEnd: PropTypes.string,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    bedrooms: PropTypes.number,
    bathrooms: PropTypes.number,
    parking: PropTypes.number,
    propertyDetails: PropTypes.object
  })
};


