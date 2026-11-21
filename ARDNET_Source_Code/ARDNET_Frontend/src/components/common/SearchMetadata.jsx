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

const privatePageTitles = {
  '/login': 'Sign in | ArdNet',
  '/register': 'Create an account | ArdNet',
  '/admin/login': 'Administrator sign in | ArdNet'
};

const defaultDescription = 'ArdNet is a farm-to-market price exchange for Philippine farmers and produce buyers.';

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }

  element.setAttribute('content', content);
}

function setCanonical(url) {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!url) {
    canonical?.remove();
    return;
  }

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }

  canonical.href = url;
}

export default function SearchMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname === '/' ? pathname : pathname.replace(/\/+$/, '');
    const page = Object.prototype.hasOwnProperty.call(publicPages, normalizedPath)
      ? publicPages[normalizedPath]
      : undefined;
    const title = page?.title ?? privatePageTitles[normalizedPath] ?? 'ArdNet';
    const description = page?.description ?? defaultDescription;
    const robots = page ? 'index, follow' : 'noindex, nofollow';
    const canonicalUrl = page ? new URL(normalizedPath, window.location.origin).href : undefined;

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', robots);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'ArdNet');
    setMeta('property', 'og:locale', 'en_PH');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:card', 'summary');

    setCanonical(canonicalUrl);

    if (canonicalUrl) {
      setMeta('property', 'og:url', canonicalUrl);
    } else {
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }

    const schemaId = 'ardnet-website-schema';
    let schema = document.getElementById(schemaId);

    if (normalizedPath === '/') {
      if (!schema) {
        schema = document.createElement('script');
        schema.id = schemaId;
        schema.type = 'application/ld+json';
        document.head.append(schema);
      }

      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ArdNet',
        url: canonicalUrl,
        description,
        inLanguage: 'en-PH'
      });
    } else {
      schema?.remove();
    }
  }, [pathname]);

  return null;
}
