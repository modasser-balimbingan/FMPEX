'use strict';

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const SERVICE_NS = 'urn:ardnet:market-price:v1';
const OPERATIONS = {
  GetRegionalMarketPrices: ['regionCode'],
  GetMarketPricesByProduce: ['regionCode', 'produceName', 'unit'],
  GetLatestMarketPrice: ['regionCode', 'produceName', 'marketName', 'location', 'unit'],
};

class SoapClientError extends Error {
  constructor(message) { super(message); this.name = 'SoapClientError'; this.soapStatus = 400; }
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function qnameParts(name) {
  const match = /^(?:([A-Za-z_][\w.\-]*):)?([A-Za-z_][\w.\-]*)$/.exec(name);
  return match ? { prefix: match[1] || '', local: match[2] } : null;
}

function xmlnsOf(node, prefix) {
  return node?.[prefix ? `@_xmlns:${prefix}` : '@_xmlns'];
}

function elementsOf(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [];
  return Object.keys(node).filter((key) => !key.startsWith('@_') && key !== '#text');
}

function attrCheck(node) {
  for (const key of Object.keys(node || {})) {
    if (key.startsWith('@_') && !key.startsWith('@_xmlns')) {
      throw new SoapClientError('Only XML namespace declarations are permitted');
    }
  }
}

function parseSoapRequest(xml) {
  if (typeof xml !== 'string' || !xml.trim() || Buffer.byteLength(xml, 'utf8') > 16384) {
    throw new SoapClientError('SOAP request is empty or exceeds 16 KB');
  }
  // Reject DTD/ENTITY definitions entirely: we do not need external entities,
  // entity expansion, SOAP headers or XML inclusion to handle read-only queries.
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml) || /<\?xml-stylesheet\b/i.test(xml)) {
    throw new SoapClientError('DTD, ENTITY and XML stylesheets are forbidden');
  }
  // A dedicated XML parser is required. Install: npm install fast-xml-parser@^5.
  // Keep it lazy so pure XML-response and SQL tests can run offline without npm.
  const { XMLParser, XMLValidator } = require('fast-xml-parser');
 
  const check = XMLValidator.validate(xml);

  if (check !== true) {
    console.error('[ARDNET SOAP XML DEBUG]', check.err);
    throw new SoapClientError('Malformed XML document');
  }

  let document;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: false,
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      processEntities: false,
      ignoreDeclaration: true,
      ignorePiTags: true,
    });
    document = parser.parse(xml);
  } catch { throw new SoapClientError('Unable to parse SOAP XML'); }

  const roots = elementsOf(document);
  if (roots.length !== 1) throw new SoapClientError('SOAP document must contain one Envelope');
  const envelopeName = roots[0];
  const envParts = qnameParts(envelopeName);
  const envelope = document[envelopeName];
  if (!envParts || envParts.local !== 'Envelope' || !envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new SoapClientError('SOAP 1.1 Envelope is required');
  }
  attrCheck(envelope);
  if (xmlnsOf(envelope, envParts.prefix) !== SOAP_NS) {
    throw new SoapClientError('SOAP 1.1 namespace is required');
  }
  const bodyName = envParts.prefix ? `${envParts.prefix}:Body` : 'Body';
  if (elementsOf(envelope).length !== 1 || !Object.hasOwn(envelope, bodyName)) {
    throw new SoapClientError('A SOAP Body is required; SOAP headers are not supported');
  }
  const body = envelope[bodyName];
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SoapClientError('Invalid SOAP Body');
  attrCheck(body);
  if (xmlnsOf(body, envParts.prefix) && xmlnsOf(body, envParts.prefix) !== SOAP_NS) {
    throw new SoapClientError('Invalid SOAP Body namespace');
  }
  const opKeys = elementsOf(body);
  if (opKeys.length !== 1) throw new SoapClientError('SOAP Body must contain exactly one operation');
  const operationQName = opKeys[0];
  const operationParts = qnameParts(operationQName);
  const operationNode = body[operationQName];
  if (!operationParts || !Object.hasOwn(OPERATIONS, operationParts.local)) {
    throw new SoapClientError('Unknown SOAP operation');
  }
  if (!operationNode || typeof operationNode !== 'object' || Array.isArray(operationNode)) {
    throw new SoapClientError('Operation parameters must be XML elements');
  }
  attrCheck(operationNode);
  const operationNs = xmlnsOf(operationNode, operationParts.prefix)
    || xmlnsOf(body, operationParts.prefix) || xmlnsOf(envelope, operationParts.prefix);
  if (operationNs !== SERVICE_NS) throw new SoapClientError('Invalid ARDNET SOAP service namespace');

  const params = {};
  for (const name of elementsOf(operationNode)) {
    const parts = qnameParts(name);
    if (!parts || !OPERATIONS[operationParts.local].includes(parts.local)) {
      throw new SoapClientError(`Unsupported parameter: ${name}`);
    }
    if (parts.prefix) {
      const fieldNs = xmlnsOf(operationNode, parts.prefix)
        || xmlnsOf(body, parts.prefix) || xmlnsOf(envelope, parts.prefix);
      if (fieldNs !== SERVICE_NS) throw new SoapClientError('Invalid parameter namespace');
    }
    if (Object.hasOwn(params, parts.local)) throw new SoapClientError('Duplicate parameters are not allowed');
    const value = operationNode[name];
    if (typeof value === 'object' || Array.isArray(value)) throw new SoapClientError('Parameters must contain plain text');
    params[parts.local] = String(value ?? '').trim();
  }
  if (String(params.regionCode || '').toUpperCase() !== 'IX') {
    throw new SoapClientError('Only Region IX (regionCode IX) is supported');
  }
  const required = operationParts.local === 'GetRegionalMarketPrices' ? [] :
    operationParts.local === 'GetMarketPricesByProduce' ? ['produceName'] :
    ['produceName', 'marketName', 'location', 'unit'];
  for (const key of required) {
    if (!params[key]) throw new SoapClientError(`${key} is required`);
  }
  for (const [key, value] of Object.entries(params)) {
    if (value.length > 100 || /[\u0000-\u001f\u007f]/.test(value)) {
      throw new SoapClientError(`Invalid ${key} parameter`);
    }
  }
  return { operation: operationParts.local, params };
}

