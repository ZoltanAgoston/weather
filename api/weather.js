let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 perc

export default async function handler(req, res) {
  const city = (req.query.city || '').trim();
  if (!city) return res.status(400).json({ error: 'Missing city' });
  const cacheKey = city.toLowerCase();
  const now = Date.now();
  if (cache && cache.key === cacheKey && (now - cacheTime) < CACHE_TTL) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(cache.data);
  }
  try {
    const geoRes = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city) + '&accept-language=hu', {
      headers: { 'Accept-Language': 'hu', 'User-Agent': 'OMTG-Weather/1.0 (https://omtg.hu hello@omtg.hu)' }
    });
    if (!geoRes.ok) throw new Error('Geocoding hiba (' + geoRes.status + ')');
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error('Nem találom: ' + city);
    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);
    const display = geoData[0].display_name;
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure',
      hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'auto', forecast_days: '16'
    });
    const wRes = await fetch('https://api.open-meteo.com/v1/forecast?' + params, { headers: { 'User-Agent': 'OMTG-Weather/1.0' } });
    if (!wRes.ok) throw new Error('Open-Meteo hiba (' + wRes.status + ')');
    const weather = await wRes.json();
    const data = { geo: { lat, lon, display }, weather };
    cache = { key: cacheKey, data };
    cacheTime = now;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
