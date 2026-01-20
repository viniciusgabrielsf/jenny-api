import { UsersService } from '../services/users.service';
import { Request, Response } from 'express';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
export class UsersController {
    constructor(private usersService: UsersService) {}

    getUsers = async (req: Request, res: Response): Promise<void> => {
        const users = await this.usersService.getUsers({
            attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] },
        });

        res.status(200);
        res.json(users);
    };

    createUser = async (req: Request, res: Response): Promise<void> => {
        const { fullName, email, birthDate, password } = req.body;

        await this.usersService.createUser(fullName, email, birthDate, password);

        res.status(201);
        res.json({ message: 'User created successfully' });
    };

    getCurrentUser = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('User not found');

        const user = await this.usersService.getUser(userId, {
            attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] },
        });

        if (!user) throw new NotFoundException('User not found');

        res.status(200);
        res.json(user);
    };
}
