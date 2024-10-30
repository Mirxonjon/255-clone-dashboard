import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateUsersDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
