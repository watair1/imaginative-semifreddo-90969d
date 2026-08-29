import { describe, expect, it } from "vitest";
import { fetchWeatherData } from "./weather";

describe("weather API integration", () => {
  it("should fetch weather data successfully with valid API key", async () => {
    // Test with Seoul coordinates
    const result = await fetchWeatherData(37.5665, 126.978);
    
    expect(result).toBeDefined();
    expect(result.condition).toBeDefined();
    expect(result.temperature).toBeDefined();
    expect(result.humidity).toBeDefined();
    expect(["sunny", "rainy", "cloudy", "snowy", "night"]).toContain(result.condition);
    expect(result.temperature).toBeGreaterThan(-50);
    expect(result.temperature).toBeLessThan(60);
    expect(result.humidity).toBeGreaterThanOrEqual(0);
    expect(result.humidity).toBeLessThanOrEqual(100);
  });

  it("should handle API errors gracefully", async () => {
    // Test with invalid coordinates (should still work, just return default weather)
    const result = await fetchWeatherData(0, 0);
    expect(result).toBeDefined();
    expect(result.condition).toBeDefined();
  });
});
