# Proyecto Mysha — Contexto para Claude

## Qué es este proyecto

Organización del lore de una campaña de rol (TTRPG) con **67 episodios grabados en YouTube**. El objetivo es construir una base de datos de lore completa a partir de los resúmenes automáticos de Gemini que YouTube genera para cada video.

## Personajes y facciones clave

- **Mysha** — personaje principal
- **Selenne** — personaje relevante
- **Veltra** — personaje relevante
- **Coven Rosa** — facción
- **Té de Medianoche** — facción/evento

## Estado actual

- App React de base de datos de lore (`lore-database.jsx`) — diseñada en claude.ai, pendiente de reconstruir localmente
- Los 67 episodios todavía NO están cargados — el usuario está en setup inicial
- El flujo es: copiar resumen de Gemini de YouTube → pegar en la app → IA extrae lore estructurado

## La app de lore

Una React app con estética "grimorio oscuro" (dark crimson, gothic) que:
1. Acepta resúmenes de episodios en español
2. Llama a la API de Claude para extraer: personajes, eventos, worldbuilding, info de Mysha, Coven Rosa, lugares, objetos
3. Guarda todo de forma persistente
4. Permite exportar el lore completo como Markdown

## Instrucciones para Claude

- Responder siempre en **español**
- El usuario trabaja desde Claude Code CLI y Antigravity (IDE de Google)
- Prioridad actual: reconstruir la app localmente y mejorarla
- Los resúmenes de Gemini están en **español**
- Modelo preferido para la app: `claude-opus-4-7` o `claude-sonnet-4-6`
