/**
 * @see https://blog.dotnetnerd.dk/post/2017/07/12/TypeScript-patterns-Lazy.aspx
 */

export type ILazyInitializer<T> = () => T

function hasLengthProperty<T>(obj: T): obj is T & Record<'length', number> {
    return Object.prototype.hasOwnProperty.call(obj, 'length')
}

export class Lazy<T> {
    private instance: T | null = null;
    private name: string | undefined = undefined;
    private initializer: ILazyInitializer<T>;

    constructor(initializer: ILazyInitializer<T>, name?: string) {
        this.initializer = initializer;
        this.name = name;
    }

    public get value(): T {
        if (this.instance == null) {
            this.instance = this.initializer();

            if (hasLengthProperty(this.instance)) {
                console.log(this.name ?? '', 'length', this.instance.length);
            }
        }
        return this.instance;
    }
}

