import { ApiProperty } from '@nestjs/swagger';

export class LoginProps {
  @ApiProperty({
    required: true,
    example: 'admin',
  })
  username: string;

  @ApiProperty({
    required: true,
    example: '1234',
  })
  password: string;
}
