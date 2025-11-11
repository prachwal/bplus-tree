# Plan Optymalizacji B+ Tree dla Dużej Ilości Danych

## Wprowadzenie

Biblioteka B+ Tree jest efektywna dla małych i średnich zbiorów danych (do 10,000 kluczy), ale przy większych ilościach (10,000+ kluczy) pojawiają się problemy z wydajnością związane z pamięcią, serializacją JSON i I/O. Ten plan opisuje optymalizacje, aby obsłużyć duże dane (100,000–1,000,000+ kluczy) bez utraty funkcjonalności.

## Status Implementacji

- ✅ **Krok 1**: Zwiększenie capacity węzłów (z 4 do 100) — ukończony, testy przechodzą.
- ✅ **Krok 2**: Wprowadzenie binarnej serializacji — ukończony, MessagePack zaimplementowany.
- ⏳ **Krok 3-6**: Oczekujące.

## Problemy z Obecną Implementacją

- **Płytkie drzewo (capacity=4)**: Duża wysokość drzewa, więcej węzłów do traversal.
- **Serializacja JSON**: Wolna dla dużych struktur (rekursywny stringify/parse).
- **I/O**: Pełny zapis/odczyt drzewa jako jednego bloku (plik lub Redis klucz).
- **Pamięć**: Wysokie zużycie RAM przy milionach węzłów.
- **Testy**: Przykłady używają tylko kilku kluczy, nie pokazują rzeczywistych problemów.

## Proponowane Optymalizacje

1. **Zwiększyć capacity węzłów** (np. do 100) dla płytszego drzewa i mniej węzłów.
2. **Użyć binarnej serializacji** (np. MessagePack lub Protobuf) zamiast JSON dla szybszego i mniejszego formatu.
3. **Podzielić dane w Redis** na mniejsze klucze (sharding) zamiast jednego dużego.
4. **Dodać benchmarki** z dużą ilością danych do testów wydajności.
5. **Optymalizować pamięć** (lazy loading węzłów, jeśli potrzebne).

## Plan Działania Krok po Kroku

### Krok 1: Zwiększenie Capacity Węzłów ✅ **UKOŃCZONY**

- **Cel**: Zmniejszyć wysokość drzewa, przyspieszyć lookup/insert.
- **Czynności**:
  - Zmienić `capacity` w `BPlusTree` z 4 na 100 (lub parametr konstruktora). ✅
  - Zaktualizować testy, aby obsługiwały większe węzły. ✅
  - Przetestować na małych danych, czy split/merge działa poprawnie. ✅
- **Wymagania**: Brak nowych bibliotek.
- **Szacowany czas**: 1–2 godziny.
- **Ryzyka**: Możliwe błędy w split logic dla większych węzłów. (Rozwiązane: testy przechodzą)

### Krok 2: Wprowadzenie Binarnej Serializacji ✅ **UKOŃCZONY**

- **Cel**: Przyspieszyć save/load, zmniejszyć rozmiar danych.
- **Czynności**:
  - Wybrano bibliotekę: `@msgpack/msgpack` (MessagePack) dla binarnej serializacji. ✅
  - Zainstalowano: `npm install @msgpack/msgpack`. ✅
  - Zmodyfikowano `serialize`/`deserialize` w `BPlusTree` do używania `encode`/`decode` zamiast JSON. ✅
  - Zaktualizowano `FileStorageProvider` i `RedisStorageProvider` (Redis używa base64 encoding dla binary data). ✅
  - Przetestowano kompatybilność — nowe dane używają MessagePack, stare JSON wymagają migracji. ✅
- **Wymagania**: Biblioteka MessagePack.
- **Szacowany czas**: 2–4 godziny. (Rzeczywisty: ~3 godziny)
- **Ryzyka**: Niekompatybilność z istniejącymi danymi; błędy deserializacji. (Rozwiązane: dodano wersjonowanie serializacji)

### Krok 3: Optymalizacja Redis (Sharding)

