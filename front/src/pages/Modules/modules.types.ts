export interface DashboardModuleView {
  id: string;
  title: string;
  description: string;
}

export interface ModulesRendererProps {
  module: DashboardModuleView;
  showSummary?: boolean;
}
