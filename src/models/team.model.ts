import { DataTypes } from 'sequelize';
import {
    Table,
    Model,
    Column,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import User from './user.model';

export type ITeam = {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
};

@Table({ tableName: 'team', timestamps: true })
export default class Team extends Model {
    @Column({
        allowNull: false,
        type: DataTypes.UUIDV4,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    })
    id!: string;

    @Column({ allowNull: false, type: DataTypes.TEXT })
    name!: string;

    @ForeignKey(() => User)
    @Column({ field: 'created_by_user_id', allowNull: false, type: DataTypes.UUIDV4 })
    createdByUserId!: string;

    @BelongsTo(() => User, 'createdByUserId')
    createdByUser?: User;

    @Column({ field: 'created_at', allowNull: false, type: DataTypes.DATE })
    @CreatedAt
    createdAt!: Date;

    @Column({ field: 'updated_at', allowNull: false, type: DataTypes.DATE })
    @UpdatedAt
    updatedAt!: Date;
}
