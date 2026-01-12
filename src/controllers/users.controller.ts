import { UsersService } from '../services/users.service';
import { Request, Response } from 'express';

export class UsersController {
    constructor(private usersService: UsersService) {}

    getUsers = async (req: Request, res: Response): Promise<void> => {
        const users = await this.usersService.getUsers({
            attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] },
        });

        res.status(200);
        res.json(users);
    };

    creatUser = async (req: Request, res: Response): Promise<void> => {
        const { fullName, email, birthDate, password } = req.body;

        await this.usersService.createUser(fullName, email, birthDate, password);

        res.status(201);
        res.json({ message: 'User created successfully' });
    };
}
