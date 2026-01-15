import { DataTypes } from 'sequelize';
import {
    Table,
    Model,
    Column,
    CreatedAt,
    UpdatedAt,
    BeforeCreate,
    IsEmail,
    BeforeUpdate,
} from 'sequelize-typescript';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import * as bcrypt from 'bcryptjs';

// export const User = sequelize.define(
//     'user_account',
//     {
//         id: {
//             type: DataTypes.UUIDV4,
//             primaryKey: true,
//             defaultValue: DataTypes.UUIDV4,
//             allowNull: false,
//         },
//         fullName: {
//             type: DataTypes.TEXT,
//             field: 'full_name',
//             unique: true,
//             allowNull: false,
//         },
//         email: {
//             type: DataTypes.DATEONLY,
//             unique: true,
//             allowNull: false,
//         },
//         birthDate: {
//             type: DataTypes.DATEONLY,
//             field: 'birth_date',
//             allowNull: false,
//         },
//         passwordHash: {
//             type: DataTypes.TEXT,
//             field: 'password_hash',
//             allowNull: false,
//         },
//         createdAt: {
//             type: DataTypes.DATE,
//             field: 'created_at',
//             allowNull: false,
//         },
//         updatedAt: {
//             type: DataTypes.DATE,
//             field: 'updated_at',
//             allowNull: false,
//         },
//     },
//     {
//         timestamps: true,
//         createdAt: 'createdAt',
//         updatedAt: 'updatedAt',
//     }
// );

export type IUser = {
    id: string;
    fullName: string;
    email: string;
    birthDate: Date;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
};

@Table({ tableName: 'user_account', timestamps: true })
export default class User extends Model {
    @Column({
        allowNull: false,
        type: DataTypes.UUIDV4,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    })
    id!: string;

    @Column({ field: 'full_name', allowNull: false, type: DataTypes.TEXT })
    fullName!: string;

    @IsEmail
    @Column({ allowNull: false, type: DataTypes.TEXT, unique: true })
    email!: string;

    @Column({ field: 'birth_date', allowNull: false, type: DataTypes.DATEONLY })
    birthDate!: Date;

    @Column({ field: 'password_hash', allowNull: false, type: DataTypes.TEXT })
    passwordHash!: string;

    @Column({ field: 'created_at', allowNull: false, type: DataTypes.DATE })
    @CreatedAt
    createdAt!: Date;

    @Column({ field: 'updated_at', allowNull: false, type: DataTypes.DATE })
    @UpdatedAt
    updatedAt!: Date;

    @BeforeCreate
    @BeforeUpdate
    static validateEmail(instance: User): void {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+/;

        instance.email = instance.email.toLowerCase().trim();

        if (!instance.email) {
            throw new BadRequestException('Email is required');
        }

        if (!emailPattern.test(instance.email)) {
            throw new BadRequestException('Invalid email');
        }
    }

    @BeforeCreate
    @BeforeUpdate
    static validateFullName(instance: User): void {
        instance.fullName = instance.fullName.trim();

        if (instance.fullName.length < 3) {
            throw new BadRequestException('Full name must be at least 3 characters long');
        }

        if (instance.fullName.length > 100) {
            throw new BadRequestException('Full name must be less than 100 characters');
        }

        if (!instance.fullName) {
            throw new BadRequestException('Full name is required');
        }
    }

    @BeforeCreate
    @BeforeUpdate
    static validateBirthDate(instance: User): void {
        if (!instance.birthDate) {
            throw new BadRequestException('Birth date is required');
        }

        const today = new Date();
        if (instance.birthDate >= today) {
            throw new BadRequestException('Birth date must be in the past');
        }
    }

    @BeforeCreate
    static async hashPassword(instance: User) {
        const salt = await bcrypt.genSalt(10);
        instance.passwordHash = await bcrypt.hash(instance.passwordHash, salt);
    }

    @BeforeUpdate
    static async hashPasswordOnUpdate(instance: User) {
        if (!instance.changed('passwordHash')) {
            return;
        }

        User.hashPassword(instance);
    }

    async checkPassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.passwordHash);
    }
}
