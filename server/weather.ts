import { ENV } from "./_core/env";

export interface WeatherData {
  condition: "sunny" | "rainy" | "cloudy" | "snowy" | "night";
  temperature: number;
  humidity: number;
  cloudCover: number;
  rainProbability: number;
  windSpeed: number;
  isDay: boolean;
}

/**
 * Fetch weather data from OpenWeatherMap API
 * Converts OpenWeather conditions to our simplified categories
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const apiKey = ENV.openweatherApiKey;
  
  if (!apiKey) {
    console.warn("[Weather] OpenWeather API key not configured, returning default weather");
    return getDefaultWeather();
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Weather] API error: ${response.status} ${response.statusText}`);
      return getDefaultWeather();
    }

    const data = await response.json();
    
    return parseWeatherResponse(data);
  } catch (error) {
    console.error("[Weather] Failed to fetch weather data:", error);
    return getDefaultWeather();
  }
}

/**
 * Parse OpenWeatherMap API response to our weather format
 */
function parseWeatherResponse(data: any): WeatherData {
  const weather = data.weather?.[0]?.main || "Clear";
  const temperature = data.main?.temp || 20;
  const humidity = data.main?.humidity || 50;
  const cloudCover = data.clouds?.all || 0;
  const rainProbability = data.rain ? 80 : 0;
  const windSpeed = data.wind?.speed || 0;
  const sunrise = data.sys?.sunrise || 0;
  const sunset = data.sys?.sunset || 0;
  const currentTime = Math.floor(Date.now() / 1000);
  
  const isDay = currentTime > sunrise && currentTime < sunset;
  
  // Map OpenWeather conditions to our categories
  let condition: "sunny" | "rainy" | "cloudy" | "snowy" | "night";
  
  if (!isDay) {
    condition = "night";
  } else if (weather.includes("Rain") || weather.includes("Drizzle")) {
    condition = "rainy";
  } else if (weather.includes("Snow")) {
    condition = "snowy";
  } else if (weather.includes("Cloud")) {
    condition = "cloudy";
  } else {
    condition = "sunny";
  }
  
  return {
    condition,
    temperature,
    humidity,
    cloudCover,
    rainProbability,
    windSpeed,
    isDay,
  };
}

/**
 * Get default weather when API is unavailable
 */
function getDefaultWeather(): WeatherData {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  
  return {
    condition: isDay ? "sunny" : "night",
    temperature: 20,
    humidity: 50,
    cloudCover: 20,
    rainProbability: 0,
    windSpeed: 5,
    isDay,
  };
}

/**
 * Calculate plant growth bonus based on weather
 * Returns growth multiplier (1.0 = normal, 1.5 = 50% faster, etc.)
 */
export function calculateGrowthBonus(weather: WeatherData): {
  hydrationBonus: number;
  photosynthesisBonus: number;
} {
  let hydrationBonus = 0;
  let photosynthesisBonus = 0;
  
  // Hydration bonus from rain
  if (weather.condition === "rainy") {
    hydrationBonus = 30; // +30% hydration per update
  } else if (weather.condition === "cloudy") {
    hydrationBonus = 5; // +5% from moisture in air
  }
  
  // Photosynthesis bonus from sunlight
  if (weather.condition === "sunny" && weather.isDay) {
    photosynthesisBonus = 40; // +40% photosynthesis
  } else if (weather.condition === "cloudy" && weather.isDay) {
    photosynthesisBonus = 15; // +15% through clouds
  } else if (weather.condition === "night") {
    photosynthesisBonus = -10; // -10% at night (plant rests)
  }
  
  return { hydrationBonus, photosynthesisBonus };
}

/**
 * Calculate plant health impact based on weather
 */
export function calculateHealthImpact(weather: WeatherData): number {
  let impact = 0;
  
  // Extreme temperatures reduce health
  if (weather.temperature < -5 || weather.temperature > 40) {
    impact -= 5;
  } else if (weather.temperature < 5 || weather.temperature > 35) {
    impact -= 2;
  }
  
  // Very dry conditions reduce health
  if (weather.humidity < 20) {
    impact -= 3;
  }
  
  // Very wet conditions (snow) can stress plant
  if (weather.condition === "snowy") {
    impact -= 2;
  }
  
  // Strong wind can stress plant
  if (weather.windSpeed > 20) {
    impact -= 2;
  }
  
  return impact;
}
