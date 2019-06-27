// based on
// * https://github.com/krzkaczor/ts-essentials/blob/v2.0.11/lib/types.ts
// * https://stackoverflow.com/a/55930310/4907315

export type DeepReadonly<T> = T extends Primitive
    ? T
    : T extends (readonly (infer U)[])
    ? DeepReadonlyArray<U>
    : T extends ReadonlyMap<infer K, infer V>
    ? DeepReadonlyMap<K, V>
    : T extends ReadonlySet<infer U>
    ? DeepReadonlySet<U>
    : T extends Function
    ? T
    : T extends object
    ? DeepReadonlyObject<T>
    : unknown;

type Primitive = string | number | boolean | bigint | symbol | undefined | null;

type DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

export interface DeepReadonlyMap<K, V>
    extends ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> {}

export interface DeepReadonlySet<T> extends ReadonlySet<DeepReadonly<T>> {}
/* eslint-enable */
