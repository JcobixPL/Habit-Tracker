# Habit Tracker

Prosta aplikacja webowa do śledzenia codziennych nawyków.

---

## Funkcje

- rejestracja i logowanie użytkownika
- dodawanie nawyków z dziennym targetem
- codzienne check-iny (+1 / -1)
- archiwizacja i przywracanie nawyków
- statystyki i wykres aktywności
- oznaczenie „Perfect Day”

---

## Technologie

- React + Vite
- JavaScript
- Node.js + Express
- Prisma ORM
- PostgreSQL
- Docker

---

## Perfect Day

**Perfect Day** to dzień, w którym wszystkie aktywne nawyki zostały wykonane w 100%.  
Na wykresie jest oznaczony **zielonym słupkiem**.
Dzień, w którym nie zostały wykonane wszystkie aktywne nawyki, jest oznaczony kolorem fioletowym

---

## Uruchamianie

```bash
docker compose up --build