function soapEnvelope(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<soap:Envelope xmlns:soap="${SOAP_NS}" xmlns:m="${SERVICE_NS}"><soap:Body>${content}</soap:Body></soap:Envelope>`;
}

function soapFault(message, serverFault = false) {
  const code = serverFault ? 'soap:Server' : 'soap:Client';
  return soapEnvelope(`<soap:Fault><faultcode>${code}</faultcode><faultstring>${escapeXml(message)}</faultstring></soap:Fault>`);
}

function marketPriceXml(row) {
  const fields = [
    ['MarketPriceId', row.market_price_id], ['ProduceName', row.produce_name],
    ['MarketName', row.market_name], ['Location', row.location],
    ['Province', row.province], ['LocationType', row.location_type],
    ['RegionCode', row.region_code], ['Price', row.price],
    ['Unit', row.unit], ['PriceDate', row.price_date],
  ];
  return `<m:MarketPrice>${fields.map(([name, val]) => `<m:${name}>${escapeXml(val)}</m:${name}>`).join('')}</m:MarketPrice>`;
}

function soapSuccess(operation, { prices = [], truncated = false }) {
  if (!Object.hasOwn(OPERATIONS, operation)) throw new Error('Invalid SOAP success operation');
  const content = `<m:${operation}Response><m:Count>${prices.length}</m:Count>` +
    `<m:Truncated>${truncated}</m:Truncated><m:MarketPrices>${prices.map(marketPriceXml).join('')}</m:MarketPrices>` +
    `</m:${operation}Response>`;
  return soapEnvelope(content);
}

module.exports = { SOAP_NS, SERVICE_NS, SoapClientError, escapeXml, parseSoapRequest, soapFault, soapSuccess };
