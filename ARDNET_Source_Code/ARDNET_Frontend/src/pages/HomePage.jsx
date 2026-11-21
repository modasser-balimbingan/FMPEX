import { Link } from 'react-router-dom';
import PriceTable from '../components/ui/PriceTable';
import ListingIcon from '../features/listings/ListingIcon';
import { DEMO_PRICES } from '../utils/constants';

const features = [
  { icon: 'leaf', title: 'Discover local produce', description: 'Find available produce from local farmers, with the details you need.', to: '/listings', link: 'Explore listings' },
  { icon: 'package', title: 'Know the market', description: 'Compare reference prices by produce, location, unit, and source.', to: '/market', link: 'View market prices' },
  { icon: 'calendar', title: 'Plan with the weather', description: 'Check local conditions and forecasts before your next farm activity.', to: '/weather', link: 'Check the forecast' },
  { icon: 'check', title: 'Follow your price targets', description: 'Create a price alert and keep track of market changes in Region IX.', to: '/alerts', link: 'Explore price alerts' },
];

const frequentlyAskedQuestions = [
  { question: 'What is ArdNet?', answer: 'ArdNet brings local produce listings, market reference prices, weather information, and price alerts into one place for Philippine farmers, buyers, and vendors.' },
  { question: 'Do I need an account to browse?', answer: 'You can browse produce, market prices, and weather without signing in. Create an account to save listings, join listing discussions, and manage your own price alerts.' },
  { question: 'Are the market prices final selling prices?', answer: 'No. Market prices are reference information. Check each record’s unit, location, date, and source for context. Farmers set their own asking prices, which may differ from these references.' },
  { question: 'How can I list my produce?', answer: 'Register as a farmer and verify your email. After signing in, open My Listings in your dashboard to create a listing with your produce details, quantity, location, asking price, and photos.' },
  { question: 'How do price alerts work?', answer: 'Sign in and set a produce name, unit, target price, and comparison. Alerts currently monitor Region IX. When matching reference prices are evaluated, ArdNet can send a combined market summary through your notifications and email.' },
  { question: 'How do I ask a farmer about a listing?', answer: 'Open a produce listing’s details to see its questions and replies. Sign in as a farmer or buyer/vendor to leave a comment or reply on an active listing.' },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__copy">
            <span className="landing-eyebrow"><ListingIcon name="leaf" size={15} /> CONNECTING FARMS & MARKETS</span>
            <h1 id="landing-title">Better market insight.<br /><span>Better farm decisions.</span></h1>
            <p className="landing-hero__description">Local produce, reference prices, and weather updates. Everything you need to make your next selling decision, in one place.</p>
            <div className="landing-actions">
              <Link className="landing-button landing-button--primary" to="/listings">Browse produce <ListingIcon name="arrowRight" size={17} /></Link>
              <Link className="landing-button landing-button--secondary" to="/market">View market prices</Link>
            </div>
            <p className="landing-hero__note"><ListingIcon name="check" size={16} /> Built for Philippine farmers, buyers, and vendors</p>
          </div>

          <div className="landing-snapshot-wrap">
            <div className="landing-snapshot">
              <div className="landing-snapshot__heading">
                <div><span className="landing-kicker">A LITTLE MARKET CLARITY</span><h2>Your next decision starts here.</h2></div>
                <span className="landing-snapshot__symbol"><ListingIcon name="leaf" size={24} /></span>
              </div>
              <div className="landing-snapshot__label"><span>Reference price snapshot</span><span className="landing-sample-label">Sample preview</span></div>
              <div className="landing-snapshot__prices">
                {DEMO_PRICES.slice(0, 3).map((item, index) => (
                  <div className="landing-snapshot__row" key={item.produce}>
                    <span className={`landing-crop landing-crop--${index}`}><ListingIcon name={index === 2 ? 'package' : 'leaf'} size={21} /></span>
                    <div className="landing-snapshot__produce"><strong>{item.produce}</strong><span>{item.location}</span></div>
                    <div className="landing-snapshot__price"><strong>₱{item.price.toFixed(2)}</strong><span>per {item.unit}</span></div>
                  </div>
                ))}
              </div>
              <p className="landing-snapshot__disclaimer">Illustrative prices only. Explore market records for available dates and sources.</p>
              <Link className="landing-snapshot__link" to="/market">Explore market records <ListingIcon name="arrowRight" size={16} /></Link>
            </div>
            <div className="landing-snapshot-caption"><span aria-hidden="true" /> More context. More confident decisions.</div>
          </div>
        </div>
      </section>

      <section className="landing-features landing-container" aria-labelledby="landing-features-title">
        <div className="landing-section-heading">
          <div><p className="landing-kicker">MADE FOR YOUR EVERYDAY</p><h2 id="landing-features-title">A simpler way to stay informed.</h2></div>
          <p>From checking prices to finding produce,<br className="landing-desktop-break" /> take your next step with useful local information.</p>
        </div>
        <div className="landing-features__grid">
          {features.map((feature) => (
            <Link className="landing-feature" to={feature.to} key={feature.title}>
              <span className="landing-feature__icon"><ListingIcon name={feature.icon} size={23} /></span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="landing-feature__link">{feature.link}<ListingIcon name="arrowRight" size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-market" aria-labelledby="landing-market-title">
        <div className="landing-container">
          <div className="landing-section-heading">
            <div><p className="landing-kicker">INFORMATION YOU CAN USE</p><h2 id="landing-market-title">Keep an eye on the market.</h2><p>Reference prices to guide your decisions. Your selling price stays yours.</p></div>
            <Link className="landing-text-link" to="/market">View all market records <ListingIcon name="arrowRight" size={17} /></Link>
          </div>
          <PriceTable compact />
        </div>
      </section>

      <section className="landing-container landing-faq" aria-labelledby="landing-faq-title">
        <div className="landing-faq__intro">
          <p className="landing-kicker">A LITTLE MORE ABOUT ARDNET</p>
          <h2 id="landing-faq-title">Frequently asked questions.</h2>
          <p>A few helpful answers before you explore your local market.</p>
          <Link className="landing-text-link" to="/register">Get started with ArdNet <ListingIcon name="arrowRight" size={17} /></Link>
        </div>
        <div className="landing-faq__questions">
          {frequentlyAskedQuestions.map(({ question, answer }) => (
            <details className="landing-faq__item" key={question}>
              <summary>{question}<span className="landing-faq__toggle" aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-container landing-join" aria-labelledby="landing-join-title">
        <div><p className="landing-kicker">GROW YOUR CONNECTIONS</p><h2 id="landing-join-title">Your local market, a little closer.</h2><p>Join ArdNet to manage listings, save produce, and set your price alerts.</p></div>
        <Link className="landing-button landing-button--light" to="/register">Create an account <ListingIcon name="arrowRight" size={17} /></Link>
      </section>
    </main>
  );
}
