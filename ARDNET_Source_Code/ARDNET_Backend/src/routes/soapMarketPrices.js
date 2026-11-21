'use strict';

const express = require('express');
const { createSoapMarketPriceService } = require('../services/soapMarketPriceService');
const { parseSoapRequest, soapFault, soapSuccess, SoapClientError } = require('../services/soapMarketPriceProtocol');

function createSoapMarketPricesRouter(pool) {
  const router = express.Router();
  const service = createSoapMarketPriceService(pool);
  const expectedDatabase = process.env.SOAP_ALLOWED_DATABASE || '';

  function xmlResponse(res, status, body) {
    return res.status(status).set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    }).send(body);
  }

  // SOAP 1.1: POST text/xml; no WSDL endpoint is created.
  router.post('/', express.raw({ type: 'text/xml', limit: '16kb' }), async (req, res) => {
    if (!req.is('text/xml')) {
      return xmlResponse(res, 415, soapFault('SOAP 1.1 requires Content-Type: text/xml'));
    }
    try {
      // No accidental access to Farm_to_Market_Exchange_DB during the test phase.
      await service.verifyDatabase(expectedDatabase);
      const xml = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const { operation, params } = parseSoapRequest(xml);
      const result = await service.getPrices(operation, params);
      return xmlResponse(res, 200, soapSuccess(operation, result));
    } catch (error) {
      if (error instanceof SoapClientError) {
        return xmlResponse(res, 400, soapFault(error.message));
      }
      if (error.soapStatus === 503) {
        console.error('[SOAP Market Prices] Database allowlist blocked request');
        return xmlResponse(res, 503, soapFault('SOAP service is not available on this database', true));
      }
      console.error('[SOAP Market Prices] Request failed:', error.message);
      return xmlResponse(res, 500, soapFault('Market price service temporarily unavailable', true));
    }
  });

  router.all('/', (req, res) => {
    res.set('Allow', 'POST');
    return xmlResponse(res, 405, soapFault('Only SOAP 1.1 POST requests are supported'));
  });
  return router;
}

module.exports = { createSoapMarketPricesRouter };
