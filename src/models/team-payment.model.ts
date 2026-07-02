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
import Team from './team.model';
import User from './user.model';

export type ITeamPayment = {
    id: string;
    teamId: string;
    payerId: string;
    debtorsIds: string[];
    title: string;
    amount: number;
    paymentDate: Date;
    createdAt: Date;
    updatedAt: Date;
};

@Table({ tableName: 'team_payment', timestamps: true })
export default class TeamPayment extends Model {
    @Column({
        allowNull: false,
        type: DataTypes.UUIDV4,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    })
    id!: string;

    @ForeignKey(() => Team)
    @Column({ field: 'team_id', allowNull: false, type: DataTypes.UUIDV4 })
    teamId!: string;

    @ForeignKey(() => User)
    @Column({ field: 'payer_id', allowNull: false, type: DataTypes.UUIDV4 })
    payerId!: string;

    @Column({ field: 'debtors_ids', allowNull: false, type: DataTypes.ARRAY(DataTypes.UUIDV4) })
    debtorsIds!: string[];

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

    @CreatedAt
    @Column({ field: 'created_at' })
    createdAt!: Date;

    @UpdatedAt
    @Column({ field: 'updated_at' })
    updatedAt!: Date;

    @BelongsTo(() => Team, 'teamId')
    team?: Team;

    @BelongsTo(() => User, 'payerId')
    payer?: User;
}
