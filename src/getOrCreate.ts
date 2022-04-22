import { Store } from '@subsquid/substrate-processor';

export async function get<T extends { id: string }>(
    store: Store,
    EntityConstructor: EntityConstructor<T>,
    id: string
): Promise<T | undefined> {
    let entity = await store.get<T>(EntityConstructor, { where: { id } });
    return entity;
}

export async function getOrCreate<T extends { id: string }>(
    store: Store,
    EntityConstructor: EntityConstructor<T>,
    id: string,
    init?: Partial<T>
): Promise<T> {
    let entity = await get(store, EntityConstructor, id);

    if (entity == null) {
        entity = new EntityConstructor();
        entity.id = id;
        if (init) Object.assign(entity, init);
    }

    return entity;
}

type EntityConstructor<T> = {
    new (...args: any[]): T;
};
