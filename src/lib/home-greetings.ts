const HOME_GREETINGS = {
  morning: [
    "Laundry made easy for your morning.",
    "Start fresh with clean clothes today.",
    "A bright morning for a quick laundry win.",
    "Coffee, then laundry, then conquer the day.",
    "Fresh clothes, fresh energy.",
    "Good morning. Let us take laundry off your plate.",
  ],
  afternoon: [
    "Laundry made easy for your afternoon.",
    "Take a quick break and refresh your wardrobe.",
    "Clean clothes for the rest of your day.",
    "Midday laundry, all-day confidence.",
    "Need a reset? Start with fresh laundry.",
    "Your next laundry pickup is just a tap away.",
  ],
  evening: [
    "Laundry made easy for your evening.",
    "Unwind tonight with tomorrow's clean clothes ready.",
    "Wrap up the day with one quick laundry booking.",
    "Cozy evening, cleaner wardrobe.",
    "Let TapWash handle laundry while you rest.",
    "Set tonight, wear fresh tomorrow.",
  ],
} as const;

type GreetingPeriod = keyof typeof HOME_GREETINGS;

function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getHomeGreeting(nameSeed: string): string {
  const period = getGreetingPeriod();
  const options = HOME_GREETINGS[period];

  const normalizedSeed = nameSeed.trim().toLowerCase() || "tapwash";
  const pick = hashSeed(normalizedSeed) % options.length;
  return options[pick];
}
