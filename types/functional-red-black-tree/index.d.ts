
export = createTree

declare function createTree(): createTree.RedBlackTree<K, V>;

declare namespace createTree {
    interface RedBlackTree<K, V> {
        insert: (k: K, v: V) => RedBlackTree<K, V>;
        remove: (k: K) => RedBlackTree<K, V>;
        get: (k: K) => V | undefined
        length: number;
        forEach: (visitor: (key: K, value: V) => boolean) => void
        begin: RedBlackTreeIterator<K, V>;
    }

    interface RedBlackTreeIterator<K, V> {
        hasNext: boolean;
        next: () => void;
        key: K;
        value: V;
    }
}