/**
 * Today's weather from Open-Meteo (free, no key), fetched in the browser.
 * The city is turned into coordinates once and saved on the profile.
 */
export type Weather = { tempF: number; highF: number; lowF: number; rain: boolean; label: string };

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

export async function findCity(name: string): Promise<{ city: string; lat: number; lon: number } | null> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(name)}`);
  if (!r.ok) throw new Error("lookup failed");
  const j = await r.json();
  const hit = j.results?.[0];
  if (!hit) return null;
  return { city: [hit.name, hit.admin1, hit.country_code].filter(Boolean).join(", "), lat: hit.latitude, lon: hit.longitude };
}

export async function todayWeather(lat: number, lon: number): Promise<Weather> {
  const q = `latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error("weather failed");
  const j = await r.json();
  const code = Number(j.current?.weather_code);
  const chance = Number(j.daily?.precipitation_probability_max?.[0] ?? 0);
  const rain = RAIN_CODES.has(code) || SNOW_CODES.has(code) || Number(j.current?.precipitation) > 0 || chance >= 50;
  const tempF = Math.round(Number(j.current?.temperature_2m));
  const highF = Math.round(Number(j.daily?.temperature_2m_max?.[0]));
  const lowF = Math.round(Number(j.daily?.temperature_2m_min?.[0]));
  const sky = SNOW_CODES.has(code) ? "snow" : RAIN_CODES.has(code) ? "rain" : chance >= 50 ? `${chance}% chance of rain` : code <= 1 ? "clear" : code <= 3 ? "cloudy" : "overcast";
  return { tempF, highF, lowF, rain, label: `${tempF}°F now, ${lowF}–${highF}°F today, ${sky}` };
}
