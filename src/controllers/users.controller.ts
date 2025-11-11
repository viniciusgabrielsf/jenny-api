import { UsersService } from '../services/users.service';
import { Request, Response } from 'express';

export class UsersController {
    constructor(private usersService: UsersService) {}

    getUsers = async (req: Request, res: Response): Promise<void> => {
        console.log('Fetching users...');

        const users = await this.usersService.getUsers({
            attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] },
        });

        res.status(200);
        res.json(users);
    };

    creatUser = async (req: Request, res: Response): Promise<void> => {
        const { name, email, password } = req.body;

        const newUser = await this.usersService.createUser(name, email, password);

        res.status(201);
        res.json(newUser);
    };
}
