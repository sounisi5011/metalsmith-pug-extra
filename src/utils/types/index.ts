export type isAnyArray = (
    value: unknown,
) => value is unknown[] | readonly unknown[];

export * from './deep-readonly';
