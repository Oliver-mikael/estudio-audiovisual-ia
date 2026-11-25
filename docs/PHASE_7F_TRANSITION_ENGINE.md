# Fase 7F: Especificación Técnica del Motor de Transiciones

**Módulo:** `src/services/animation/transitionEngine.ts`
**Estado:** Implementado y Validado

---

## 1. Tipos de Transición Soportados

| Tipo | Identificador | Comportamiento en Canvas 2D |
|---|---|---|
| **Corte directo** | `cut` | Cambio instantáneo de cuadro en el punto medio de transición. |
| **Fundido** | `fade` / `crossfade` | Mezcla alfa lineal/suave entre el fotograma saliente y entrante. |
| **Deslizamiento Izquierda** | `slide-left` | Desplazamiento horizontal de ambos fotogramas de derecha a izquierda. |
| **Deslizamiento Derecha** | `slide-right` | Desplazamiento horizontal de ambos fotogramas de izquierda a derecha. |
| **Deslizamiento Arriba** | `slide-up` | Desplazamiento vertical de fotogramas hacia arriba. |
| **Deslizamiento Abajo** | `slide-down` | Desplazamiento vertical de fotogramas hacia abajo. |
| **Zoom In** | `zoom-in` | Expansión del fotograma saliente y entrada ampliada del entrante. |
| **Zoom Out** | `zoom-out` | Reducción concéntrica del fotograma saliente hacia el centro. |
| **Barrido Izquierda** | `wipe-left` | Revelación por recorte rectangular horizontal de derecha a izquierda. |
| **Barrido Derecha** | `wipe-right` | Revelación por recorte rectangular horizontal de izquierda a derecha. |
| **Fundido a Negro** | `fade-to-black` | Caída progresiva a negro absoluto en t < 0.5 y emergencia del fotograma entrante en t >= 0.5. |
| **Fundido desde Negro** | `fade-from-black` | Fotograma completamente negro que se desvanece revelando el nuevo contenido. |

## 2. Easing y Curvas de Aceleración
- `linear`: `t`
- `ease-in`: `t * t`
- `ease-out`: `t * (2 - t)`
- `ease-in-out`: `t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t`
