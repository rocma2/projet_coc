/** Date du jour en toutes lettres, avec une majuscule initiale (ex. « Lundi 16 novembre »). */
export function formatToday(date: Date, language: string): string {
  const text = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1)
}
