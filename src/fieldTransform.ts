export function fieldTransform<T, U>(fromValue: (value: T) => U, toValue: (raw: U) => T): FieldTransform<T, U> {
  return {fromValue, toValue}
}

export type FieldTransform<T, U> = {
  fromValue: (value: T) => U
  toValue:   (raw: U) => T
}

