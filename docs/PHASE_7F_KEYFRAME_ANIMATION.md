# Fase 7F: Sistema de Animación Cinemática por Keyframes

**Módulo:** `src/services/animation/keyframeEngine.ts`
**Estado:** Implementado y Validado

---

## 1. Parámetros Espaciales Interpolables

1. **Posición X (`positionX`):** Desplazamiento horizontal en píxeles.
2. **Posición Y (`positionY`):** Desplazamiento vertical en píxeles.
3. **Escala (`scale`):** Factor multiplicador de zoom continuo (ej. 1.0 a 1.25 para Ken Burns).
4. **Rotación (`rotation`):** Inclinación angular en grados.
5. **Opacidad (`opacity`):** Factor de transparencia alfa (0.0 a 1.0).

## 2. Algoritmo de Búsqueda e Interpolación
1. Ordenación de keyframes ascendente por `timeOffsetMs`.
2. Clamping automático si el cabezal de tiempo se encuentra antes del primer keyframe o después del último.
3. Búsqueda de segmento envolvente $[k_1, k_2]$ mediante recorrido lineal rápido.
4. Normalización $rawT = \frac{t - k_1.timeOffsetMs}{k_2.timeOffsetMs - k_1.timeOffsetMs}$.
5. Modulación del tiempo relativo con la curva de aceleración configurada en $k_2.easing$.
6. Interpolación de valor escalar: $value = k_1.val + (k_2.val - k_1.val) \cdot easedT$.
