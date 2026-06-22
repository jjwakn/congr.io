import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MarkerType,
  type Node,
  ReactFlow,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FlowEditorDialogProps, FlowStepDraft } from './flows.types';

const createStep = (order: number): FlowStepDraft => ({
  flow_key: crypto.randomUUID(),
  next_step_keys: [],
  order,
  name: '',
  description: '',
  enabled: true,
  position: { x: (order - 1) * 240, y: 80 },
});

export const FlowEditorDialog = ({ flow, submitting, onClose, onSubmit }: FlowEditorDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [name, setName] = useState(flow?.name ?? '');
  const [description, setDescription] = useState(flow?.description ?? '');
  const [enabled, setEnabled] = useState(flow?.enabled ?? true);
  const [steps, setSteps] = useState<FlowStepDraft[]>(() =>
    flow?.steps?.length
      ? flow.steps.map((step, index) => ({
          id: step.id,
          flow_key: step.flow_key ?? crypto.randomUUID(),
          next_step_keys: step.next_step_keys ?? [],
          order: index + 1,
          name: step.name,
          description: step.description,
          enabled: step.enabled,
          position: { x: index * 240, y: 80 },
        }))
      : [createStep(1)],
  );
  const [selectedKey, setSelectedKey] = useState(steps[0]?.flow_key ?? '');
  const [error, setError] = useState('');
  const selected = steps.find(({ flow_key }) => flow_key === selectedKey);

  const nodes = useMemo<Node[]>(
    () =>
      steps.map((step) => ({
        id: step.flow_key,
        position: step.position,
        data: { label: step.name || t('pages.flows.editor.unnamedStep') },
        selected: step.flow_key === selectedKey,
      })),
    [selectedKey, steps, t],
  );
  const edges = useMemo<Edge[]>(
    () =>
      steps.flatMap((step) =>
        step.next_step_keys.map((target) => ({
          id: `${step.flow_key}-${target}`,
          source: step.flow_key,
          target,
          markerEnd: { type: MarkerType.ArrowClosed },
        })),
      ),
    [steps],
  );

  const connect = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    const nextEdges = addEdge(connection, edges);
    setSteps((current) =>
      current.map((step) => ({
        ...step,
        next_step_keys: nextEdges.filter(({ source }) => source === step.flow_key).map(({ target }) => target),
      })),
    );
  };

  const submit = () => {
    if (!name.trim() || !steps.length || steps.some((step) => !step.name.trim())) {
      setError(t('pages.flows.editor.required'));
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      enabled,
      steps: steps.map(({ position: _position, ...step }, index) => ({
        ...step,
        order: index + 1,
        name: step.name.trim(),
        description: step.description.trim(),
      })),
    });
  };

  return (
    <Dialog open fullWidth maxWidth="lg" fullScreen={fullScreen} onClose={submitting ? undefined : onClose}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {flow ? t('pages.flows.editor.editTitle') : t('pages.flows.editor.createTitle')}
        <Tooltip title={t('form.field.close')}>
          <IconButton onClick={onClose} disabled={submitting}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            required
            label={t('form.field.name')}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            multiline
            minRows={2}
            label={t('pages.flows.description')}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={enabled} onChange={(_event, value) => setEnabled(value)} />}
            label={t('pages.settings.eventTypes.fields.enabled')}
          />
          <Box sx={{ height: 380, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              onConnect={connect}
              onNodeClick={(_event, node) => setSelectedKey(node.id)}
              onNodesChange={(changes) =>
                setSteps((current) =>
                  current.map((step) => {
                    const position = changes.find(
                      (change) => change.type === 'position' && change.id === step.flow_key,
                    );
                    return position?.type === 'position' && position.position
                      ? { ...step, position: position.position }
                      : step;
                  }),
                )
              }
              onEdgesDelete={(deleted) =>
                setSteps((current) =>
                  current.map((step) => ({
                    ...step,
                    next_step_keys: step.next_step_keys.filter(
                      (target) =>
                        !deleted.some(
                          ({ source, target: edgeTarget }) => source === step.flow_key && edgeTarget === target,
                        ),
                    ),
                  })),
                )
              }
            >
              <Background />
              <Controls />
            </ReactFlow>
          </Box>
          <Button
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              const step = createStep(steps.length + 1);
              setSteps((current) => [...current, step]);
              setSelectedKey(step.flow_key);
            }}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('pages.flows.editor.addStep')}
          </Button>
          {selected ? (
            <Stack spacing={2}>
              <TextField
                required
                label={t('pages.flows.editor.stepName')}
                value={selected.name}
                onChange={(event) =>
                  setSteps((current) =>
                    current.map((step) =>
                      step.flow_key === selected.flow_key ? { ...step, name: event.target.value } : step,
                    ),
                  )
                }
              />
              <TextField
                multiline
                minRows={2}
                label={t('pages.flows.editor.stepDescription')}
                value={selected.description}
                onChange={(event) =>
                  setSteps((current) =>
                    current.map((step) =>
                      step.flow_key === selected.flow_key ? { ...step, description: event.target.value } : step,
                    ),
                  )
                }
              />
              <Button
                color="error"
                startIcon={<DeleteOutlineRoundedIcon />}
                disabled={steps.length === 1}
                onClick={() => {
                  const remaining = steps
                    .filter(({ flow_key }) => flow_key !== selected.flow_key)
                    .map((step) => ({
                      ...step,
                      next_step_keys: step.next_step_keys.filter((key) => key !== selected.flow_key),
                    }));
                  setSteps(remaining);
                  setSelectedKey(remaining[0]?.flow_key ?? '');
                }}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t('pages.flows.editor.deleteStep')}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('form.field.cancel')}
        </Button>
        <Button variant="contained" onClick={submit} disabled={submitting}>
          {t('pages.settings.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
