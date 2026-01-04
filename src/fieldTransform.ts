export function fieldTransform<Val, Raw>(fromValue: (value: Val) => Raw, toValue: (raw: Raw) => Val): FieldTransform<Val, Raw> {
  return {fromValue, toValue}
}

export type FieldTransform<Val, Raw> = {
  fromValue: (value: Val) => Raw
  toValue:   (raw: Raw) => Val
}

