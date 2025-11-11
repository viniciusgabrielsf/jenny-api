export const mockSequelizeTypescript = () => {
    const noopDecorator =
        () =>
        (_target: any, _propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {};

    jest.mock('sequelize-typescript', () => ({
        Table: (opts?: any) => (constructor: any) => constructor,
        Column: (opts?: any) => noopDecorator(),
        CreatedAt: noopDecorator,
        UpdatedAt: noopDecorator,
        BeforeCreate: noopDecorator,
        BeforeUpdate: noopDecorator,
        IsEmail: noopDecorator,
        Model: class {}, // simple stub so classes can extend it in tests
    }));
};
