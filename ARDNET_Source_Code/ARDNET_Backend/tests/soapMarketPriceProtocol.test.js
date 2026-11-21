'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSoapRequest, SoapClientError, SOAP_NS } = require('../src/services/soapMarketPriceProtocol');

let parserAvailable = true;
try { require.resolve('fast-xml-parser'); } catch { parserAvailable = false; }

function request(operation, children, ns = SOAP_NS) {
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soap:Envelope xmlns:soap="${ns}" xmlns:m="urn:ardnet:market-price:v1">` +
    `<soap:Body><m:${operation}>${children}</m:${operation}></soap:Body></soap:Envelope>`;
}

const parserTest = (name, callback) => test(name, {skip: !parserAvailable && 'Install fast-xml-parser to run XML parser tests'}, callback);

parserTest('accepts a valid Region IX SOAP 1.1 request', () => {
  const parsed = parseSoapRequest(request('GetMarketPricesByProduce', '<m:regionCode>IX</m:regionCode><m:produceName>Rice</m:produceName><m:unit>kg</m:unit>'));
  assert.deepEqual(parsed, {operation:'GetMarketPricesByProduce', params:{regionCode:'IX',produceName:'Rice',unit:'kg'}});
});
parserTest('rejects malformed envelope namespace', () => {
  assert.throws(()=>parseSoapRequest(request('GetRegionalMarketPrices','<m:regionCode>IX</m:regionCode>','urn:not-soap')),SoapClientError);
});
parserTest('rejects unapproved region', () => {
  assert.throws(()=>parseSoapRequest(request('GetRegionalMarketPrices','<m:regionCode>X</m:regionCode>')), /Only Region IX/);
});
parserTest('rejects unknown operations', () => {
  assert.throws(()=>parseSoapRequest(request('DropDatabase','<m:regionCode>IX</m:regionCode>')), /Unknown SOAP operation/);
});
parserTest('rejects missing required parameters', () => {
  assert.throws(()=>parseSoapRequest(request('GetLatestMarketPrice','<m:regionCode>IX</m:regionCode>')), /produceName is required/);
});
parserTest('rejects extra unexpected parameters', () => {
  assert.throws(()=>parseSoapRequest(request('GetRegionalMarketPrices','<m:regionCode>IX</m:regionCode><m:admin>true</m:admin>')), /Unsupported parameter/);
});
parserTest('rejects duplicate XML fields', () => {
  assert.throws(()=>parseSoapRequest(request('GetRegionalMarketPrices','<m:regionCode>IX</m:regionCode><m:regionCode>IX</m:regionCode>')),SoapClientError);
});
parserTest('rejects DTD and ENTITY declarations before parsing', () => {
  const evil='<!DOCTYPE x [ <!ENTITY x SYSTEM "file:///etc/passwd"> ]>'+request('GetRegionalMarketPrices','<m:regionCode>IX</m:regionCode>');
  assert.throws(()=>parseSoapRequest(evil), /DTD, ENTITY/);
});
parserTest('rejects oversized XML payload', () => {
  assert.throws(()=>parseSoapRequest(' '.repeat(17000)), /exceeds 16 KB/);
});
parserTest('rejects nested XML in plain-text parameters', () => {
  assert.throws(()=>parseSoapRequest(request('GetMarketPricesByProduce','<m:regionCode>IX</m:regionCode><m:produceName><m:nested>Rice</m:nested></m:produceName>')),/plain text/);
});
