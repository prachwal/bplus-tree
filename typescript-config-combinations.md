# Kombinacje konfiguracji TypeScript dla różnych scenariuszy

## Wyjaśnienie opcji

### `target`

Określa wersję ECMAScript, do której TypeScript kompiluje kod. Starsze wersje zapewniają lepszą kompatybilność wsteczną.

- **ES2020**: Nowoczesne przeglądarki i środowiska Node.js 14+. Zawiera opcjonalne chaining, nullish coalescing, BigInt itp.

### `module`

Określa system modułów używany w wygenerowanym kodzie JavaScript.

- **ESNext**: Używa najnowszych składni modułów ES (import/export). Wymaga wsparcia dla ESM w środowisku docelowym.

### `moduleResolution`

Algorytm używany przez TypeScript do rozwiązywania importów modułów.

- **nodenext**: Rozszerzona strategia Node.js, obsługuje zarówno CommonJS jak i ESM. Sprawdza package.json dla typu modułu i odpowiednio rozwiązuje importy.

## Kombinacje dla różnych scenariuszy

### 1. Nowoczesne przeglądarki z bundlerem (Webpack, Vite, Rollup)

**Konfiguracja:**

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "nodenext"
}
```

**Dlaczego ta kombinacja:**

- `ES2020` zapewnia nowoczesne funkcje bez potrzeby transpilacji
- `ESNext` pozwala bundlerowi na optymalizację drzewa zależności
- `nodenext` zapewnia kompatybilność z różnymi typami modułów w dependencies

**Zalety:**

- Najlepsza wydajność
- Najmniejszy rozmiar bundle
- Natywne wsparcie dla najnowszych funkcji JS

**Wady:**

- Wymaga nowoczesnych przeglądarek
- Potrzebny bundler do obsługi ESM

### 2. Node.js z ESM (Node.js 14+)

**Konfiguracja:**

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "nodenext"
}
```

**Dlaczego ta kombinacja:**

- `ES2020` jest wspierany przez Node.js 14+
- `ESNext` używa natywnych ESM w Node.js
- `nodenext` automatycznie wykrywa typ modułu z package.json

**Zalety:**

- Brak potrzeby transpilacji
- Natywne wsparcie dla top-level await, dynamic imports
- Lepsza wydajność

**Wady:**

- Wymaga Node.js 14+
- Problemy z CommonJS dependencies

### 3. Biblioteka do dystrybucji (Library)

**Konfiguracja:**

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "nodenext"
}
```

**Dlaczego ta kombinacja:**

- `ES2020` zapewnia dobry balans między nowoczesnością a kompatybilnością
- `ESNext` pozwala użytkownikom na tree-shaking
- `nodenext` zapewnia uniwersalność

**Zalety:**

- Nowoczesny kod źródłowy
- Możliwość generowania wielu formatów wyjściowych
- Dobrze współdziała z bundlerami

**Wady:**

- Może wymagać dodatkowych build steps dla starszych środowisk

### 4. Starsze przeglądarki z polyfillami

**Alternatywna konfiguracja (jeśli potrzebna kompatybilność wsteczna):**

```json
{
  "target": "ES2017",
  "module": "ESNext",
  "moduleResolution": "nodenext"
}
```

**Dlaczego ta kombinacja:**

- `ES2017` zapewnia lepszą kompatybilność ze starszymi przeglądarkami
- `ESNext` nadal pozwala na nowoczesne moduły
- `nodenext` zapewnia spójność

**Zalety:**

- Lepsza kompatybilność wsteczna
- Mniejszy rozmiar polyfillów

**Wady:**

- Brak dostępu do nowszych funkcji ES2020

### 5. Środowisko mieszane (CommonJS + ESM)

**Konfiguracja:**

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "nodenext"
}
```

**Dlaczego ta kombinacja:**

- `nodenext` automatycznie obsługuje różne typy modułów
- `ES2020` i `ESNext` zapewniają nowoczesność tam gdzie to możliwe

**Zalety:**

- Elastyczność w dependencies
- Łatwiejsza migracja między systemami modułów

**Wady:**

- Może wymagać dodatkowych konfiguracji dla edge cases

## Rekomendacje

- Dla nowych projektów: użyj kombinacji `ES2020` + `ESNext` + `nodenext`
- Dla maksymalnej kompatybilności: rozważ `ES2017` lub niższy target
- Zawsze testuj w docelowych środowiskach
- Używaj bundlerów do optymalizacji dla produkcji

### 6. Lokalne budowanie w najnowszym standardzie

**Konfiguracja:**

```json
{
  "target": "ES2023",
  "module": "ESNext",
  "moduleResolution": "bundler"
}
```

**Dlaczego ta kombinacja:**

- `ES2023` zapewnia dostęp do najnowszych funkcji ECMAScript (jak Array.findLast, Hashbang grammar)
- `ESNext` używa natywnych modułów ES
- `bundler` optymalizuje rozwiązywanie modułów dla narzędzi jak Vite, esbuild

**Zalety:**

- Najnowsze funkcje języka bez transpilacji
- Optymalne dla lokalnego developmentu
- Szybka kompilacja

**Wady:**

- Wymaga wsparcia dla ES2023 w środowisku uruchomieniowym
- Może wymagać polyfillów dla starszych środowisk
