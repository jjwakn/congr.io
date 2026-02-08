import { Feature } from 'src/utils/constants';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';

export interface SetupProps {
  role: {
    name: string;
  };
  user: {
    username: string;
    password: string;
    name: string;
  };
  congregation: {
    name: string;
    type: string;
    locations: Array<Pick<Location, 'order' | 'name' | 'address'>>;
    features: Feature[];
    logo_small?: Buffer;
    logo_large?: Buffer;
  };
}

export interface SetupResponse {
  isSetup: true;
  congregation: Pick<Congregation, 'id' | 'name' | 'type' | 'features'> & {
    locations: Array<Pick<Location, 'id' | 'order' | 'name' | 'address'>>;
    has_logo_small: boolean;
    has_logo_large: boolean;
  };
}
