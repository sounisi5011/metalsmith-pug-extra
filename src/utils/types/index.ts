export type isReadonlyOrWritableArray = (
    value: unknown,
) => value is unknown[] | readonly unknown[];

export * from './deep-readonly';
