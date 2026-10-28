const TITLE_DATE_PREFIX =
  /^\s*\d{4}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}\.?\s*\|\s*/;

export function stripTitleDate(title: string) {
  return title.replace(TITLE_DATE_PREFIX, "");
}
