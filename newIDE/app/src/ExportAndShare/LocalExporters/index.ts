import { type Exporter } from '../ShareDialog';
import { localCordovaExportPipeline } from './LocalCordovaExport';
import { localElectronExportPipeline } from './LocalElectronExport';
import { localHTML5ExportPipeline } from './LocalHTML5Export';
import { localFacebookInstantGamesExportPipeline } from './LocalFacebookInstantGamesExport';
import { localOnlineCordovaExportPipeline } from './LocalOnlineCordovaExport';
import { localOnlineCordovaIosExportPipeline } from './LocalOnlineCordovaIosExport';
import { localOnlineElectronExportPipeline } from './LocalOnlineElectronExport';
import { localOnlineWebExportPipeline } from './LocalOnlineWebExport';
import { cordovaExporter } from '../GenericExporters/CordovaExport';
import { onlineWebExporter } from '../GenericExporters/OnlineWebExport';
import { html5Exporter } from '../GenericExporters/HTML5Export';
import { facebookInstantGamesExporter } from '../GenericExporters/FacebookInstantGamesExport';
import { onlineCordovaExporter } from '../GenericExporters/OnlineCordovaExport';
import { onlineCordovaIosExporter } from '../GenericExporters/OnlineCordovaIosExport';
import { onlineElectronExporter } from '../GenericExporters/OnlineElectronExport';
import { electronExporter } from '../GenericExporters/ElectronExport';

export const localOnlineWebExporter: Exporter = {
  ...onlineWebExporter,
  key: 'onlinewebexport',
  exportPipeline: localOnlineWebExportPipeline,
};

export const localAutomatedExporters: Array<Exporter> = [
  {
    ...html5Exporter,
    key: 'webexport',
    exportPipeline: localHTML5ExportPipeline,
  },
  {
    ...onlineCordovaExporter,
    key: 'onlinecordovaexport',
    exportPipeline: localOnlineCordovaExportPipeline,
  },
  {
    ...onlineCordovaIosExporter,
    key: 'onlinecordovaiosexport',
    exportPipeline: localOnlineCordovaIosExportPipeline,
  },
  {
    ...onlineElectronExporter,
    key: 'onlineelectronexport',
    exportPipeline: localOnlineElectronExportPipeline,
  },
  {
    ...facebookInstantGamesExporter,
    key: 'facebookinstantgamesexport',
    exportPipeline: localFacebookInstantGamesExportPipeline,
  },
];

export const localManualExporters: Array<Exporter> = [
  {
    ...html5Exporter,
    key: 'webexport',
    exportPipeline: localHTML5ExportPipeline,
  },
  {
    ...cordovaExporter,
    key: 'cordovaexport',
    exportPipeline: localCordovaExportPipeline,
  },
  {
    ...electronExporter,
    key: 'electronexport',
    exportPipeline: localElectronExportPipeline,
  },
];
