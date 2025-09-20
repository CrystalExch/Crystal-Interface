/**
 * @type LayoutDrawings - represents state of all line tools (drawings) within a layout ?
 * @type SavedDrawings - maps each chart layout's key to its corresponding drawings
 */
type LayoutDrawings = Record<string, any>;
type SavedDrawings = Record<string, LayoutDrawings>;

/**
 * storageKeys
 *
 * const object containing keys used to store the data in localStorage
 * only uses charts and drawings, will fix if indicators arent part of the chart but tv says they are
 */
const storageKeys = {
  charts: 'LocalStorageSaveLoadAdapter_charts',
  drawings: 'LocalStorageSaveLoadAdapter_drawings',
} as const;

export class LocalStorageSaveLoadAdapter {
  private _charts: any[] = [];
  protected _drawings: SavedDrawings = {};
  private _isDirty = false; // unsaved changes

  /**
   * constructor
   *
   * initializes by loading existing data from localStorage
   * creates periodic save mechanism that writes changes to localStorage every second
   */
  public constructor() {
    this._charts = this._getFromLocalStorage<any[]>(storageKeys.charts) ?? [];
    this._drawings =
      this._getFromLocalStorage<SavedDrawings>(storageKeys.drawings) ?? {};

    setInterval(() => {
      if (this._isDirty) {
        this._saveAllToLocalStorage();
        this._isDirty = false;
      }
    }, 1000);
  }

  /**
   * getAllChartTemplates
   *
   * not implemented as chart templates aren't saved
   *
   * @returns {Promise<string[]>} - promise that resolves to empty array
   */
  public getAllChartTemplates(): Promise<string[]> {
    return Promise.resolve([]);
  }

  /**
   * getAllCharts
   *
   * retrieves all saved chart layouts
   *
   * @returns {Promise<ChartMetaInfo[]>} - promise that resolves to an array of ChartMetaInfo objects
   */
  public getAllCharts(): Promise<any[]> {
    const metaInfo: any[] = this._charts.map(
      ({ id, name, resolution, symbol, timestamp }) => ({
        id: id ?? '',
        name,
        resolution,
        symbol,
        timestamp,
      }),
    );
    return Promise.resolve(metaInfo);
  }

  /**
   * getAllStudyTemplates
   *
   * not implemented as study templates aren't saved
   *
   * @returns {Promise<StudyTemplateMetaInfo>[]} - promise that resolves to an empty array
   */
  public getAllStudyTemplates(): Promise<any[]> {
    return Promise.resolve([]);
  }

  /**
   * getChartContent
   *
   * loads the chart layout content
   *
   * @param {string | number} chartId - unique id of the chart to load
   * @returns {Promise<string>} = promise that resolves to the json string of the chart layout
   */
  public getChartContent(chartId: number | string): Promise<string> {
    const chart = this._charts.find((c) => c.id === chartId);
    if (!chart) {
      return Promise.resolve('');
    }

    return Promise.resolve(chart.content);
  }

  /**
   * getChartTemplatecontent
   *
   * not implemented as chart templates are unused
   *
   * @param {string} _templateName - name of the template
   * @returns {Promise<ChartTemplate>} - a rejected promise as templates are unused
   */
  public getChartTemplateContent(_templateName: string): Promise<any> {
    return Promise.reject(new Error('not using chart templates'));
  }

  /**
   * getDrawingTemplates
   *
   * not implemented as drawing templates are unused
   *
   * @param {string} _toolName - name of drawing tool
   * @returns {Promise<string[]>} - promise that resolves to empty array
   */
  public getDrawingTemplates(_toolName: string): Promise<string[]> {
    return Promise.resolve([]);
  }

  /**
   * getStudyTemplateContent
   *
   * not implemented as study templates are unused
   *
   * @param {StudyTemplateMetaInfo} _studyTemplateInfo - study template metadata
   * @returns {Promise<string>} - promise that rejects w error
   */
  public getStudyTemplateContent(_studyTemplateInfo: any): Promise<string> {
    return Promise.reject(new Error('not using study templates'));
  }

  /**
   * loadDrawingTemplate
   *
   * not implemented as drawing templates are unused
   *
   * @param {string} _toolName - name of the drawing tool
   * @param {string} _templateName - name of the template
   * @returns  {Promise<string>} - promise that rejects w error
   */
  public loadDrawingTemplate(
    _toolName: string,
    _templateName: string,
  ): Promise<string> {
    return Promise.reject(new Error('not using drawing templates'));
  }

  /**
   * loadLineToolsAndGroups
   *
   * loads drawings and drawing groups associated with a chart layout.
   *
   * @param {string | undefined} _layoutId - chart layout id
   * @param {string | number} _chartId - chart id.
   * @param {LineToolsAndGroupsLoadRequestType} _requestType - type of load req
   * @param {LineToolsAndGroupsLoadRequestContext} _requestContext - additional req info
   * @returns {Promise<Partial<LineToolsAndGroupsState> | null>} - promise that resolves to state of drawings and drawing groups state
   */
  public loadLineToolsAndGroups(
    layoutId: string | undefined,
    chartId: string | number,
    _requestType: any,
    _requestContext: any,
  ): Promise<Partial<any> | null> {
    if (!layoutId) {
      return Promise.resolve(null);
    }

    const key = this._getDrawingKey(layoutId, chartId);
    const rawSources = this._drawings[key];

    if (!rawSources) {
      return Promise.resolve(null);
    }

    const sources = new Map<any, any | null>();

    for (const [toolId, toolState] of Object.entries(rawSources)) {
      sources.set(toolId as unknown as any, toolState);
    }

    return Promise.resolve({ sources });
  }

