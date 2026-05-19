import { UsersService } from '../services/users.service';
import { Request, Response } from 'express';
import { NotFoundException } from '../helpers/exceptions/not-found.exception';
import { BadRequestException } from '../helpers/exceptions/bad-request.exception';
import { getUsersFilterSchema } from '../helpers/schemas/users/get-users.schema';
import { getOptionsSchema } from '../helpers/schemas/get-options.schema';

export class UsersController {
    constructor(private usersService: UsersService) {}

    getUsers = async (req: Request, res: Response): Promise<void> => {
        let filter, options;

        try {
            filter = getUsersFilterSchema.parse(req.query?.filter || {});
            options = getOptionsSchema.parse(req.query);
        } catch (error) {
            throw new BadRequestException('Parâmetros de consulta inválidos');
        }

        const result = await this.usersService.getUsers({
            ...options,
            filter,
        });

        res.status(200).json(result);
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
