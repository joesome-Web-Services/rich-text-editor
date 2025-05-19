const AVERAGE_WORDS_PER_MINUTE = 225;

export function getTotalReadingTime(words: number) {
  return Math.ceil(words / AVERAGE_WORDS_PER_MINUTE);
}
