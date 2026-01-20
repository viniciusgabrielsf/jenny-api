import { DataTypes } from 'sequelize';
import { Table, Model, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export type ISessionRefreshToken = {
    id: string;
    token: string;
    userId: string;
    familyId: string;
    isRevoked: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

@Table({ tableName: 'auth_refresh_token', timestamps: true })
export default class AuthRefreshToken extends Model {
    @Column({
        allowNull: false,
        type: DataTypes.UUIDV4,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    })
    id!: string;

    @Column({ field: 'token', allowNull: false, type: DataTypes.TEXT })
    token!: string;

    @Column({ field: 'user_id', allowNull: false, type: DataTypes.UUIDV4 })
    userId!: string;

    @Column({ field: 'family_id', allowNull: false, type: DataTypes.UUIDV4 })
    familyId!: string;

    @Column({ field: 'is_revoked', allowNull: false, type: DataTypes.BOOLEAN })
    isRevoked!: boolean;

    @Column({ field: 'expires_at', allowNull: false, type: DataTypes.DATE })
    expiresAt!: Date;

    @Column({ field: 'created_at', allowNull: false, type: DataTypes.DATE })
    @CreatedAt
    createdAt!: Date;

    @Column({ field: 'updated_at', allowNull: false, type: DataTypes.DATE })
    @UpdatedAt
    updatedAt!: Date;
}