- **Cel**: Uniknąć jednego dużego klucza, rozłożyć dane na mniejsze części.
- **Czynności**:
  - Zmodyfikować `RedisStorageProvider` do dzielenia drzewa na klucze (np. jeden klucz na poziom drzewa lub grupy węzłów).
  - Użyć prefixu kluczy (np. `bplus-tree:level:0`, `bplus-tree:level:1`).
  - Zaktualizować `save`/`load` do obsługi wielu kluczy.
  - Dodać metody do czyszczenia starych kluczy.
- **Wymagania**: Biblioteka Redis (już zainstalowana).
- **Szacowany czas**: 3–5 godzin.
- **Ryzyka**: Złożoność zarządzania wieloma kluczami; błędy przy częściowym load.

### Krok 4: Dodanie Benchmarków i Testów Wydajności

- **Cel**: Zmierz wydajność przy dużej ilości danych.
- **Czynności**:
  - Dodać test `performance.test.ts` z benchmarkami (np. 10,000–100,000 insertów).
  - Użyć `benchmark.js` lub `perf_hooks` do mierzenia czasu.
  - Zainstalować: `npm install benchmark`.
  - Testować insert, lookup, save/load dla różnych rozmiarów danych.
  - Porównać przed/po optymalizacjach.
- **Wymagania**: Biblioteka benchmark.
- **Szacowany czas**: 2–3 godziny.
- **Ryzyka**: Benchmarki mogą być niestabilne na różnych maszynach.

### Krok 5: Testowanie na Rzeczywistych Danych

- **Cel**: Sprawdzić na większych zbiorach (np. 100,000 kluczy).
- **Czynności**:
  - Zaktualizować przykłady do generowania losowych danych (np. 50,000 kluczy).
  - Uruchomić przykłady z plikami i Redis.
  - Zmierz czas i pamięć (użyć `process.memoryUsage()`).
  - Dodać logi dla debugowania (np. rozmiar drzewa, czas serializacji).
- **Wymagania**: Brak nowych bibliotek.
- **Szacowany czas**: 1–2 godziny.
- **Ryzyka**: Wysokie zużycie zasobów podczas testów.

### Krok 6: Weryfikacja i Migracja

- **Czynności**:
  - Uruchomić wszystkie testy (31 testów) po każdej zmianie.
  - Sprawdzić pokrycie kodu (>95%).
  - Dodać migrację dla starych danych (np. script do konwersji JSON na MessagePack).
  - Opublikować nową wersję pakietu (zwiększyć version w package.json).
- **Wymagania**: Brak.
- **Szacowany czas**: 1 godzina.
- **Ryzyka**: Złamanie kompatybilności wstecznej.

## Wymagania Ogólne

- **Biblioteki**: `@msgpack/msgpack`, `benchmark` (opcjonalnie).
- **Narzędzia**: Node.js >=18, Docker (dla Redis), Git.
- **Środowisko**: Testować na maszynie z >=8GB RAM dla dużych danych.
- **Zespół**: 1 developer (ja), czas całkowity: 10–17 godzin.

## Ryzyka i Uwagi

- **Kompatybilność**: Zmiany mogą złamać istniejące dane — dodać wersjonowanie serializacji.
- **Wydajność**: Optymalizacje mogą zwiększyć złożoność kodu.
- **Testowanie**: Benchmarki zależą od sprzętu — dokumentować środowisko.
- **Alternatywy**: Jeśli problemy persist, rozważyć zewnętrzne bazy (np. LevelDB) zamiast własnej serializacji.

## Następne Kroki

1. ✅ Krok 1 ukończony (capacity zwiększone do 100).
2. ✅ Krok 2 ukończony (binarna serializacja MessagePack).
3. Zacząć od Krok 3 (optymalizacja Redis - sharding).
4. Iteracyjnie testować każdą zmianę.
5. Po zakończeniu, stworzyć commit i push.

Ten plan zapewni skalowalność dla dużych danych przy zachowaniu prostoty biblioteki.
