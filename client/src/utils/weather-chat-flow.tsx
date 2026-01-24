export const CATEGORIES = [
  "TODAY",
  "HEALTH",
  "OUTDOORS",
  "CLOTHING",
  "TRAVEL",
  "ALERTS",
] as const;

export type Category = typeof CATEGORIES[number];

export const QUESTIONS: Record<Category, string[]> = {
  TODAY: [
    "What should I keep in mind today based on the weather?",
    "Is today a good day overall?",
    "Any general advice for today’s weather?",
  ],
  HEALTH: [
    "Are there any health precautions I should take today?",
    "Is this weather safe for kids and elderly people?",
    "Could today’s weather cause dehydration or fatigue?",
    "Any advice for people with allergies or asthma?",
  ],
  OUTDOORS: [
    "Is it a good time to go for a walk or exercise?",
    "Can I spend time outdoors today?",
    "Is it safe to play sports outside?",
    "Should I avoid outdoor activities at certain times?",
  ],
  CLOTHING: [
    "What kind of clothes should I wear today?",
    "Should I carry a jacket, umbrella, or sunscreen?",
    "Is light clothing enough for today?",
    "Do I need protection from heat, cold, or rain?",
  ],
  TRAVEL: [
    "Is it a good day to travel?",
    "Any weather-related issues I should expect while commuting?",
    "Could weather affect traffic or visibility today?",
    "Is it safe to drive or ride today?",
  ],
  ALERTS: [
    "Are there any weather warnings today?",
    "Is the weather extreme or unusual today?",
    "Should I avoid going out at certain times?",
    "Anything risky I should be aware of?",
  ],
};
