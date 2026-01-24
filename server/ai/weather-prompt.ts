

export function buildWeatherPrompt(
  question: string,
  weather: any
) {
  return `
You are weather assistant.
answer based on the weather for location, time: ${JSON.stringify(weather)}
User question:
"${question}"
Give short, practical, friendly advice.
Avoid technical jargon.
`;
}
