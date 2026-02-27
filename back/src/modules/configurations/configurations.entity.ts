import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Congregation } from '../congregation/congregation.entity';

@Entity('congregation_config')
@Unique('UQ_congregation_config_key', ['congregation_id', 'config_key'])
export class Configuration extends CommonEntity {
  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @ApiProperty({ example: 'theme_palette' })
  @Column({ type: 'varchar', length: 120, nullable: false })
  config_key: string;

  @ApiProperty({
    example: {
      light: {
        primary: '#1976d2',
        secondary: '#9c27b0',
        backgroundDefault: '#f5f7fb',
        backgroundPaper: '#ffffff',
      },
      dark: {
        primary: '#90caf9',
        secondary: '#ce93d8',
        backgroundDefault: '#121212',
        backgroundPaper: '#1e1e1e',
      },
    },
  })
  @Column({ type: 'json', nullable: false, default: {} })
  config_value: Record<string, unknown>;
}
