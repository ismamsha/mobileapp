import { vi } from "vitest";

export type ChainResult = unknown;

export interface QueryChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  onDuplicateKeyUpdate: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

export function createQueryChain(resultOrError: ChainResult | Error): QueryChain {
  const throws = resultOrError instanceof Error ? resultOrError : null;
  const result = throws ? null : resultOrError;
  const resolve = () =>
    throws ? Promise.reject(throws) : Promise.resolve(result);

  const chain: QueryChain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    set: vi.fn(() => chain),
    values: vi.fn(() => chain),
    onDuplicateKeyUpdate: vi.fn(() => chain),
    then: vi.fn((onFulfilled, onRejected) =>
      resolve().then(onFulfilled, onRejected),
    ),
  };

  return chain;
}

export function createMockDrizzle() {
  const selectQueue: (ChainResult | Error)[] = [];
  const insertQueue: (ChainResult | Error)[] = [];
  const updateQueue: (ChainResult | Error)[] = [];
  const deleteQueue: (ChainResult | Error)[] = [];

  const next = <T>(queue: (ChainResult | Error)[]): T | Error =>
    (queue.shift() ?? []) as T | Error;

  const db = {
    queueSelect(result: ChainResult | Error) {
      selectQueue.push(result);
    },
    queueInsert(result: ChainResult | Error) {
      insertQueue.push(result);
    },
    queueUpdate(result: ChainResult | Error) {
      updateQueue.push(result);
    },
    queueDelete(result: ChainResult | Error) {
      deleteQueue.push(result);
    },
    clear() {
      selectQueue.length = 0;
      insertQueue.length = 0;
      updateQueue.length = 0;
      deleteQueue.length = 0;
    },
    getDb: vi.fn(() => db),
    select: vi.fn(() => createQueryChain(next(selectQueue))),
    insert: vi.fn(() => createQueryChain(next(insertQueue))),
    update: vi.fn(() => createQueryChain(next(updateQueue))),
    delete: vi.fn(() => createQueryChain(next(deleteQueue))),
  };

  return db;
}

export type MockDrizzle = ReturnType<typeof createMockDrizzle>;

export const mockDb = createMockDrizzle();
export const getDb = vi.fn(() => mockDb);
