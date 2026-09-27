import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const publicPages = {
  '/': {
    title: 'ArdNet | Farm-to-Market Prices in the Philippines',
    description: "Compare Philippine farm produce listings, local reference prices, and weather information with ArdNet's farmer-first market platform."
  },
  '/listings': {
    title: 'Browse Produce Listings | ArdNet',
    description: 'Browse and search agricultural produce listings from farmers in the Philippines on ArdNet.'
  },
  '/market': {
    title: 'Philippine Farm Market Prices | ArdNet',
    description: 'View agricultural reference prices by produce, location, unit, date, and source on ArdNet.'
  },
  '/weather': {
    title: 'Local Weather for Farmers | ArdNet',
    description: 'Check local weather information to support farm planning and produce-market decisions with ArdNet.'
  },
  '/alerts': {
    title: 'Farm Produce Price Alerts | ArdNet',
    description: 'Set produce price conditions and follow market changes with ArdNet price alerts.'
  }
};

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }

  element.setAttribute('content', content);
}

export default function SearchMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = publicPages[pathname];
    const title = page?.title ?? 'ArdNet';
    const description = page?.description ?? 'ArdNet is a farm-to-market price exchange for Philippine farmers and produce buyers.';
    const robots = page ? 'index, follow' : 'noindex, nofollow';
    const canonicalUrl = `${window.location.origin}${pathname}`;

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', robots);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;
  }, [pathname]);

  return null;
}
