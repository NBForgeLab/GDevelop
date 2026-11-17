// A custom protocol serves public app assets or a previously authorized file.
// Chromium must generate the new request's origin and fetch metadata.
const fetchProtocolAsset = (net, url, request) => {
  const headers = new Headers();
  const range = request.headers && request.headers.get('range');
  if (range) headers.set('Range', range);
  return net.fetch(url, { method: request.method, headers, credentials: 'omit' });
};

module.exports = { fetchProtocolAsset };
