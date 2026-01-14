import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal } from '@angular/core';
import { DynamicComponent } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';
import cytoscape from 'cytoscape';


interface KnowledgeGraphProperties {
    [k: string]: any;
    data: any;
    layout?: string;
    title?: string;
}

interface KnowledgeGraphNode extends Types.CustomNode {
    type: 'KnowledgeGraph';
    properties: KnowledgeGraphProperties;
}

@Component({
    selector: 'app-knowledge-graph',
    standalone: true,
    template: `
    <div class="kg-container">
      <div class="kg-header">
        @if (title) {
          <h3>{{ title }}</h3>
        }
      </div>
      <div class="kg-content">
        <div #graphContainer class="graph-surface"></div>
        
        @if (selectedNode()) {
          <div class="details-panel">
            <div class="details-header">
              <h4>Node Details</h4>
              <button class="close-btn" (click)="selectedNode.set(null)">×</button>
            </div>
            <div class="details-body">
              @for (prop of getNodeProps(); track prop.key) {
                <div class="prop-row">
                  <span class="prop-key">{{ prop.key }}:</span>
                  <span class="prop-value">{{ prop.value }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .kg-container {
      width: 100%;
      height: 600px;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      box-sizing: border-box;
    }
    
    .kg-header {
      margin-bottom: 1rem;
    }

    h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
    }

    .kg-content {
      flex: 1;
      display: flex;
      min-height: 0;
      position: relative;
    }

    .graph-surface {
      flex: 1;
      height: 100%;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #eee;
    }

    .details-panel {
      position: absolute;
      top: 10px;
      right: 10px;
      bottom: 10px;
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ddd;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 15px rgba(0,0,0,0.1);
      z-index: 100;
      backdrop-filter: blur(4px);
    }

    .details-header {
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fcfcfc;
    }

    .details-header h4 {
      margin: 0;
      font-size: 0.9rem;
      color: #555;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #999;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .details-body {
      padding: 0.75rem;
      overflow-y: auto;
      font-size: 0.85rem;
    }

    .prop-row {
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
    }

    .prop-key {
      font-weight: 600;
      color: #666;
      margin-bottom: 0.1rem;
    }

    .prop-value {
      color: #333;
      word-break: break-all;
    }
  `]
})
export class KnowledgeGraphComponent extends DynamicComponent<KnowledgeGraphNode> implements OnInit, OnDestroy {
    @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef<HTMLDivElement>;

    private cy?: cytoscape.Core;
    protected title = '';
    protected selectedNode = signal<any>(null);

    constructor() {
        super();
    }

    ngOnInit() {
        this.createGraph();
    }

    ngOnDestroy() {
        if (this.cy) {
            this.cy.destroy();
        }
    }

    protected getNodeProps() {
        const nodeData = this.selectedNode();
        if (!nodeData) return [];
        const props = nodeData.properties || nodeData;
        return Object.entries(props)
            .filter(([key]) => key !== 'properties') // Avoid circular or redundant display
            .map(([key, value]) => ({ key, value: typeof value === 'object' ? JSON.stringify(value) : value }));
    }

    private createGraph() {
        if (!this.graphContainer?.nativeElement) return;

        const comp = this.component();
        if (!comp || comp.type !== 'KnowledgeGraph') return;

        const props = comp.properties;
        this.title = props.title || '';
        let elements: any[] = [];
        try {
            const resolvedData = this.resolveData(props.data);
            if (resolvedData) {
                elements = this.processGraphData(resolvedData);
            }
        } catch (err) {
            return;
        }

        const layoutName = props.layout || 'grid';

        this.cy = cytoscape({
            container: this.graphContainer.nativeElement,
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(label)',
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '10px',
                        'width': '80px',
                        'height': '80px',
                        'text-wrap': 'wrap',
                        'text-max-width': '70px',
                        'line-height': 1.2
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '9px',
                        'text-rotation': 'autorotate',
                        'text-margin-y': -10
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': '3px',
                        'border-color': '#007bff',
                        'background-color': '#555'
                    }
                }
            ],
            layout: { name: layoutName } as any
        });

        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            this.selectedNode.set(node.data());
        });

        this.cy.on('tap', (evt) => {
            if (evt.target === this.cy) {
                this.selectedNode.set(null);
            }
        });

        setTimeout(() => {
            if (this.cy) {
                this.cy.layout({ name: layoutName, fit: true, padding: 30 } as any).run();
            }
        }, 100);
    }

    private resolveData(data: any): any {
        if (!data) return null;

        if (typeof data === 'object' && 'path' in data) {
            const resolved = this.processor.getData(this.component()!, data.path, this.surfaceId() || '');
            return this.unpackA2uiData(resolved);
        }
        return this.unpackA2uiData(data);
    }

    private unpackA2uiData(data: any): any {
        if (data === null || data === undefined) return null;

        if (data instanceof Map) {
            const obj: any = {};
            data.forEach((value, key) => {
                obj[key] = this.unpackA2uiData(value);
            });
            return obj;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.unpackA2uiData(item));
        }

        if (typeof data === 'object') {
            if (data.valueString !== undefined) return data.valueString;
            if (data.valueNumber !== undefined) return data.valueNumber;
            if (data.valueBoolean !== undefined) return data.valueBoolean;
            if (data.valueArray) return this.unpackA2uiData(data.valueArray);
            if (data.valueMap) return this.unpackA2uiData(data.valueMap);
        }

        return data;
    }

    private processGraphData(data: any): any[] {
        const elements: any[] = [];

        let items: any[] = [];

        if (Array.isArray(data)) {
            items = data;
        } else if (data && typeof data === 'object') {
            if (data.nodes) items.push(...(Array.isArray(data.nodes) ? data.nodes : []));
            if (data.edges) items.push(...(Array.isArray(data.edges) ? data.edges : []));

            if (items.length === 0) {
                const keys = Object.keys(data);
                if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
                    items = Object.values(data);
                }
            }
        }

        items.forEach((item, index) => {
            if (!item) return;

            if (item.source && item.target) {
                elements.push({
                    data: {
                        id: item.id || `e-${item.source}-${item.target}`,
                        source: item.source,
                        target: item.target,
                        label: item.label || ''
                    }
                });
            } else {
                elements.push({
                    data: {
                        id: item.id || item.name || `n${index}`,
                        label: item.label || item.name || item.id || 'Node',
                        properties: item // Store original item for details
                    }
                });
            }
        });

        return elements;
    }
}
