import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findByAppleId(appleId: string) {
    return this.usersRepository.findByAppleId(appleId);
  }

  async create(dto: CreateUserDto) {
    return this.usersRepository.create(dto);
  }

  async update(id: string, dto: UpdateUserDto) {
    return await this.usersRepository.update(id, dto);
  }
}
