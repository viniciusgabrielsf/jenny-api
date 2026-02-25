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
        res.json({ message: 'Usuário criado com sucesso' });
    };

    getCurrentUser = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuário não encontrado');

        const user = await this.usersService.getUser(userId, {
            attributes: { exclude: ['passwordHash', 'createdAt', 'updatedAt'] },
        });

        if (!user) throw new NotFoundException('Usuário não encontrado');

        res.status(200);
        res.json(user);
    };

    updateUser = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuário não encontrado');

        const { fullName, email, birthDate, avatar } = req.body;

        await this.usersService.updateUser(userId, {
            fullName,
            email,
            birthDate,
            avatar,
        });

        res.status(200);
        res.json({ message: 'Usuário atualizado com sucesso' });
    };

    updatePassword = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        if (!userId) throw new NotFoundException('Usuário não encontrado');

        const { oldPassword, newPassword } = req.body;

        await this.usersService.updatePassword(userId, oldPassword, newPassword);

        res.status(200);
        res.json({ message: 'Senha atualizada com sucesso' });
    };
}
