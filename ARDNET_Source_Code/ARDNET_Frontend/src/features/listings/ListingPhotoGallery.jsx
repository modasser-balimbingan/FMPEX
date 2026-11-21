import { useEffect, useState } from 'react';
import { getListingPhotoUrls } from './photoUtils';
import ListingIcon from './ListingIcon';

/** A single clear image at a time — no horizontal scrollbar or cropping. */
export default function ListingPhotoGallery({ photos, produce, variant = 'card', onOpen }) {
  const urls = getListingPhotoUrls(photos);
  const fingerprint = urls.join('|');
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    setActiveIndex(0);
    setFailed([]);
  }, [fingerprint]);

  const available = urls.filter((url) => !failed.includes(url));
  const safeIndex = available.length ? activeIndex % available.length : 0;
  const activeUrl = available[safeIndex];
  const isDetail = variant === 'detail';

  function changePhoto(direction) {
    setActiveIndex((index) => (index + direction + available.length) % available.length);
  }

  return (
    <div className={`produce-photo produce-photo--${variant}`}>
      <div className="produce-photo__stage">
        {activeUrl ? (
          isDetail ? (
            <a href={activeUrl} target="_blank" rel="noopener noreferrer"
              className="produce-photo__open" title="Open full-size image in a new tab">
              <img src={activeUrl} alt={`${produce || 'Produce'} — image ${safeIndex + 1}`}
                onError={() => setFailed((previous) => [...new Set([...previous, activeUrl])])} />
              <span className="produce-photo__expand"><ListingIcon name="expand" size={16} /> View full image</span>
            </a>
          ) : onOpen ? (
            <button type="button" className="produce-photo__open-card" onClick={onOpen} aria-label={`View ${produce || 'produce'} listing details`}><img src={activeUrl} alt={`${produce || 'Produce'} — image ${safeIndex + 1}`} loading="lazy" onError={() => setFailed(previous => [...new Set([...previous, activeUrl])])} /></button>
          ) : (
            <img src={activeUrl} alt={`${produce || 'Produce'} — image ${safeIndex + 1}`}
              loading="lazy"
              onError={() => setFailed((previous) => [...new Set([...previous, activeUrl])])} />
          )
        ) : (
          <div className="produce-photo__empty">
            <span className="produce-photo__empty-icon"><ListingIcon name="camera" size={28}/></span>
            <span>Photo not available</span>
          </div>
        )}

        {available.length > 1 && (
          <>
            <button type="button" className="produce-photo__nav produce-photo__nav--prev"
              onClick={() => changePhoto(-1)} aria-label="Previous produce photo">
              <ListingIcon name="left" size={18} />
            </button>
            <button type="button" className="produce-photo__nav produce-photo__nav--next"
              onClick={() => changePhoto(1)} aria-label="Next produce photo">
              <ListingIcon name="right" size={18} />
            </button>
            <span className="produce-photo__count">{safeIndex + 1} / {available.length}</span>
          </>
        )}
      </div>
      {isDetail && available.length > 1 && (
        <div className="produce-photo__thumbnails" aria-label="Produce photo thumbnails">
          {available.map((url, index) => (
            <button key={url} type="button" className={`produce-photo__thumb ${index === safeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(index)} aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === safeIndex}>
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {isDetail && available.length > 0 && <p className="produce-photo__caption">{available.length} photo{available.length === 1 ? '' : 's'} · Select the image to view full size</p>}
    </div>
  );
}
