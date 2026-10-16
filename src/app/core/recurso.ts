import { Resource } from '@angular/core';

/** Valor de un resource, o undefined mientras carga o si falló. `value()` tira una excepción cuando el resource está en error. */
export function valor<T>(r: Resource<T>): T | undefined {
  return r.hasValue() ? r.value() : undefined;
}
