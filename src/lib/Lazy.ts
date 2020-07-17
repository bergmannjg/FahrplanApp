/**
 * @see https://blog.dotnetnerd.dk/post/2017/07/12/TypeScript-patterns-Lazy.aspx
 */

export type ILazyInitializer<T> = () => T

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
            if (typeof (this.instance as any).length !== "undefined") {
                console.log(this.name ?? '', 'length', (this.instance as any).length);
            }
        }
        return this.instance;
    }
}

