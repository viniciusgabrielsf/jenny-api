import { DataTypes } from 'sequelize';
import {
    Table,
    Model,
    Column,
    CreatedAt,
    UpdatedAt,
    ForeignKey,
    BelongsTo,
    PrimaryKey,
} from 'sequelize-typescript';
import Team from './team.model';
import User from './user.model';

export type ITeamMembership = {
    teamId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

@Table({ tableName: 'team_membership', timestamps: true })
export default class TeamMembership extends Model {
    @PrimaryKey
    @ForeignKey(() => Team)
    @Column({ field: 'team_id', allowNull: false, type: DataTypes.UUIDV4 })
    teamId!: string;

    @PrimaryKey
    @ForeignKey(() => User)
    @Column({ field: 'user_id', allowNull: false, type: DataTypes.UUIDV4 })
    userId!: string;

    @BelongsTo(() => Team, 'teamId')
    team?: Team;

    @BelongsTo(() => User, 'userId')
    user?: User;

    @Column({ field: 'created_at', allowNull: false, type: DataTypes.DATE })
    @CreatedAt
    createdAt!: Date;

    @Column({ field: 'updated_at', allowNull: false, type: DataTypes.DATE })
    @UpdatedAt
    updatedAt!: Date;
}
