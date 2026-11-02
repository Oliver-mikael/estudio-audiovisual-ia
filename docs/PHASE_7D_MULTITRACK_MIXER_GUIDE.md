# FASE 7D: MANUAL Y ARQUITECTURA DE LA MEZCLADORA MULTIPISTA

## 1. Controles de Fader y Rango Operativo
Cada canal cuenta con un deslizador de control analógico virtual:
- A1 (Locución): 0 a 100% (default 100%).
- A2 (Música de fondo): 0 a 100% (default 25% para no opacar el diálogo).
- A3 (FX Sonoros): 0 a 100% (default 70%).
- Master General: 0 a 100% (default 100%).

## 2. Lógica de Solo y Mute
- Cuando un canal está en **Mute**, su ganancia efectiva en el nodo Web Audio es de 0.0 absoluto.
- Cuando uno o más canales están en **Solo**, todos los canales que no estén en Solo se silencian temporalmente para monitoreo crítico de estudio.
- El cálculo de ganancia efectiva es idempotente y no destructivo respecto a los faders almacenados.

## 3. Algoritmo de Atenuación Automática (Auto-Ducking)
- Detección de presencia de señal o clips activos en la pista de voz A1.
- Reducción suave con curva lineal de ganancia sobre A2 y A3 durante la reproducción de la locución.
- Recuperación al nivel nominal en 300 ms tras el cese de la voz.
