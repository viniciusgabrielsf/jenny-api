import { FindOptions } from 'sequelize/types/model';
import { IGetOptions } from '../config/interfaces';

export function buildBaseFindOptions<FilterType>(options?: IGetOptions<FilterType>): FindOptions {
    const findOptions: FindOptions = {};

    if (options?.orderField)
        findOptions.order = [[options.orderField, options.orderDirection || 'ASC']];

    if (options?.limit) findOptions.limit = options.limit;

    if (options?.offset) findOptions.offset = options.offset;

    return findOptions;
}
