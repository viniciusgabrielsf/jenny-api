import { DataTypes } from 'sequelize';
import { Table, Model, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum PaymentCategory {
    FOOD = 'food',
    TRANSPORT = 'transport',
    ENTERTAINMENT = 'entertainment',
    UTILITIES = 'utilities',
    OTHER = 'other',
}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export type IPayment = {
    id: string;
    userId: string;
    title: string;
    amount: number;
    paymentDate: Date;
    category: PaymentCategory;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
};

@Table({ tableName: 'payment', timestamps: true })
export default class Payment extends Model {
    @Column({
        allowNull: false,
        type: DataTypes.BIGINT,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    })
    id!: string;

    @Column({ field: 'user_id', allowNull: false, type: DataTypes.UUIDV4 })
    userId!: string;

    @Column({ field: 'title', allowNull: false, type: DataTypes.TEXT })
    title!: string;

    @Column({
        field: 'amount',
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
            min: 1,
        },
    })
    amount!: number;

    @Column({ field: 'payment_date', allowNull: false, type: DataTypes.DATE })
    paymentDate!: Date;

    @Column({
        field: 'category',
        allowNull: false,
        type: DataTypes.ENUM(...Object.values(PaymentCategory)),
    })
    category!: PaymentCategory;

    @Column({
        field: 'status',
        allowNull: false,
        type: DataTypes.ENUM(...Object.values(PaymentStatus)),
    })
    status!: PaymentStatus;

    @Column({ field: 'created_at', allowNull: false, type: DataTypes.DATE })
    @CreatedAt
    createdAt!: Date;

    @Column({ field: 'updated_at', allowNull: false, type: DataTypes.DATE })
    @UpdatedAt
    updatedAt!: Date;
}
