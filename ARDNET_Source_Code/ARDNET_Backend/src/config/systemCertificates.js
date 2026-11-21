const tls = require('node:tls');

let configured = false;

// Keep certificate verification enabled while trusting the OS-managed CAs too.
// This supports Windows networks with a locally installed HTTPS inspection CA.
function configureSystemCertificates() {
  if (configured) return;
  if (typeof tls.getCACertificates === 'function' && typeof tls.setDefaultCACertificates === 'function') {
    const certificates = new Set([
      ...tls.getCACertificates('default'),
      ...tls.getCACertificates('system'),
    ]);
    tls.setDefaultCACertificates([...certificates]);
    configured = true;
  }
}

module.exports = configureSystemCertificates;
