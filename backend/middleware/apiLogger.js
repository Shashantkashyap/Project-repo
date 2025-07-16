const db = require('../db');
const UAParser = require('ua-parser-js');
const parser = new UAParser();

function safeJsonTruncate(obj, limit = 3000) {
  const full = JSON.stringify(obj);
  if (full.length <= limit) return full;
  return JSON.stringify({
    truncated: true,
    partial: full.slice(0, limit),
    note: 'Response truncated to avoid DB overflow'
  });
}

const apiLogger = async (req, res, next) => {
  const api_name = req.originalUrl;
  const request_body = JSON.stringify(req.body || {});
  const ip_address =
    req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  const user_agent = req.headers['user-agent'] || '';

  parser.setUA(user_agent);
  const uaResult = parser.getResult();
  const os = uaResult.os.name || '';
  const browser = uaResult.browser.name || '';

  // Wrap res.send to capture response
  const oldSend = res.send;
  let response_body = '';

  
  res.send = function (data) {
    try {
      if (res.locals._logResponse) {
      response_body = JSON.stringify(res.locals._logResponse);
      
    } else if (Buffer.isBuffer(data)) {
      response_body = data.toString('utf8');
    } else if (typeof data === 'object') {
      response_body = JSON.stringify(data);
    } else if (typeof data === 'string') {
      try {
        // 🧪 Attempt to parse and re-stringify if already JSON
        const parsed = JSON.parse(data);
        response_body = JSON.stringify(parsed);
      } catch {
        // 🔐 Otherwise wrap in an object to force valid JSON
        response_body = JSON.stringify({ response: data });
      }
      
    } else {
      response_body = JSON.stringify({ response: String(data) });
    }

    // Optional: Truncate to avoid huge DB inserts
    if (response_body.length > 3000) {
      response_body = safeJsonTruncate(res.locals._logResponse);
    }
  } catch (err) {
    response_body = '[Error serializing response]';
  }

  oldSend.apply(res, arguments);
    // Async location + log
    (async () => {
      let location = '';
      try {
        const fetch = (await import('node-fetch')).default;
        const resGeo = await fetch(`https://ipapi.co/${ip_address}/json/`);
        if (resGeo.ok) {
          const geoData = await resGeo.json();
          location = `${geoData.city || ''}, ${geoData.region || ''}, ${geoData.country_name || ''}`.replace(/(^[,\s]+)|([,\s]+$)/g, '');
        }
      } catch (e) {
        // Fail silently if geo lookup fails
      }

      try {
        await db.query(
          `INSERT INTO api_logs (api_name, request_body, response_body, ip_address, location, user_agent, os, browser)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            api_name,
            request_body,
            response_body,
            ip_address,
            location,
            user_agent,
            os,
            browser,
          ]
        );
      } catch (err) {
        console.error('❌ Failed to log API call:', err.message);
      }
    })();
  };

  next();
};

module.exports = apiLogger;