  /**
   * removeChart
   *
   * removes chart layout by id
   *
   * @param {string | number} id - unique id of chart to remove
   * @returns {Promise<void>} - promise that resolves when chart is removed
   * @throws {Error} - if chart w specified id doesnt exist
   */
  public removeChart(id: string | number): Promise<void> {
    const index = this._charts.findIndex((c) => c.id === id);
    if (index !== -1) {
      this._charts.splice(index, 1);
      this._isDirty = true;
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(`unable to remove chart w id ${id} as it doesnt exist`),
    );
  }

  /**
   * removeChartTemplate
   *
   * not implemented as chart templates are unused
   *
   * @param {string} _templateName - name of template
   * @returns {Promise<void>} - a promise that rejects w an error
   */
  public removeChartTemplate(_templateName: string): Promise<void> {
    return Promise.reject(new Error('not using chart templates'));
  }

  /**
   * removeDrawingTemplate
   *
   * not implemented as drawing templates are unused
   *
   * @param {string} _toolName - name of drawing tool
   * @param {string} _templateName - name of template
   * @return {Promise<void>} - promise that rejects w error
   */
  public removeDrawingTemplate(
    _toolName: string,
    _templateName: string,
  ): Promise<void> {
    return Promise.reject(new Error('not using drawing templates'));
  }

  /**
   * removeStudyTemplate
   *
   * not implemented as study templates are unused
   *
   * @param {StudyTemplateMetaInfo} _studyTemplateInfo - meta info of the study template
   */
  public removeStudyTemplate(_studyTemplateInfo: any): Promise<void> {
    return Promise.reject(new Error('not using study templates'));
  }

  /**
   * saveChart
   *
   * saves chart layout to adapter, if it already exists, removes old one
   *
   * @param {ChartData} chartData - chart data to save
   * @returns {Promise<string | number>} - promise that resolves to the unique id of the new chart
   */
  public async saveChart(chartData: any): Promise<string | number> {
    const marketId = (chartData.symbol || 'UnnamedSymbol').replace('/', '_');
    const finalId = `layout_${marketId}`;

    await this.removeChart(finalId).catch(() => { });

    const savedChartData: any = {
      ...chartData,
      id: finalId,
      timestamp: Math.round(Date.now() / 1000),
    };

    this._charts.push(savedChartData);
    this._isDirty = true;

    return finalId;
  }

  /**
   * saveChartTemplate
   *
   * not implemented as chart templates are unused
   *
   * @param {string} _newName - name of template
   * @param {ChartTemplateContent} _theme - template content
   * @returns {Promise<void>} - promise that rejects w error
   */
  public saveChartTemplate(_newName: string, _theme: any): Promise<void> {
    return Promise.reject(new Error('not using chart templates'));
  }

  /**
   * saveDrawingTemplate
   *
   * not implemented as drawing templates are unused
   *
   * @param {string} _toolName - name of drawing tool
   * @param {string} _templateName - name of template
   * @param {string} _content - content of drawing template
   * @returns {Promise<void>} - promise that rejects w error
   */
  public saveDrawingTemplate(
    _toolName: string,
    _templateName: string,
    _content: string,
  ): Promise<void> {
    return Promise.reject(new Error('Drawing templates are not supported.'));
  }

  /**
   * saveLineToolsAndGroups
   *
   * saves drawings and drawing groups associated with a chart layout
   *
   * @param {string} layoutId - chart layout id
   * @param {string | number} chartId - chart id
   * @param {LineToolsAndGroupsState} state - state of drawings and drawing groups
   * @returns {Promise<void>} - promise that resolves when save is complete
   */
  public async saveLineToolsAndGroups(
    layoutId: string,
    chartId: string | number,
    state: any,
  ): Promise<void> {
    const drawings = state.sources;
    if (!drawings) return;

    const key = this._getDrawingKey(layoutId, chartId);

    if (!this._drawings[key]) {
      this._drawings[key] = {};
    }

    for (const [toolId, toolState] of Object.entries(drawings)) {
      if (toolState === null) {
        delete this._drawings[key][toolId];
      } else {
        this._drawings[key][toolId] = toolState;
      }
    }

    this._isDirty = true;
  }

  /**
   * saveStudyTemplate
   *
   * not implemented as study templates are unused
   *
   * @param {StudyTemplateData} _studyTemplateData - study template data to save
   * @returns {Promise<void>} - promise that rejects w error
   */
  public saveStudyTemplate(_studyTemplateData: any): Promise<void> {
    return Promise.reject(new Error('Study templates are not supported.'));
  }

  private _getDrawingKey(layoutId: string, chartId: string | number): string {
    return `${layoutId}/${chartId}`;
  }

  protected _getFromLocalStorage<T>(key: string): T | null {
    const data = window.localStorage.getItem(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`error parsing localStorage key ${key}:`, error);
      return null;
    }
  }

  protected _saveToLocalStorage(key: string, data: any): void {
    try {
      const dataString = JSON.stringify(data);
      window.localStorage.setItem(key, dataString);
    } catch (error) {
      console.error(`error saving to localStorage key ${key}:`, error);
    }
  }

  protected _saveAllToLocalStorage(): void {
    this._saveToLocalStorage(storageKeys.charts, this._charts);
    this._saveToLocalStorage(storageKeys.drawings, this._drawings);
  }
}
