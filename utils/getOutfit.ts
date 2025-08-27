// utils/getOutfit.ts
export function getOutfit(tempC: number, condition?: string) {
  const cond = (condition || '').toLowerCase();
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunder')) {
    return { text: 'Waterproof jacket & boots ☔', key: 'rain' as const };
  }
  if (cond.includes('snow')) return { text: 'Warm coat, scarf & gloves 🧤', key: 'snow' as const };
  if (tempC >= 30) return { text: 'T-shirt & shorts 😎', key: 'hot' as const };
  if (tempC <= 10) return { text: 'Heavy coat & scarf 🧣', key: 'cold' as const };
  return { text: 'Light sweater & jeans 👕', key: 'mild' as const };
}