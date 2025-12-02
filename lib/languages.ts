export interface Language {
  code: string;
  name: string;
}

export const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "tr", name: "Türkçe" },
  { code: "pl", name: "Polski" },
  { code: "nl", name: "Nederlands" },
  { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" },
  { code: "no", name: "Norsk" },
  { code: "fi", name: "Suomi" },
  { code: "cs", name: "Čeština" },
  { code: "hu", name: "Magyar" },
  { code: "ro", name: "Română" },
  { code: "el", name: "Ελληνικά" },
  { code: "he", name: "עברית" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "uk", name: "Українська" },
  { code: "bg", name: "Български" },
  { code: "hr", name: "Hrvatski" },
  { code: "sk", name: "Slovenčina" },
  { code: "sl", name: "Slovenščina" },
  { code: "sr", name: "Српски" },
  { code: "et", name: "Eesti" },
  { code: "lv", name: "Latviešu" },
  { code: "lt", name: "Lietuvių" },
  { code: "is", name: "Íslenska" },
  { code: "ga", name: "Gaeilge" },
  { code: "mt", name: "Malti" },
  { code: "ca", name: "Català" },
  { code: "eu", name: "Euskara" },
  { code: "gl", name: "Galego" },
  { code: "cy", name: "Cymraeg" },
  { code: "fa", name: "فارسی" },
  { code: "ur", name: "اردو" },
  { code: "bn", name: "বাংলা" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "mr", name: "मराठी" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "ne", name: "नेपाली" },
  { code: "si", name: "සිංහල" },
  { code: "my", name: "မြန်မာ" },
  { code: "km", name: "ខ្មែរ" },
  { code: "lo", name: "ລາວ" },
  { code: "ka", name: "ქართული" },
  { code: "am", name: "አማርኛ" },
  { code: "sw", name: "Kiswahili" },
  { code: "zu", name: "isiZulu" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Shqip" },
  { code: "mk", name: "Македонски" },
  { code: "bs", name: "Bosanski" },
  { code: "az", name: "Azərbaycan" },
  { code: "kk", name: "Қазақ" },
  { code: "ky", name: "Кыргызча" },
  { code: "uz", name: "O'zbek" },
  { code: "mn", name: "Монгол" },
  { code: "hy", name: "Հայերեն" },
];

export function getLanguageName(code: string): string | undefined {
  const language = languages.find((lang) => lang.code === code);
  return language?.name;
}

export function getLanguageByCode(code: string): Language | undefined {
  return languages.find((lang) => lang.code === code);
}

export function isValidLanguageCode(code: string): boolean {
  return languages.some((lang) => lang.code === code);
}


