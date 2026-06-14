import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { ModuleSectionActions } from './ModuleSectionActions';
import { ModuleSectionAction } from './ModuleSectionActions.types';
import { ModuleStandardActionsProps } from './ModuleStandardActions.types';

export const ModuleStandardActions = ({
  createAction,
  refreshAction,
  extraActions = [],
}: ModuleStandardActionsProps) => {
  const actions: ModuleSectionAction[] = [
    ...extraActions,
    ...(createAction
      ? [
          {
            ...createAction,
            icon: AddRoundedIcon,
            color: 'primary' as const,
          },
        ]
      : []),
    {
      ...refreshAction,
      icon: RefreshRoundedIcon,
      color: 'secondary' as const,
    },
  ];

  return <ModuleSectionActions actions={actions} />;
};
