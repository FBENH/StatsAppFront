// Los primeros 10 m de media cancha FIBA, en coordenadas de 0 a 1: x a lo ancho (15 m), y desde la línea de fondo.
// Más lejos casi no hay tiros, y así la cancha entra en la pantalla del celular.
// El dibujo usa un viewBox de 150 x 100, o sea decímetros.
export const ANCHO = 150;
export const LARGO = 100;
export const ARO = { x: 75, y: 15.75 };
export const RADIO_TRIPLE = 67.5;
/** Las rectas del triple en las esquinas están a 90 cm de la línea lateral. */
export const ESQUINA_X = 9;
export const ESQUINA_Y = ARO.y + Math.sqrt(RADIO_TRIPLE ** 2 - (ARO.x - ESQUINA_X) ** 2);

const enDecimetros = (x: number, y: number) => ({ px: x * ANCHO, py: y * LARGO });

/** Si un tiro desde ese lugar vale 2 o 3. */
export function valorDeTiro(x: number, y: number): 2 | 3 {
  const { px, py } = enDecimetros(x, y);
  if (py < ESQUINA_Y) return px < ESQUINA_X || px > ANCHO - ESQUINA_X ? 3 : 2;
  return Math.hypot(px - ARO.x, py - ARO.y) > RADIO_TRIPLE ? 3 : 2;
}

/** Descripción corta del lugar, para el relato: "desde la esquina derecha", "bajo el aro". */
export function zona(x: number, y: number): string {
  const { px, py } = enDecimetros(x, y);
  const distancia = Math.hypot(px - ARO.x, py - ARO.y);
  // Como se ve en el dibujo, con el aro arriba: es también la izquierda del que tira mirando al aro.
  const lado = px < ARO.x ? 'izquierda' : 'derecha';
  const frontal = Math.abs(px - ARO.x) < 25;
  if (distancia < 15) return 'bajo el aro';
  if (valorDeTiro(x, y) === 3) {
    if (py < ESQUINA_Y) return `desde la esquina ${lado}`;
    return frontal ? 'de frente' : `desde la ${lado}`;
  }
  if (Math.abs(px - ARO.x) < 24.5 && py < 58) return 'en la pintura';
  return frontal ? 'de media distancia, de frente' : `de media distancia desde la ${lado}`;
}
